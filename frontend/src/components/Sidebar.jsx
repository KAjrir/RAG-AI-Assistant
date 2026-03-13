import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { ChevronLeft, ChevronRight, MessageSquare, Search } from "lucide-react";

import { random } from "../../utils";

import "../styles/sidebar.css"

const chats = [
  { 
    id: random(),
    title: "Je maatjajndihbasfhsabijkdbase"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paadfnsafbahjfb ushjbafikdbfdsatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },
  {
    id: random(),
    title: "Je paatje"
  },

];

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { pathname } = useLocation()
  console.log(pathname)

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
        <Link to={"/"}>
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
              const currentChat = pathname === `/chat/${chat.id}`;
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
      to={`/chat/${id}`}
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
  return (
    <div
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
