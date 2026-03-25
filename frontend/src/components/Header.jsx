// import { Menu } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { useEffect } from "react"
import { useAuth } from "../context/AuthContext.jsx"

import "../styles/header.css"

export default function Header() {
  const { user, register, login, logout } = useAuth();
  const navigate = useNavigate();

  function openSidebar() {
    const sidebar = document.querySelector(".sidebar")
    sidebar?.classList.add("open")
  }

  function closeSidebar() {
    const sidebar = document.querySelector(".sidebar")
    sidebar?.classList.remove("open")
  }

  useEffect(() => {
    function handleClick(e){
        const sidebar = document.querySelector(".sidebar")

        if(!sidebar) return

        if(
        sidebar.classList.contains("open") &&
        !sidebar.contains(e.target)
        ){
        sidebar.classList.remove("open")
        }
    }

    document.addEventListener("click", handleClick)

    return () => document.removeEventListener("click", handleClick)

    }, [])

  return (
    <header className="header">

      <div className="headerLeft">

        <div className="logo" onClick={() => navigate("/dashboard")}>
          <img src="/icon.avif" alt="logo" width={40} height={40}/>
          <span>SDB Groep</span>
        </div>

      </div>


      <div className="headerRight">

      </div>

    </header>
  )
}