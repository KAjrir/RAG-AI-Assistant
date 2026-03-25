import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { random } from "../../utils.js"

import { api } from "../lib/api.js";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

import TypingDots from "./TypingDots";
import "../new-styles/markdown.css"


const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [draft, setDraft] = useState("");

  const chatComposerRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const chatBodyRef = useRef(null);
  const userMessageRef = useRef(null);
  const assistantMessageRef = useRef(null);

  const navigate = useNavigate();
  const { orgSlug, id } = useParams();


  useEffect(() => {
    if (!id) {
      setMessages([])
      bottomRef.current.style.height = "0px"
      return
    };
    fetch(`${API_URL}/api/chats/${id}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data)
      })
  }, [id]);

  function updateSpacer() {
    if (!bottomRef.current || !assistantMessageRef.current || !chatBodyRef.current || !chatComposerRef.current) return;

    const chatBodyHeight = chatBodyRef.current.offsetHeight;
    const composerHeight = chatComposerRef.current.offsetHeight;
    const bubbleHeight = assistantMessageRef.current.offsetHeight;
    const userBubbleHeight = userMessageRef.current?.offsetHeight ?? 0;

    const availableSpace = chatBodyHeight - composerHeight - 95 - bubbleHeight - userBubbleHeight;
    // console.log(chatBodyHeight, composerHeight, bubbleHeight, userBubbleHeight)

    bottomRef.current.style.height = Math.max(0, availableSpace) + 'px';
  }

  useEffect(() => {
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", crypto.randomUUID());
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement !== inputRef.current && e.key.length === 1) {
        inputRef.current?.focus();
      }

      if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!chatBodyRef.current) return;

    const observer = new ResizeObserver(() => {
      updateSpacer();
    });

    observer.observe(chatBodyRef.current);

    return () => observer.disconnect();
  }, []);

  // auto-scroll naar nieuwste bericht
  useEffect(() => {
    updateSpacer()
    scrollDownSmooth(bottomRef)
  }, [messages.length]);

  const sendMessage = async (content) => {
    if (!content.trim() || chatLoading) return;
    
    setChatLoading(true);
    setChatError(null)
    setDraft("");
    
    const userId = random()
    const assistantId = random()

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content },
      { id: assistantId, role: "assistant", done: false, content: "" },
    ]);
    
    const sessionId = localStorage.getItem("session_id");
    let response;

    const url =
      `${API_URL}/api/chats/messages` +
      `?session_id=${encodeURIComponent(sessionId)}` +
      `&message=${encodeURIComponent(content)}`;

    try {
      response = await fetch(url, {
        credentials: "include"
      });

      if(!response.ok) throw new Error(response.statusText)

    } catch (err) {
      console.error(err)
      setChatLoading(false);
      setChatError("Er ging iets mis. Probeer het opnieuw...")
      return
    }

    console.log(response)

    let full_text = "";

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    setChatLoading(false);
    setIsStreaming(true);
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const bufferText = decoder.decode(value, { stream: true });
      full_text += bufferText;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: msg.content + bufferText }
            : msg,
        ),
      );

      updateSpacer()

    }

    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantId ? { ...msg, done: true } : msg,
      ),
    );
  };

  return (
    <>
      <main className="chatBody" ref={chatBodyRef}>
        <div className="chatBodyWrapper">
          <div className="chatMessages">
            {messages.length > 0 ? (
              messages.map((m, index) => (
                <div
                  key={m.id}
                  className={`row ${m.role === "user" ? "rowUser" : "rowAssistant"}`}
                  ref={index === messages.length - 1 ? assistantMessageRef : index === messages.length -2 ? userMessageRef : null}
                >
                  {m.role === "user" && (
                    <div
                      className={`bubble ${m.role === "user" ? "bubbleUser" : "bubbleAssistant"}`}
                    >
                      {m.content}
                    </div>
                  )}
                  {m.role === "assistant" &&
                    (chatLoading && !m.done ? (
                      <TypingDots />
                    ) : (
                      <div className={`bubble bubbleAssistant`}>
                        <div className="markdown">
                          <ReactMarkdown
                            rehypePlugins={[rehypeRaw, rehypeHighlight]}
                            remarkPlugins={[remarkGfm]}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                </div>
              ))
            ) : (
              <div className="no-messages">Waar kan ik je mee helpen?</div>
            )}

            {chatError && <div className="chat-error">{chatError}</div>}
            <div ref={bottomRef}></div>
          </div>

          <div className="chatComposer" ref={chatComposerRef}>
              <div className="chatInputWrapper">
                <textarea
                name="chatInput"
                ref={inputRef}
                className="chatInput"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Typ een bericht…"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(draft);
                    }
                }}/>
                <button
                  className="chatSend"
                  onClick={() => sendMessage(draft)}
                  disabled={chatLoading || isStreaming}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-icon lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </button>
              </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ChatUI;

function scrollDownSmooth(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth" });
}