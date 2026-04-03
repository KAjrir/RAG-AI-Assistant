import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router"
import './index.css'

import HomePage from './pages/HomePage.jsx'
import Dashboard from './pages/Dashboard.jsx'

import Inloggen from './pages/Inloggen.jsx';
import Registreren from './pages/Registreren.jsx'
import ChatUI from './components/chat/ChatUI.jsx'

import AuthProvider from './context/AuthContext.jsx'
import ProtectedRoute from './router/ProtectedRoute.jsx'
import WorkspaceRoute from "./router/WorkspaceRoute.jsx"
import ChatRoute from './router/ChatRoute.jsx'

import Overzicht from "./pages/workspace/Overzicht.jsx"
import DocsPage from "./pages/workspace/DocsPage.jsx"
import DocsUpload from './pages/workspace/DocsUpload.jsx'
import DocDetail from './pages/workspace/DocDetail.jsx'
import Connecties from './pages/workspace/Connecties.jsx'
import Mensen from './pages/workspace/Mensen.jsx'
import Instellingen from './pages/workspace/Instellingen.jsx'
import WorkspaceLayout from './layout/WorkspaceLayout.jsx'
import ChatPage from './pages/ChatPage.jsx'
import NietGevonden from './pages/NietGevonden.jsx'
import WachtwoordVergeten from './pages/WachtwoordVergeten.jsx'
import Reset from './pages/Reset.jsx'

const router = createBrowserRouter([
  { path: '/',                    element: <HomePage /> },
  { path: '/inloggen',            element: <Inloggen /> },
  { path: '/registreren',         element: <Registreren /> },
  { path: '/wachtwoord-vergeten', element: <WachtwoordVergeten />},
  { path: '/reset',               element: <Reset />},
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
 
      {
        path: '/w/:slug',
        element: <WorkspaceRoute />,
        children: [
          {
            element: <WorkspaceLayout />,
            children: [
              { index: true,          element: <Overzicht /> },
              { path: 'docs',         element: <DocsPage /> },
              { path: 'docs/upload',  element: <DocsUpload /> },
              { path: 'docs/:docId',  element: <DocDetail /> },
              { path: 'connecties',   element: <Connecties /> },
              { path: 'mensen',       element: <Mensen /> },
              { path: 'instellingen', element: <Instellingen /> },
            ],
          },
          {
            element: <ChatRoute />,
            children: [
              {
                element: <ChatPage />,
                children: [
                  { path: 'chat',         element: <ChatUI /> },
                  { path: 'chat/:chatId', element: <ChatUI /> },
                ],
              }
            ]
          },
        ],
      },
    ],
  },
 
  { path: '*', element: <NietGevonden /> },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  </StrictMode>
)
