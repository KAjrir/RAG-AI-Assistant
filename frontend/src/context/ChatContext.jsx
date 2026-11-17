// context/ChatContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { api, BASE_URL } from '../lib/api.js';
import { useToast } from './ToastContext.jsx';
import { getErrorMessage } from '../lib/utils.js';

const ChatContext = createContext(null);

export function ChatProvider({ slug, children }) {
  const { chatId }                      = useParams();
  const toast                           = useToast();
  const [chats, setChats]               = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [titleLoading, setTitleLoading] = useState(false);

  // Stream die moet starten zodra we op de URL van een nieuwe chat staan.
  // Staat hier (niet in ChatUI) zodat hij een eventuele remount overleeft.
  const pendingStreamRef = useRef(null);
  // Object-URL's van afbeeldingen in verstuurde berichten; opruimen bij verlaten workspace
  const blobUrlsRef      = useRef([]);

  function setPendingStream(pending) {
    pendingStreamRef.current = pending;
  }

  function takePendingStream(id) {
    const pending = pendingStreamRef.current;
    if (!pending || pending.chatId !== id) return null;
    pendingStreamRef.current = null;
    return pending;
  }

  function trackBlobUrl(url) {
    blobUrlsRef.current.push(url);
  }

  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      blobUrlsRef.current = [];
    };
  }, [slug]);

  // Afgeleid i.p.v. losse state: blijft altijd in sync met chats + URL
  const activeChat = useMemo(
    () => chats.find(c => c.id === chatId) ?? null,
    [chats, chatId]
  );

  // Alleen ophalen bij (wissel van) workspace, niet bij elke chatwissel
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setChatsLoading(true);

    api.get(`/workspaces/${slug}/chats`)
      .then(res => { if (!cancelled) setChats(res.data); })
      .catch(err => {
        if (!cancelled) toast.error(getErrorMessage(err, 'Gesprekken ophalen is mislukt.'));
      })
      .finally(() => { if (!cancelled) setChatsLoading(false); });

    return () => { cancelled = true; };
  }, [slug]);

  const refreshChats = useCallback(async () => {
    const res = await api.get(`/workspaces/${slug}/chats`);
    setChats(res.data);
    return res.data;
  }, [slug]);

  function addChat(chat) {
    setChats(prev => (prev.some(c => c.id === chat.id) ? prev : [chat, ...prev]));
  }

  function refreshChat(id, data) {
    setChats(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)));
  }

  // ── Gesprekken ───────────────────────────

  async function updateChatTitle(id, title) {
    const res = await api.patch(`/workspaces/${slug}/chats/${id}`, { title });
    refreshChat(id, { title: res.data.title });
    return res.data.title;
  }

  async function deleteChat(id) {
    await api.delete(`/workspaces/${slug}/chats/${id}`);
    setChats(prev => prev.filter(c => c.id !== id));
  }

  // ── Berichten ────────────────────────────

  async function fetchMessages(id) {
    const res = await api.get(`/workspaces/${slug}/chats/${id}`);
    return res.data;
  }

  // Nieuwe chat + eerste bericht. Geeft { chatId, assistantMessageId } terug.
  async function createChat(formData) {
    const res = await api.post(`/workspaces/${slug}/chats`, formData);
    // Direct in de sidebar zetten (titel volgt na het streamen)
    addChat({ id: res.data.chatId, title: null, created_at: new Date().toISOString() });
    return res.data;
  }

  // Bericht in bestaande chat. Geeft { assistantMessageId } terug.
  async function sendMessage(id, formData) {
    const res = await api.post(`/workspaces/${slug}/chats/${id}/messages`, formData);
    return res.data;
  }

  // Streamt het antwoord als NDJSON (één JSON object per regel).
  // axios kan niet streamen in de browser, daarom fetch.
  async function streamMessage({ chatId: id, assistantId, payload, signal, onOpen, onEvent }) {
    const response = await fetch(`${BASE_URL}/api/workspaces/${slug}/chats/messages`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: id, assistantId, payload }),
      signal,
    });

    if (!response.ok || !response.body) {
      let data = null;
      try { data = await response.json(); } catch {}
      // Zelfde vorm als een axios-fout, zodat getErrorMessage() werkt
      const err = new Error(data?.error ?? 'Stream mislukt');
      err.response = { status: response.status, data };
      throw err;
    }

    onOpen?.();

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    function handleLine(line) {
      if (!line.trim()) return;
      let data;
      try {
        data = JSON.parse(line);
      } catch {
        console.warn('Ongeldige stream-regel overgeslagen:', line);
        return;
      }
      onEvent(data);
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();
      lines.forEach(handleLine);
    }

    // Laatste regel zonder afsluitende \n
    buffer += decoder.decode();
    handleLine(buffer);
  }

  return (
    <ChatContext.Provider value={{
      chats, chatsLoading, activeChat,
      refreshChats, addChat, refreshChat,
      updateChatTitle, deleteChat,
      fetchMessages, createChat, sendMessage, streamMessage,
      setPendingStream, takePendingStream, trackBlobUrl,
      titleLoading, setTitleLoading,
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