// router/ChatRoute.jsx
import { Outlet, useParams } from 'react-router';
import { ChatProvider } from '../context/ChatContext.jsx';
import { ModalProvider } from '../modals/ModalContext.jsx';

export default function ChatRoute() {
  const { slug } = useParams();

  return (
    <ModalProvider>
      <ChatProvider slug={slug}>
        <Outlet />
      </ChatProvider>
    </ModalProvider>
  );
}