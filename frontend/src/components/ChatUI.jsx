import { useEffect, useRef, useState } from "react";
import { random } from "../../utils.js"

import API_URL from "../config/api";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";

import TypingDots from "./TypingDots";

import { useParams } from "react-router";

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [draft, setDraft] = useState("");

  const chatComposerRef = useRef(null);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  const chatBodyRef = useRef(null);
  const userMessageRef = useRef(null);
  const assistantMessageRef = useRef(null);

  
  const { id } = useParams();
  useEffect(() => {
    if (!id) return;
    console.log(id)
    fetch(`${API_URL}/api/chats/${id}`)  // laad pas nu de messages
      .then(r => r.json())
      .then(d => {
        console.log(d)
        setMessages(d.messages)
      })
      // .then(setMessages);
  }, [id]);

  function updateSpacer() {
    if (!bottomRef.current || !assistantMessageRef.current || !chatBodyRef.current || !chatComposerRef.current) return;

    const chatBodyHeight = chatBodyRef.current.offsetHeight;
    const composerHeight = chatComposerRef.current.offsetHeight;
    const bubbleHeight = assistantMessageRef.current.offsetHeight;
    const userBubbleHeight = userMessageRef.current?.offsetHeight ?? 0;

    const availableSpace = chatBodyHeight - composerHeight - 95 - bubbleHeight - userBubbleHeight;
    console.log(chatBodyHeight, composerHeight, bubbleHeight, userBubbleHeight)

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

  const sendMessage = async (text) => {
    if (!text.trim() || chatLoading) return;

    setChatLoading(true);
    setDraft("");

    const userId = random()
    const assistantId = random()

    // Placeholder assistant message (leeg)
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: assistantId, role: "assistant", done: false, text: "" },
    ]);

    const sessionId = localStorage.getItem("session_id");

    const url =
      `${API_URL}/api/chat-stream` +
      `?session_id=${encodeURIComponent(sessionId)}` +
      `&message=${encodeURIComponent(text)}`;

    const response = await fetch(url);
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
            ? { ...msg, text: msg.text + bufferText }
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

    // console.log(full_text);
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
                      {m.text}
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
                            {m.text}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                </div>
              ))
            ) : (
              <div className="no-messages">Waar kan ik je mee helpen?</div>
            )}
            <div ref={bottomRef}  style={{
            }}/>
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