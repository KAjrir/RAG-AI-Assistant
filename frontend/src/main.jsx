import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router"
import './index.css'

import HomePage from './pages/HomePage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import Login from './components/Login.jsx';
import Register from './components/register.jsx'
import ChatUI from './components/ChatUI.jsx'

import AuthProvider from './providers/AuthProvider.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />
  },
  {
    path: "/c",
    element: <ChatPage />,
    children: [
      {
        index: true,
        element: <ChatUI />
      },
      {
        path: ":id",
        element: <ChatUI />
      }
      
    ]
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/register",
    element: <Register/>
  }

]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  </StrictMode>
)
