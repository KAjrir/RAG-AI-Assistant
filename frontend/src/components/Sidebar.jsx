import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useParams } from "react-router";
import { ChevronLeft, ChevronRight, MessageSquare, Search } from "lucide-react";
import API_URL from "../lib/api";

import "../styles/sidebar.css"
import useModal from "../modals/ModalContext.jsx";
import ProfileModal from "../modals/ProfileModal.jsx"

import { useAuth } from "../context/AuthContext.jsx";
import { useOrg } from "../context/OrgContext.jsx";

// ORGSLUG MOET OOK OPGESLAGEN WORDEN IN DE AUTHCONTEXT OF EEN NIEUWE CONTEXT MAKEN DAARVOOR

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const { user, loading } = useAuth();
  const { memberships, currentMembership } = useOrg();

  const { pathname } = useLocation();
  const { orgSlug } = useParams();

  useEffect(() => {
    if(!currentMembership) return
    
    fetch(`${API_URL}/api/chats?currentOrg=${currentMembership?.id}`, {
      credentials: "include"
    })
    .then(res => {
      if (!res.ok) throw new Error(res.status)
      return res.json()
    })
    .then(data => setChats(data))
    .catch(err => console.error(err))
  }, [currentMembership])

  return (
    <aside
      className={`sidebar ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
    >
      <div 
        className={`sidebar-header ${isSidebarOpen ? "" : "closed"}`}
      >
        {isSidebarOpen && <h2 className="sidebar-title">Your Chats</h2>}

        <button 
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="sidebar-toggle"
        >
          {isSidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
        </button>
      </div>

      <nav className="sidebar-content">
        <Link to={`/${orgSlug}/chat`}>
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
              const chatPath = `/${orgSlug}/chat/${chat.id}`
              const currentChat = pathname === chatPath
              return (
                <Chat
                  key={chat.id}
                  id={chat.id}
                  label={chat.title}
                  chatPath={chatPath}
                  active={currentChat}
                />
              );
            })}
          
        </nav>
      </nav>
      <ProfileItem isSidebarOpen={isSidebarOpen} user={user} membership={currentMembership}/>
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

function Chat({ id, label, chatPath }) {
  return (
    <NavLink
      to={chatPath}
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

function ProfileItem({ isSidebarOpen, user, membership }) {
  const { openModal } = useModal()
  const initials = user.name.split(" ").map(word => word[0]).join("")

  return (
    <div
      onClick={() => openModal(<ProfileModal user={user} membership={membership}/>)}
      className={`profile-item ${
        isSidebarOpen ? "profile-open" : "profile-closed"
      }`}
    >
      <div className="profile-avatar">
        {initials}
      </div>

      {isSidebarOpen &&
        <div className="profile-item-content">
          <span className="profile-name">{user?.name}</span>
          <span className="profile-org">{membership?.name}</span>
        </div>
      }
    </div>
  );
}


export default Sidebar;
