import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useOutletContext } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { BASE_URL } from '../../lib/api.js';
import { random, getErrorMessage } from '../../lib/utils.js';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

import ChatComposer from './ChatComposer.jsx';

import '../../styles/chatUI.css';
import '../../styles/markdown.css';

export default function ChatUI() {
  const { slug, chatId } = useParams();
  const { workspace }    = useWorkspace();
  const {
    activeChat, setTitleLoading, refreshChats,
    fetchMessages, createChat, sendMessage, streamMessage,
    setPendingStream, takePendingStream, trackBlobUrl,
  } = useChat();
  const { user }        = useAuth();
  const { onMenuClick } = useOutletContext() ?? {};
  const navigate        = useNavigate();
  const location        = useLocation();
  const toast           = useToast();

  const [scrolled, setScrolled]               = useState(false);
  const [messages, setMessages]               = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [draft, setDraft]                     = useState('');
  const [submitSignal, setSubmitSignal]       = useState(0);   // +1 = composer verstuurt draft
  const [chatLoading, setChatLoading]         = useState(false); // wacht op eerste byte
  const [isStreaming, setIsStreaming]         = useState(false);

  const abortRef            = useRef(null);  // AbortController van de lopende stream
  const chatIdRef           = useRef(chatId);
  const handledStateKeyRef  = useRef(null);
  const chatBodyRef         = useRef(null);
  const chatComposerRef     = useRef(null);
  const bottomRef           = useRef(null);
  const userMessageRef      = useRef(null);
  const assistantMessageRef = useRef(null);

  const busy = chatLoading || isStreaming;

  // ── Berichten laden bij chatwissel ───────
  useEffect(() => {
    chatIdRef.current = chatId;

    if (!chatId) {
      setMessages([]);
      setMessagesLoading(false);
      if (bottomRef.current) bottomRef.current.style.height = '0px';
      return;
    }

    // Net een nieuwe chat aangemaakt: niet ophalen, direct streamen
    const pending = takePendingStream(chatId);
    if (pending) {
      setMessages(pending.messages);
      setMessagesLoading(false);
      setChatLoading(true);
      startStream(pending);
      return () => abortRef.current?.abort();
    }

    let cancelled = false;
    setMessagesLoading(true);

    fetchMessages(chatId)
      .then(data => { if (!cancelled) setMessages(data); })
      .catch(err => {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          toast.error('Dit gesprek bestaat niet (meer).');
          navigate(`/w/${slug}`, { replace: true });
        } else {
          toast.error(getErrorMessage(err, 'Gesprek laden is mislukt.'));
        }
      })
      .finally(() => { if (!cancelled) setMessagesLoading(false); });

    // Wegnavigeren = lopende stream stoppen en oude response negeren
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [slug, chatId]);

  // ── Vraag meegegeven via navigatie (Ctrl+K, Overzicht, document) ──
  // navigate(`/w/${slug}`, { state: { draft: '…', send: true } })
  useEffect(() => {
    const state = location.state;
    if (!state?.draft || handledStateKeyRef.current === location.key) return;
    handledStateKeyRef.current = location.key;

    setDraft(state.draft);
    if (state.send) setSubmitSignal(n => n + 1);

    // State opruimen zodat terug/vernieuwen hem niet opnieuw verstuurt
    navigate(location.pathname, { replace: true, state: null });
  }, [location.key]);

  // ── Spacer zodat het nieuwste bericht bovenaan kan staan ──
  function updateSpacer() {
    if (
      !bottomRef.current ||
      !assistantMessageRef.current ||
      !chatBodyRef.current ||
      !chatComposerRef.current
    ) return;

    const chatBodyHeight   = chatBodyRef.current.offsetHeight;
    const composerHeight   = chatComposerRef.current.offsetHeight;
    const bubbleHeight     = assistantMessageRef.current.offsetHeight;
    const userBubbleHeight = userMessageRef.current?.offsetHeight ?? 0;

    const availableSpace = chatBodyHeight - composerHeight - 140 - bubbleHeight - userBubbleHeight;
    bottomRef.current.style.height = Math.max(0, availableSpace) + 'px';
  }

  useEffect(() => {
    if (!chatBodyRef.current) return;
    const observer = new ResizeObserver(() => updateSpacer());
    observer.observe(chatBodyRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    updateSpacer();
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 0 && !scrolled) setScrolled(true);
    else if (scrollTop === 0 && scrolled) setScrolled(false);
  };

  function patchMessage(id, fn) {
    setMessages(prev => prev.map(m => (m.id === id ? fn(m) : m)));
  }

  // ── Versturen ────────────────────────────
  const handleSubmit = async (payload, formData) => {
    if (busy) return;
    setChatLoading(true);

    const tempAssistantId = random();
    const startedInChatId = chatId;

    const imageItems = payload.files
      .filter(f => f.type.startsWith('image/'))
      .map(f => {
        const blob = URL.createObjectURL(f);
        trackBlobUrl(blob);
        return { type: 'image', originalname: f.name, blob, url: null };
      });

    const fileItems = payload.files
      .filter(f => !f.type.startsWith('image/'))
      .map(f => ({ type: 'file', originalname: f.name }));

    const userMessage = {
      id: random(),
      role: 'user',
      content: [
        ...imageItems,
        ...fileItems,
        ...(payload.message ? [{ type: 'text', text: payload.message }] : []),
      ],
    };

    const assistantMessage = {
      id: tempAssistantId,
      role: 'assistant',
      content: [
        { type: 'text', text: '' },
        { type: 'sources', sources: {} },
      ],
    };

    const previousMessages = messages;
    setMessages([...previousMessages, userMessage, assistantMessage]);

    // Bestanden zitten al in formData; de stream krijgt alleen de rest
    const streamPayload = {
      message:     payload.message,
      model:       payload.model,
      connections: payload.connections,
    };

    try {
      if (chatId) {
        const { assistantMessageId } = await sendMessage(chatId, formData);

        // Gebruiker is tijdens het versturen naar een andere chat gegaan
        if (chatIdRef.current !== startedInChatId) {
          setChatLoading(false);
          return;
        }

        patchMessage(tempAssistantId, m => ({ ...m, id: assistantMessageId }));
        startStream({ chatId, assistantId: assistantMessageId, payload: streamPayload });
      } else {
        const { chatId: newChatId, assistantMessageId } = await createChat(formData);

        if (chatIdRef.current !== startedInChatId) {
          setChatLoading(false);
          return;
        }

        const finalMessages = [
          ...previousMessages,
          userMessage,
          { ...assistantMessage, id: assistantMessageId },
        ];
        setMessages(finalMessages);
        setPendingStream({
          chatId: newChatId,
          assistantId: assistantMessageId,
          payload: streamPayload,
          messages: finalMessages,
        });
        setTitleLoading(true);
        navigate(`/w/${slug}/chat/${newChatId}`);
      }
    } catch (err) {
      // Optimistische berichten terugdraaien en tekst teruggeven
      setMessages(previousMessages);
      setDraft(current => current || payload.message);
      setChatLoading(false);
      toast.error(getErrorMessage(err, 'Bericht versturen is mislukt.'));
    }
  };

  // ── Streamen ─────────────────────────────
  async function startStream({ chatId: streamChatId, assistantId, payload }) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamMessage({
        chatId: streamChatId,
        assistantId,
        payload,
        signal: controller.signal,
        onOpen: () => {
          setChatLoading(false);
          setIsStreaming(true);
        },
        onEvent: data => {
          if (data.type === 'token') {
            patchMessage(assistantId, m => ({
              ...m,
              content: m.content.map(c =>
                c.type === 'text' ? { ...c, text: c.text + data.content } : c
              ),
            }));
            requestAnimationFrame(updateSpacer);
          }

          if (data.type === 'sources') {
            patchMessage(assistantId, m => ({
              ...m,
              content: m.content.map(c =>
                c.type === 'sources' ? { ...c, sources: data.content } : c
              ),
            }));
          }

          if (data.type === 'error') {
            patchMessage(assistantId, m => ({ ...m, status: 'error' }));
            toast.error(data.content || 'Er ging iets mis bij het genereren van het antwoord.');
          }

          if (data.type === 'done') {
            patchMessage(assistantId, m => ({ ...m, status: 'done' }));
            // Titel en volgorde in de sidebar bijwerken
            refreshChats().catch(() => {});
          }
        },
      });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      patchMessage(assistantId, m => ({ ...m, status: 'error' }));
      toast.error(getErrorMessage(err, 'Antwoord ophalen is mislukt.'));
    } finally {
      // Alleen resetten als er intussen geen nieuwe stream is gestart
      if (abortRef.current === controller) {
        abortRef.current = null;
        setChatLoading(false);
        setIsStreaming(false);
        setTitleLoading(false);
      }
    }
  }

  const lastIndex = messages.length - 1;
  const isEmpty   = !messagesLoading && messages.length === 0;
  const firstName = user?.name?.split(' ')[0] ?? '';
  const logoUrl   = workspace?.logo_resource_url ? `${BASE_URL}${workspace.logo_resource_url}` : null;

  return (
    <main className="chatBody" ref={chatBodyRef} onScroll={handleScroll}>

      <div className={`chatHeader ${scrolled ? 'scrolled' : ''}`}>
        <div className="chatHeader-left">
          {onMenuClick && (
            <button className="chatHeader-hamburger" onClick={onMenuClick} aria-label="Menu openen">
              <HamburgerIcon />
            </button>
          )}
          <div className="chatHeader-identity">
            {activeChat?.title ? (
              <span className="chatHeader-title">{activeChat.title}</span>
            ) : chatId ? (
              <span className="chatHeader-title chatHeader-title--muted">Gesprek</span>
            ) : null}
          </div>
        </div>
        {chatId && (
          <button
            className="chatHeader-new"
            onClick={() => navigate(`/w/${slug}`)}
            title="Nieuw gesprek"
          >
            <PlusIcon /> <span>Nieuw</span>
          </button>
        )}
      </div>

      <div className={`chatBodyWrapper ${isEmpty ? 'chatBodyWrapper--empty' : ''}`}>
        <div className="chatMessages">
          {messagesLoading ? null : isEmpty ? (
            <div className="chat-empty">
              <div className="chat-empty-logo">
                {logoUrl ? <img src={logoUrl} alt="" /> : (workspace?.name?.[0]?.toUpperCase() ?? 'R')}
              </div>
              <h1 className="chat-empty-title">
                {greeting()}{firstName ? `, ${firstName}` : ''}
              </h1>
              <p className="chat-empty-sub">
                Wat wil je weten over <strong>{workspace?.name ?? 'je workspace'}</strong>?
              </p>
              <div className="chat-empty-suggestions">
                {SUGGESTIONS.map(sug => (
                  <button
                    key={sug}
                    type="button"
                    className="chat-empty-suggestion"
                    onClick={() => setDraft(sug)}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, index) => {
              const text        = m.content?.find(c => c.type === 'text')?.text ?? '';
              const sources     = m.content?.find(c => c.type === 'sources')?.sources;
              const attachments = m.content?.filter(c => c.type === 'image' || c.type === 'file') ?? [];

              // Puntjes tot het eerste token binnen is
              const waiting =
                m.role === 'assistant' &&
                index === lastIndex &&
                busy &&
                !text &&
                m.status !== 'error';

              return (
                <div
                  key={m.id}
                  className={`row ${m.role === 'user' ? 'rowUser' : 'rowAssistant'}`}
                  ref={
                    index === lastIndex ? assistantMessageRef
                    : index === lastIndex - 1 ? userMessageRef
                    : null
                  }
                >
                  {m.role === 'user' && (
                    <div className="bubble bubbleUser">
                      {attachments.length > 0 && (
                        <div className="bubbleUser-attachments">
                          {attachments.map((item, i) => (
                            item.type === 'image' ? (
                              <div key={i} className="bubbleUser-image-wrap">
                                <img
                                  src={item.url ? `${BASE_URL}${item.url}` : item.blob}
                                  alt={item.originalname ?? 'Afbeelding'}
                                  className="bubbleUser-image"
                                />
                              </div>
                            ) : (
                              <div key={i} className="bubbleUser-file">
                                <FileIcon />
                                <span className="bubbleUser-file-name">{item.originalname}</span>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                      {text && <p className="bubbleUser-text">{text}</p>}
                    </div>
                  )}

                  {m.role === 'assistant' && (
                    waiting ? (
                      <TypingDots />
                    ) : (
                      <div className="bubble bubbleAssistant">
                        {text && (
                          <div className="markdown">
                            <ReactMarkdown
                              rehypePlugins={[rehypeRaw, rehypeHighlight]}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p:  ({ children }) => <p>{parseCitations(children, sources)}</p>,
                                li: ({ children }) => <li>{parseCitations(children, sources)}</li>,
                              }}
                            >
                              {text}
                            </ReactMarkdown>
                          </div>
                        )}
                        {m.status === 'error' && (
                          <p className="bubbleAssistant-error">
                            {text ? 'Het antwoord is onderbroken.' : 'Er ging iets mis. Probeer het opnieuw.'}
                          </p>
                        )}
                        {!text && m.status !== 'error' && (
                          <p className="bubbleAssistant-empty">Geen antwoord ontvangen.</p>
                        )}
                        {text && !(busy && index === lastIndex) && (
                          <div className={`msg-actions ${index === lastIndex ? 'msg-actions--visible' : ''}`}>
                            <CopyButton text={text} />
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div ref={chatComposerRef} className="chatComposerDock">
          <ChatComposer
            draft={draft}
            setDraft={setDraft}
            handleSubmit={handleSubmit}
            busy={busy}
            submitSignal={submitSignal}
            focusKey={`${chatId ?? 'new'}-${location.key}`}
          />
          {isEmpty && (
            <p className="chat-disclaimer">
              Raggy zoekt in de documenten en connecties van {workspace?.name ?? 'deze workspace'}. Controleer belangrijke antwoorden.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

const SUGGESTIONS = [
  'Vat het nieuwste document samen',
  'Welke afspraken staan er in onze contracten?',
  'Zoek alles over facturatie',
];

function greeting() {
  const h = new Date().getHours();
  if (h < 6)  return 'Goedenacht';
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function CopyButton({ text }) {
  const toast               = useToast();
  const [copied, setCopied] = useState(false);
  const timerRef            = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function handleCopy() {
    try {
      // Bronverwijzingen [1] niet meekopiëren
      await navigator.clipboard.writeText(text.replace(/\s?\[\d+\]/g, '').trim());
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Kopiëren is mislukt.');
    }
  }

  return (
    <button
      type="button"
      className="msg-action"
      onClick={handleCopy}
      title={copied ? 'Gekopieerd' : 'Kopiëren'}
      aria-label={copied ? 'Gekopieerd' : 'Kopiëren'}
    >
      {copied ? <CheckSmallIcon /> : <CopyIcon />}
    </button>
  );
}

function TypingDots() {
  return (
    <div className="typing-indicator" aria-label="Antwoord wordt gegenereerd">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <line x1="2" y1="4" x2="14" y2="4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="2" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line x1="6" y1="1.5" x2="6" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 1h6L11 3.5V13H2.5V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8.5 1v2.5H11" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4.5" y="4.5" width="8" height="8" rx="1.8" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M9.5 4.5V3.3A1.8 1.8 0 0 0 7.7 1.5H3.3A1.8 1.8 0 0 0 1.5 3.3v4.4a1.8 1.8 0 0 0 1.8 1.8h1.2" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function CheckSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function parseCitations(children, sources) {
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child;

    const parts = child.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) return <CitationBadge key={i} id={match[1]} sources={sources} />;
      return part;
    });
  });
}

function CitationBadge({ id, sources }) {
  const source     = sources?.[id];
  const badgeRef   = useRef(null);
  const tooltipRef = useRef(null);

  const handleMouseEnter = () => {
    const badge     = badgeRef.current;
    const tooltip   = tooltipRef.current;
    const container = badge?.closest('.chatMessages');
    if (!badge || !tooltip || !container) return;

    tooltip.style.display = 'flex';

    const badgeRect     = badge.getBoundingClientRect();
    const tooltipRect   = tooltip.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    let left = (badgeRect.width / 2) - (tooltipRect.width / 2);

    if (badgeRect.left + left < containerRect.left + 8) {
      left = containerRect.left - badgeRect.left + 8;
    }
    if (badgeRect.left + left + tooltipRect.width > containerRect.right - 8) {
      left = containerRect.right - badgeRect.left - tooltipRect.width - 8;
    }

    tooltip.style.left      = `${left}px`;
    tooltip.style.transform = 'none';
  };

  const handleMouseLeave = () => {
    if (tooltipRef.current) tooltipRef.current.style.display = '';
  };

  if (!source) return <span>[{id}]</span>;

  const { summary, title, webUrl } = source.metadata ?? {};

  return (
    <span
      className="citation-badge"
      ref={badgeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="citation-number">{id}</span>
      <span className="citation-tooltip" ref={tooltipRef}>
        <span className="citation-tooltip-header">
          <span className="citation-tooltip-index">{id}</span>
          <span className="citation-tooltip-title">{title}</span>
        </span>
        <span className="citation-tooltip-divider" />
        {summary && <span className="citation-tooltip-excerpt">{summary}</span>}
        {webUrl && (
          <a href={webUrl} target="_blank" rel="noreferrer" className="citation-tooltip-link">
            Bekijk artikel →
          </a>
        )}
      </span>
    </span>
  );
}