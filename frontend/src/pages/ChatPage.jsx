import { useState } from 'react';
import { Outlet } from 'react-router';
import { ModalProvider } from '../modals/ModalContext.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import '../new-styles/chatPage.css';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ModalProvider>
      <div className="chp-shell">
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(prev => !prev)}
        />
        <div className="chp-content">
          <Outlet context={{ sidebarOpen }} />
        </div>
      </div>
    </ModalProvider>
  );
}