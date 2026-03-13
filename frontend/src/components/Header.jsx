// import { Menu } from "lucide-react"
import { Link } from "react-router"
import { useEffect } from "react"

import "../styles/header.css"

export default function Header({ user }) {

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

        {user && (
          <button
            className="menuButton"
            onClick={openSidebar}
          >
            |||
          </button>
        )}

        <div className="logo">
          <img src="/icon.avif" alt="logo" width={40} height={40}/>
          <span>SDB Groep</span>
        </div>

      </div>


      <div className="headerRight">

        {!user && (
          <>
            <Link to={"/login"}>Login</Link>
            <Link to={"/register"}>Register</Link>
          </>
        )}

        {user && (
          <>
            <button className="logoutButton">
              Sign out
            </button>

            {/* <button className="avatarButton">
              <img
                src="https://github.com/shadcn.png"
                alt="avatar"
              />
            </button> */}
          </>
        )}

      </div>

    </header>
  )
}