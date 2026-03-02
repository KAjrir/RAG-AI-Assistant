import { useEffect, useRef, useState } from "react";

import "./App.css"
import "./markdown.css"
import API_URL from "./config/api";

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';


export default function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem("session_id")) {
      localStorage.setItem("session_id", crypto.randomUUID());
    }
  }, []);

  // auto-scroll naar nieuwste bericht
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async (text) => {
    if(!text.trim() || loading) return;

    setLoading(true)
    setDraft("")

    const userId = Math.floor(Math.random() * 1e5);
    const assistantId = Math.floor(Math.random() * 1e5);

    // Placeholder assistant message (leeg)
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: assistantId, role: "assistant", text: "" }
    ])

    const sessionId = localStorage.getItem("session_id")

    const url =
      `${API_URL}/chat-stream` +
      `?session_id=${encodeURIComponent(sessionId)}` +
      `&message=${encodeURIComponent(text)}`;

    const response = await fetch(url)
    let full_text = ""

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
  
    if(!reader) return
    setLoading(false)
    while (true){
      const {done, value} = await reader.read();
      if(done) break
      const bufferText = decoder.decode(value, {stream: true})
      full_text += bufferText

      setMessages((prev) => 
        prev.map((msg) => 
          msg.id === assistantId 
            ? { ...msg, text: msg.text + bufferText }
            : msg
        )
      )

    }

    console.log(full_text)
  };

  return (
    <div className="chatShell">
      <header className="chatHeader">My Chat</header>

      <main className="chatBody">
        {messages.length > 0 ? messages.map((m) => (
          <div
            key={m.id}
            className={`row ${m.role === "user" ? "rowUser" : "rowAssistant"}`}
          >
            <div className={`bubble ${m.role === "user" ? "bubbleUser" : "bubbleAssistant"}`}>

              {m.role === "user" 
                  ? m.text
                  : <div className="markdown">
                      <ReactMarkdown
                        rehypePlugins={[rehypeRaw, rehypeHighlight]}
                        remarkRehypeOptions={[remarkGfm]}
                      >
                        { m.text }
                      </ReactMarkdown>
                    </div>
              }
              
            </div>
          </div>
        )) :
          <div className="no-messages">Waar kan ik je mee helpen?</div>
        }
        <div ref={bottomRef} />
      </main>

      <footer className="chatComposer">
        <input
          className="chatInput"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Typ een bericht…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(draft);
            }
          }}
        />
        <button className="chatSend" onClick={() => sendMessage(draft)} disabled={loading}>
          Send
        </button>
      </footer>
    </div>
  );
}