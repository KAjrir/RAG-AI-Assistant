import "./App.css";
import "./markdown.css";

import Header from "./components/Header.jsx";
import ChatUI from "./components/ChatUI.jsx";
import Sidebar from "./components/Sidebar.jsx";

import { ModalProvider } from "./modals/ModalContext.jsx";

export default function App() {
  return (
    <ModalProvider>
      <div className="chatShell">
        {/* Hier moet user context gegeven worden */}
        <Header user={"mauw"} />
        <div className="wrapper">
          <Sidebar />
          <ChatUI />
        </div>
      </div>
    </ModalProvider>
  );
}