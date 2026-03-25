import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useWorkspace } from '../../context/WorkspaceContext.jsx';
import { api } from '../../lib/api.js';
import '../../new-styles/chatUI.css';

export default function ChatUI() {
  const { slug, threadId }        = useParams();
  const { workspace }             = useWorkspace();
  const navigate                  = useNavigate();

  const [thread, setThread]       = useState(null);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);

  const bottomRef   = useRef(null);
  const inputRef    = useRef(null);
  const streamIdRef = useRef(null);

  // Laad actief gesprek + berichten
  useEffect(() => {
    if (!threadId) {
      setThread(null);
      setMessages([]);
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

  // Scroll naar beneden bij nieuw bericht
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    setStreaming(true);

    let activeThreadId = threadId;

    // Geen actief gesprek — maak een nieuwe aan
    if (!activeThreadId) {
      const res = await api.post(`/workspaces/${slug}/chat/threads`, {
        title: text.slice(0, 60),
      });
      activeThreadId = res.data.id;
      setThread(res.data);
      navigate(`/w/${slug}/chat/${activeThreadId}`, { replace: true });
    }

    // Gebruikersbericht direct tonen
    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    // Leeg assistantbericht klaaarzetten voor streaming
    const assistantId = crypto.randomUUID();
    streamIdRef.current = assistantId;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}/workspaces/${slug}/chat/threads/${activeThreadId}/messages`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        }
      );

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId ? { ...m, content: m.content + chunk } : m
          )
        );
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Er ging iets mis. Probeer het opnieuw.' }
            : m
        )
      );
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="cui-root">

      {/* Mini-header */}
      <header className="cui-header">
        <div className="cui-breadcrumb">
          <span className="cui-breadcrumb-org">{workspace?.name}</span>
          {thread && (
            <>
              <span className="cui-breadcrumb-sep">›</span>
              <span className="cui-breadcrumb-thread">{thread.title}</span>
            </>
          )}
        </div>
      </header>

      {/* Berichten */}
      <div className="cui-messages">
        {messages.length === 0 ? (
          <div className="cui-empty">
            <div className="cui-empty-icon"><BubbleIcon /></div>
            <p className="cui-empty-title">Hoe kan ik je helpen?</p>
            <p className="cui-empty-sub">
              Stel een vraag over de documenten in {workspace?.name ?? 'deze workspace'}.
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`cui-msg cui-msg--${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="cui-msg-avatar"><LogoIcon /></div>
              )}
              <div className="cui-msg-bubble">
                {msg.content || <TypingDots />}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Invoer */}
      <div className="cui-input-wrap">
        <textarea
          ref={inputRef}
          className="cui-input"
          placeholder="Stel een vraag…"
          value={input}
          rows={1}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="cui-send"
          onClick={handleSend}
          disabled={!input.trim() || streaming}
        >
          <SendIcon />
        </button>
      </div>

    </div>
  );
}

function TypingDots() {
  return (
    <span className="cui-typing-dots">
      <span className="cui-dot" />
      <span className="cui-dot" />
      <span className="cui-dot" />
    </span>
  );
}

function BubbleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 4h14v11H12.5L9 18v-3H4V4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function LogoIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <rect x="1" y="1" width="4.5" height="4.5" rx="1.2" fill="currentColor"/>
      <rect x="7.5" y="1" width="4.5" height="4.5" rx="1.2" fill="currentColor" opacity=".6"/>
      <rect x="1" y="7.5" width="4.5" height="4.5" rx="1.2" fill="currentColor" opacity=".6"/>
      <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1.2" fill="currentColor" opacity=".3"/>
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 8l12-6-5 14-2-5-5-3z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  );
}