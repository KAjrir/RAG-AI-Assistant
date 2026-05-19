import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { useOutletContext } from 'react-router';
import { api, BASE_URL } from '../../lib/api.js';
import { random } from '../../lib/utils.js';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

import ChatComposer from './ChatComposer.jsx';

import '../../styles/chatUI.css';
import '../../styles/markdown.css';

export default function ChatUI() {
  const { slug, chatId }                            = useParams();
  const { workspace }                               = useWorkspace();
  const { activeChat, setChats, setActiveChat, setTitleLoading } = useChat();
  const { onMenuClick }                             = useOutletContext();
  const navigate                                    = useNavigate();

  const [scrolled, setScrolled]                     = useState(false);
  const [messages, setMessages]                     = useState([]);
  const [draft, setDraft]                           = useState('');
  const [chatLoading, setChatLoading]               = useState(false);
  const [isStreaming, setIsStreaming]               = useState(false);

  const assistantIdRef                              = useRef(null);
  const pendingStreamRef                            = useRef(null);
  const chatBodyRef                                 = useRef(null);
  const chatComposerRef                             = useRef(null);
  const bottomRef                                   = useRef(null);
  const userMessageRef                              = useRef(null);
  const assistantMessageRef                         = useRef(null);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      if (bottomRef.current) bottomRef.current.style.height = '0px';
      return;
    }

    if (pendingStreamRef.current) {
      const pending = pendingStreamRef.current;
      pendingStreamRef.current = null;
      startStream(pending);
      return;
    }

    api.get(`/workspaces/${slug}/chats/${chatId}`).then(res => {
      setMessages(res.data);

      // const streamingMsg = res.data.find(m => m.status === 'streaming');
      // if (streamingMsg) {
      //   assistantIdRef.current = streamingMsg.id;
      //   startStream({ chatId, message: null, assistantId: streamingMsg.id });
      // }
    });
  }, [slug, chatId]);

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

  // ── handleSubmit krijgt model + connections mee van ChatComposer ──
  const handleSubmit = async (payload, formData) => {
    if (chatLoading || isStreaming) return;

    setChatLoading(true);

    const tempAssistantId = random();
    setMessages(prev => [
      ...prev,
      {
        id: random(),
        role: 'user',
        content: [
          // Afbeeldingen
          ...payload.files
            .filter(f => f.type.startsWith('image/'))
            .map(f => ({
              type: 'image',
              originalname: f.name,
              blob: URL.createObjectURL(f),
              url: null
            })),
          // Bestanden
          ...payload.files
            .filter(f => !f.type.startsWith('image/'))
            .map(f => ({
              type: 'file',
              originalname: f.name,
            })),
          // Tekst
          ...(payload.message ? [{ type: 'text', text: payload.message }] : [])
        ]
      },
      { 
        id: tempAssistantId,
        role: 'assistant',
        content: [
          { type: 'text', text: '' },
          {
            type: 'sources', sources: {},
          }
        ]
      }
    ]);

    if (chatId) {
      const res = await api.post(`/workspaces/${slug}/chats/${chatId}/messages`, formData);
      assistantIdRef.current = res.data.assistantMessageId;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempAssistantId
            ? { ...msg, id: res.data.assistantMessageId }
            : msg
        )
      );

      startStream({ chatId, assistantId: res.data.assistantMessageId, payload});
    } else {
      const res = await api.post(`/workspaces/${slug}/chats`, formData)
      const { chatId: newChatId, assistantMessageId } = res.data;
      assistantIdRef.current = assistantMessageId;

      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempAssistantId
            ? { ...msg, id: assistantMessageId }
            : msg
        )
      );
      
      pendingStreamRef.current = { chatId: newChatId, assistantId: assistantMessageId, payload };
      console.log(payload)
      setTitleLoading(true);
      navigate(`/w/${slug}/chat/${newChatId}`);
    }
  };

  const startStream = async ({ chatId, assistantId, payload }) => {
    const url = `${BASE_URL}/api/workspaces/${slug}/chats/messages`;

    assistantIdRef.current = assistantId;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, assistantId, payload }),
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    setChatLoading(false);
    setIsStreaming(true);

    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n');
      buffer = parts.pop();

      for (const part of parts) {
        if (!part.trim()) continue;

        const data = JSON.parse(part);

        if (data.type === 'token') {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantIdRef.current
                ? { ...msg, 
                    content: msg.content.map(c => 
                      c.type === "text"
                        ? {...c, text: c.text + data.content}
                        : c
                    )
                  }
                : msg
            )
          );
          updateSpacer();
        }

        if(data.type === "sources") {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantIdRef.current
                ? { ...msg, 
                    content: msg.content.map(c => 
                      c.type === "sources"
                        ? {...c, sources: data.content}
                        : c
                    )
                  }
                : msg
            )
          );
        }

        if (data.type === 'done') {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantIdRef.current
                ? { ...msg, status: 'done' }
                : msg
            )
          );

          api.get(`/workspaces/${slug}/chats`).then(res => {
            setChats(res.data);
            const updated = res.data.find(c => c.id === chatId);
            if (updated) setActiveChat(updated);
          });

          setTitleLoading(false);
        }
      }
    }

    setTitleLoading(false);
    setIsStreaming(false);
  };

  return (
    <main className="chatBody" ref={chatBodyRef} onScroll={handleScroll}>

      <div className={`chatHeader ${scrolled ? 'scrolled' : ''}`}>
        <div className="chatHeader-left">
          <button className="chatHeader-hamburger" onClick={onMenuClick}>
            <HamburgerIcon />
          </button>
          <div className="chatHeader-identity">
            {activeChat && <span className="chatHeader-title">{activeChat?.title || ''}</span>}
            <span className="chatHeader-workspace" onClick={() => navigate(`/w/${slug}`)}>
              {workspace?.name}
            </span>
          </div>
        </div>
        <button className="chatHeader-share">
          <ShareIcon />
        </button>
      </div>

      <div className="chatBodyWrapper">
        <div className="chatMessages">
          {messages.length === 0 ? (
            <div className="no-messages">Waar kan ik je mee helpen?</div>
          ) : (
            messages.map((m, index) => (
              <div
                key={m.id}
                className={`row ${m.role === 'user' ? 'rowUser' : 'rowAssistant'}`}
                ref={
                  index === messages.length - 1 ? assistantMessageRef
                  : index === messages.length - 2 ? userMessageRef
                  : null
                }
              >
                {m.role === 'user' && (
                  <div className="bubble bubbleUser">
                    {/* Bestanden en afbeeldingen */}
                    {m.content.filter(c => c.type === 'image' || c.type === 'file').length > 0 && (
                      <div className="bubbleUser-attachments">
                        {m.content.filter(c => c.type === 'image' || c.type === 'file').map((item, i) => (
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

                    {/* Tekst */}
                    {m.content.find(c => c.type === 'text')?.text && (
                      <p className="bubbleUser-text">
                        {m.content.find(c => c.type === 'text').text}
                      </p>
                    )}
                  </div>
                )}

                {m.role === 'assistant' && (
                  chatLoading && index === messages.length - 1 ? (
                    <TypingDots />
                  ) : (
                    <div className="bubble bubbleAssistant">
                      <div className="markdown">
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw, rehypeHighlight]}
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p>{parseCitations(children, m.content.find(c => c.type === 'sources')?.sources)}</p>
                            ),
                            li: ({ children }) => (
                              <li>{parseCitations(children, m.content.find(c => c.type === 'sources')?.sources)}</li>
                            )
                          }}
                        >
                          {m.content.find(c => c.type === 'text')?.text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div ref={chatComposerRef} style={{ position: 'sticky', bottom: 0 }}>
          <ChatComposer
            draft={draft}
            setDraft={setDraft}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>
    </main>
  );
}

function TypingDots() {
  return (
    <div className="typing-indicator">
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

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M10 1.5L12.5 4L10 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.5 4H5.5C3.8 4 2.5 5.3 2.5 7v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
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

function parseCitations(children, sources) {
  return React.Children.map(children, child => {
    if (typeof child !== 'string') return child
    
    const parts = child.split(/(\[\d+\])/g)
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/)
      if (match) {
        return <CitationBadge key={i} id={match[1]} sources={sources} />
      }
      return part
    })
  })
}

function CitationBadge({ id, sources }) {
  const source = sources?.[id]
  const badgeRef = useRef(null)
  const tooltipRef = useRef(null)

  const handleMouseEnter = () => {
    const badge = badgeRef.current
    const tooltip = tooltipRef.current
    if (!badge || !tooltip) return

    tooltip.style.display = 'flex'

    const badgeRect = badge.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const containerRect = badge.closest('.chatMessages').getBoundingClientRect()

    // standaard: gecentreerd
    let left = (badgeRect.width / 2) - (tooltipRect.width / 2)

    // te ver naar links
    if (badgeRect.left + left < containerRect.left + 8) {
      left = containerRect.left - badgeRect.left + 8
    }

    // te ver naar rechts
    if (badgeRect.left + left + tooltipRect.width > containerRect.right - 8) {
      left = containerRect.right - badgeRect.left - tooltipRect.width - 8
    }

    tooltip.style.left = `${left}px`
    tooltip.style.transform = 'none'
  }

  const handleMouseLeave = () => {
    const tooltip = tooltipRef.current
    if (tooltip) tooltip.style.display = ''
  }

  if (!source) return <span>[{id}]</span>

  const summary = source.metadata?.summary
  const title = source.metadata?.title
  const webUrl = source.metadata?.webUrl

  return (
    <span
      className="citation-badge"
      ref={badgeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="citation-number">{id}</span>
      <div className="citation-tooltip" ref={tooltipRef}>
        <div className="citation-tooltip-header">
          <div className="citation-tooltip-index">{id}</div>
          <span className="citation-tooltip-title">{title}</span>
        </div>
        <div className="citation-tooltip-divider"></div>
        {summary && (
          <span className="citation-tooltip-excerpt">{summary}</span>
        )}
        {webUrl && (
          <a
            href={webUrl}
            target="_blank"
            rel="noreferrer"
            className="citation-tooltip-link"
          >
            Bekijk artikel →
          </a>
        )}
      </div>
    </span>
  )
}