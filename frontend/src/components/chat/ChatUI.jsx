import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { api } from '../../lib/api.js';
import { random } from '../../lib/utils.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import '../../new-styles/chatUI.css';
import '../../new-styles/markdown.css';

export default function ChatUI() {
  const { slug, threadId }            = useParams();
  const { workspace }                 = useWorkspace();
  const navigate                      = useNavigate();

  const [thread, setThread]           = useState(null);
  const [messages, setMessages]       = useState([]);
  const [draft, setDraft]             = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const chatBodyRef         = useRef(null);
  const chatComposerRef     = useRef(null);
  const inputRef            = useRef(null);
  const bottomRef           = useRef(null);
  const userMessageRef      = useRef(null);
  const assistantMessageRef = useRef(null);

  // ── Session id in localStorage ────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', random());
    }
  }, []);

  // ── Laad gesprek + berichten ──────────────────────────────────────
  useEffect(() => {
    if (!threadId) {
      setThread(null);
      setMessages([]);
      if (bottomRef.current) bottomRef.current.style.height = '0px';
      return;
    }
    Promise.all([
      api.get(`/workspaces/${slug}/chat/threads/${threadId}`),
      api.get(`/workspaces/${slug}/chat/threads/${threadId}/messages`),
    ]).then(([threadRes, msgsRes]) => {
      setThread(threadRes.data);
      setMessages(msgsRes.data);
    });
  }, [slug, threadId]);

  // ── Spacer berekening ─────────────────────────────────────────────
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

    const availableSpace = chatBodyHeight - composerHeight - 95 - bubbleHeight - userBubbleHeight;
    bottomRef.current.style.height = Math.max(0, availableSpace) + 'px';
  }

  // ── ResizeObserver ────────────────────────────────────────────────
  useEffect(() => {
    if (!chatBodyRef.current) return;
    const observer = new ResizeObserver(() => updateSpacer());
    observer.observe(chatBodyRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Scroll + spacer bij nieuwe berichten ─────────────────────────
  useEffect(() => {
    updateSpacer();
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ── Globale keydown ───────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      if (document.activeElement !== inputRef.current && e.key.length === 1) {
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') inputRef.current?.blur();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Versturen ─────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    if (!text.trim() || chatLoading) return;

    setChatLoading(true);
    setDraft('');

    const userId      = random();
    const assistantId = random();

    // let activeThreadId = threadId;
    // if (!activeThreadId) {
    //   const res = await api.post(`/workspaces/${slug}/chat/threads`, {
    //     title: text.slice(0, 60),
    //   });
    //   activeThreadId = res.data.id;
    //   setThread(res.data);
    //   navigate(`/w/${slug}/chat/${activeThreadId}`, { replace: true });
    // }

    setMessages(prev => [
      ...prev,
      { id: userId,      role: 'user',      content: text, done: true  },
      { id: assistantId, role: 'assistant',  content: '',   done: false },
    ]);

    const sessionId = localStorage.getItem('session_id');

    const url =
      `${import.meta.env.VITE_API_URL}/api/chats/messages?session_id=${encodeURIComponent(sessionId)}&message=${encodeURIComponent(text)}`
      // &thread_id=${encodeURIComponent(activeThreadId)}

    const response = await fetch(url, { 
      method: "POST",
      credentials: 'include',
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    setChatLoading(false);
    setIsStreaming(true);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantId
            ? { ...msg, content: msg.content + chunk }
            : msg
        )
      );
      updateSpacer();
    }

    setIsStreaming(false);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === assistantId ? { ...msg, done: true } : msg
      )
    );
  };

  return (
    <main className="chatBody" ref={chatBodyRef}>
      <div className="chatBodyWrapper">

        {/* Breadcrumb header */}
        <div className="chatBreadcrumb">
          <span className="chatBreadcrumb-org">{workspace?.name}</span>
          {thread && (
            <>
              <span className="chatBreadcrumb-sep">›</span>
              <span className="chatBreadcrumb-thread">{thread.title}</span>
            </>
          )}
        </div>

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
                    {m.content}
                  </div>
                )}

                {m.role === 'assistant' && (
                  chatLoading && !m.done ? (
                    <TypingDots />
                  ) : (
                    <div className="bubble bubbleAssistant">
                      <div className="markdown">
                        <ReactMarkdown
                          rehypePlugins={[rehypeRaw, rehypeHighlight]}
                          remarkPlugins={[remarkGfm]}
                        >
                          {m.content}
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

        <div className="chatComposer" ref={chatComposerRef}>
          <div className="chatInputWrapper">
            <textarea
              ref={inputRef}
              name="chatInput"
              className="chatInput"
              placeholder="Typ een bericht…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(draft);
                }
              }}
            />
            <button
              className="chatSend"
              onClick={() => sendMessage(draft)}
              disabled={chatLoading || isStreaming}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 7-7 7 7"/>
                <path d="M12 19V5"/>
              </svg>
            </button>
          </div>
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