import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ChevronLeft, ChevronRight, MessageSquare, Search } from "lucide-react";
import API_URL from "../config/api";

import { random } from "../../utils";

import "../styles/sidebar.css"
import useModal from "../modals/ModalContext.jsx";
import ProfileModal from "../modals/ProfileModal.jsx"


const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState([])
  const { pathname } = useLocation()

  useEffect(() => {
    fetch(`${API_URL}/api/chats`)
    .then(r => r.json())
    .then(setChats)
    .catch(err => console.error(err))
  }, [])


  return (
    <aside
      className={`sidebar ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
    >
      <div className="sidebar-header">
        {isSidebarOpen && <h2 className="sidebar-title">Your Chats</h2>}

        <button 
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="sidebar-toggle"
        >
          {isSidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>
      </div>

      <nav className="sidebar-content">
        <Link to={"/chats"}>
          <SidebarItem
            icon={<MessageSquare size={22} />}
            label="New Chat"
            isSidebarOpen={isSidebarOpen}
          />
        </Link>

        <SidebarItem
          icon={<Search size={22} />}
          label="Search"
          isSidebarOpen={isSidebarOpen}
        />

        <hr className="sidebar-divider" />

        <nav className="chat-list">
          {chats && isSidebarOpen &&
            chats.map((chat) => {
              const currentChat = pathname === `/chats/${chat.id}`;
              return (
                <Chat
                  key={chat.id}
                  id={chat.id}
                  label={chat.title}
                  active={currentChat}
                />
              );
            })}
          
        </nav>
      </nav>
      <ProfileItem isSidebarOpen={isSidebarOpen}/>
    </aside>
  );
};

function SidebarItem({ icon = null, label, isSidebarOpen }) {
  return (
    <button
      className={`sidebar-item ${
        isSidebarOpen ? "sidebar-item-open" : "sidebar-item-closed"
      }`}
    >
      {icon}
      {isSidebarOpen && <span>{label}</span>}
    </button>
  );
}

function Chat({ id, label }) {
  return (
    <NavLink
      to={`/chats/${id}`}
      className={({ isActive }) =>
        `chat-item ${isActive ? "chat-active" : ""}`
      }
    >
      <button className="chat-button">
        <span className="chat-label">{label}</span>
      </button>
    </NavLink>
  );
}

function ProfileItem({ isSidebarOpen }) {
  const {openModal} = useModal()
  
  return (
    <div
      onClick={() => openModal(<ProfileModal/>)}
      className={`profile-item ${
        isSidebarOpen ? "profile-open" : "profile-closed"
      }`}
    >
      <div className="profile-avatar">
        KA
      </div>

      {isSidebarOpen &&
        <div className="profile-item-content">
          <span className="profile-name">Karim Ajrir</span>
          <span className="profile-plan">Plus</span>
        </div>
      }
    </div>
  );
}


export default Sidebar;
