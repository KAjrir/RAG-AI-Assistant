import { useEffect, useRef, useState } from 'react';
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
import '../../styles/chatUI.css';
import '../../styles/markdown.css';

export default function ChatUI() {
  const { slug, chatId }                        = useParams();
  const { workspace }                           = useWorkspace();
  const { activeChat, setChats, setActiveChat } = useChat();
  const { onMenuClick }                         = useOutletContext();
  const navigate                                = useNavigate();
  
  const [scrolled, setScrolled]                 = useState(false)
  const [messages, setMessages]                 = useState([]);
  const [draft, setDraft]                       = useState('');
  const [chatLoading, setChatLoading]           = useState(false);
  const [isStreaming, setIsStreaming]           = useState(false);

  const assistantIdRef = useRef(null)
  const pendingStreamRef = useRef(null);

  const chatBodyRef                             = useRef(null);
  const chatComposerRef                         = useRef(null);
  const inputRef                                = useRef(null);
  const bottomRef                               = useRef(null);
  const userMessageRef                          = useRef(null);
  const assistantMessageRef                     = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', random());
    }
  }, []);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      if (bottomRef.current) bottomRef.current.style.height = '0px';
      return;
    }

    // Check of er een pending stream klaarstaat (van nieuwe chat flow)
    if (pendingStreamRef.current) {
      const pending = pendingStreamRef.current;
      pendingStreamRef.current = null;
      // Geen fetch nodig — messages staan al in state via optimistic update
      startStream(pending);
      return;
    }

    // Normale load van bestaande chat
    api.get(`/workspaces/${slug}/chats/${chatId}`).then(res => {
      setMessages(res.data);

      const streamingMsg = res.data.find(m => m.status === 'streaming');
      if (streamingMsg) {
        assistantIdRef.current = streamingMsg.id;
        // Hier geen message nodig want we hervatten een bestaande stream
        startStream({ chatId, message: null, assistantId: streamingMsg.id });
      }
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

  useEffect(() => {
    function handleKeyDown(e) {
      const tag = e.target.tagName;

      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        e.target.isContentEditable
      ) {
        return; // 👉 NIET ingrijpen
      }

      if (document.activeElement !== inputRef.current && e.key.length === 1) {
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') inputRef.current?.blur();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;

    if (scrollTop > 0 && !scrolled) {
      setScrolled(true);
    } else if (scrollTop === 0 && scrolled) {
      setScrolled(false);
    }
  };

  const handleSubmit = async (text) => {
    if (!text.trim() || chatLoading || isStreaming) return;
    setChatLoading(true);
    setDraft('');

    // Optimistisch de user bubble + lege assistant bubble toevoegen
    const tempAssistantId = random();
    setMessages(prev => [
      ...prev,
      { id: random(), role: 'user', content: text },
      { id: tempAssistantId, role: 'assistant', content: '' },
    ]);

    if (chatId) {
      // Bestaande chat — direct messages aanmaken en streamen
      const res = await api.post(`/workspaces/${slug}/chats/${chatId}/messages`, { message: text });
      assistantIdRef.current = res.data.assistantMessageId;

      // Update de tijdelijke assistant bubble met het echte ID
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempAssistantId
            ? { ...msg, id: res.data.assistantMessageId }
            : msg
        )
      );

      startStream({ chatId, message: text, assistantId: res.data.assistantMessageId });
    } else {
      // Nieuwe chat — maak aan, sla stream op als pending, navigeer
      const res = await api.post(`/workspaces/${slug}/chats`, { message: text });
      const { chatId: newChatId, assistantMessageId } = res.data;

      assistantIdRef.current = assistantMessageId;

      // Update de tijdelijke assistant bubble met het echte ID
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempAssistantId
            ? { ...msg, id: assistantMessageId }
            : msg
        )
      );

      // Sla de stream op als pending — de useEffect pikt dit op na navigate
      pendingStreamRef.current = { chatId: newChatId, message: text, assistantId: assistantMessageId };

      navigate(`/w/${slug}/chat/${newChatId}`);
    }
  };

  const startStream = async ({ chatId, message, assistantId }) => {
    const sessionId = localStorage.getItem('session_id');
    const url = `${BASE_URL}/api/workspaces/${slug}/chats/messages`;

    assistantIdRef.current = assistantId

    const response = await fetch(url, {
      method: "POST",
      credentials: 'include',
      headers: {
        'Content-Type': "application/json"
      },
      body: JSON.stringify({
        message,
        chatId,
        sessionId,
        assistantId
      })
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    setChatLoading(false);
    setIsStreaming(true);

    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer = buffer + decoder.decode(value, { stream: true });

      const parts = buffer.split("\n")
      buffer = parts.pop()

      for (const part of parts) {
        if (!part.trim()) continue

        const data = JSON.parse(part);

        if(data.event === "token"){
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantIdRef.current
                ? { ...msg, content: msg.content + data.content }
                : msg
            )
          );
          updateSpacer();
        }

        if (data.event === "done") {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantIdRef.current
                ? { ...msg, status: "done" }
                : msg
            )
          );
          
          api.get(`/workspaces/${slug}/chats`)
          .then(res => {
            setChats(res.data);
            const updated = res.data.find(c => c.id === chatId);
            if (updated) setActiveChat(updated); 
          })
        }
      }
    }
    setIsStreaming(false);
  }

  return (
    <main className="chatBody" ref={chatBodyRef} onScroll={handleScroll}>

      <div className={`chatHeader ${scrolled ? "scrolled" : ""}`}>
        <div className="chatHeader-left">
          <button className="chatHeader-hamburger" onClick={onMenuClick}>
            <HamburgerIcon />
          </button>
            <div className="chatHeader-identity">
              {activeChat && <span className="chatHeader-title">{activeChat?.title || ""}</span> }
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
                    {m.content}
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
                  handleSubmit(draft)
                }
              }}
            />
            <button
              className="chatSend"
              onClick={() => handleSubmit(draft)}
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