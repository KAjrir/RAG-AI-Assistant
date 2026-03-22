import "../styles/chatPage.css";
import "../styles/markdown.css";

import Header from "../components/Header.jsx";
import Sidebar from "../components/Sidebar.jsx";

import { ModalProvider } from "../modals/ModalContext.jsx";
import { Outlet } from "react-router";

export default function ChatPage() {
  return (
    <ModalProvider>
      <div className="chatShell">
        <Header />
        <div className="wrapper">
          <Sidebar />
          <Outlet />
        </div>
      </div>
    </ModalProvider>
  );
}