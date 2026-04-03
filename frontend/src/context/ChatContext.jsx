// context/ChatContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useParams } from 'react-router';

const ChatContext = createContext(null);

export function ChatProvider({ slug, children }) {
  const { chatId }                        = useParams();
  const [chats, setChats]                 = useState([]);
  const [activeChat, setActiveChat]       = useState(null);
  const [titleLoading, setTitleLoading] = useState([])

  useEffect(() => {
    if (!slug) return;
    api.get(`/workspaces/${slug}/chats`)
      .then(res => {
        // console.log(res.data)
        setChats(res.data);
        setActiveChat(res.data.find(chat => chat.id === chatId) ?? null);
      })
      .catch(() => {});
  }, [slug, chatId]);

  // Wordt aangeroepen vanuit ChatUI na nieuwe chat aanmaken
  function addChat(chat) {
    setChats(prev => [chat, ...prev]);
  }

  // Titel wijzigen — API call + sidebar bijwerken
  async function updateChatTitle(chatId, title) {
    const res = await api.patch(`/workspaces/${slug}/chats/${chatId}`, { title });
    const newTitle = res.data.title;
    console.log(res)

    setChats(prev =>
      prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c)
    );
    
    if (activeChat?.id === chatId) {
      setActiveChat(prev => ({ ...prev, title: newTitle }));
    }
  }

  // Chat verwijderen — API call + uit sidebar halen
  async function deleteChat(chatId) {
    await api.delete(`/workspaces/${slug}/chats/${chatId}`);
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChat?.id === chatId) setActiveChat(null);
  }

  function refreshChat(chatId, data) {
    setChats(prev =>
      prev.map(c => c.id === chatId ? { ...c, ...data } : c)
    );
    if (activeChat?.id === chatId) {
      setActiveChat(prev => ({ ...prev, ...data }));
    }
  }

  return (
    <ChatContext.Provider value={{
      chats, setChats, activeChat, setActiveChat,
      addChat, refreshChat, updateChatTitle, deleteChat,
      titleLoading, setTitleLoading
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}