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
  const inputRef = useRef(null);
  const bottomRef = useRef(null);

  
  const { id } = useParams()
  console.log(id)


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

  // auto-scroll naar nieuwste bericht
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    }
    setIsStreaming(false);
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantId ? { ...msg, done: true } : msg,
      ),
    );

    console.log(full_text);
  };
  return (
    <>
      <main className="chatBody">
        <div className="chatBodyWrapper">
          {messages.length > 0 ? (
            messages.map((m) => (
              <div
                key={m.id}
                className={`row ${m.role === "user" ? "rowUser" : "rowAssistant"}`}
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
          <div ref={bottomRef} />
        </div>


        <div className="chatComposer">
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
              Verstuur
            </button>
        </div>
      </main>
    </>
  );
};

export default ChatUI;
