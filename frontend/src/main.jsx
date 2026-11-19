import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router'
import './index.css'

import HomePage from './pages/HomePage.jsx'
import Privacy from './pages/Privacy.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Inloggen from './pages/Inloggen.jsx'
import Registreren from './pages/Registreren.jsx'
import WachtwoordVergeten from './pages/WachtwoordVergeten.jsx'
import Reset from './pages/Reset.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Invitation from './pages/Invitation.jsx'
import NietGevonden from './pages/NietGevonden.jsx'

import AuthProvider from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ProtectedRoute from './router/ProtectedRoute.jsx'
import WorkspaceRoute from './router/WorkspaceRoute.jsx'

// Workspace: één layout (chat + beheer)
import WorkspaceShell from './layout/WorkspaceShell.jsx'
import InstellingenLayout from './layout/instellingenLayout.jsx'
import ChatUI from './components/chat/ChatUI.jsx'
import Overzicht from './pages/workspace/Overzicht.jsx'
import DocsPage from './pages/workspace/DocsPage.jsx'
import DocsUpload from './pages/workspace/DocsUpload.jsx'
import DocDetail from './pages/workspace/DocDetail.jsx'
import Connecties from './pages/workspace/Connecties.jsx'
import Mensen from './pages/workspace/Mensen.jsx'
import Instellingen from './pages/workspace/Instellingen.jsx'
import Abonnement from './pages/workspace/Abonnement.jsx'

const router = createBrowserRouter([
  { path: '/',                    element: <HomePage /> },
  { path: '/privacy',             element: <Privacy /> },
  { path: '/inloggen',            element: <Inloggen /> },
  { path: '/registreren',         element: <Registreren /> },
  { path: '/wachtwoord-vergeten', element: <WachtwoordVergeten /> },
  { path: '/reset',               element: <Reset /> },
  { path: '/uitnodiging',         element: <Invitation /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard',  element: <Dashboard /> },
      { path: '/onboarding', element: <Onboarding /> },

      {
        path: '/w/:slug',
        element: <WorkspaceRoute />,
        children: [
          {
            // ModalProvider + ChatProvider zitten in WorkspaceShell
            element: <WorkspaceShell />,
            children: [
              // Chat is de startpagina van een workspace
              { index: true,          element: <ChatUI /> },
              { path: 'chat/:chatId', element: <ChatUI /> },
              // Oude links naar /w/:slug/chat blijven werken
              { path: 'chat',         element: <Navigate to=".." relative="path" replace /> },

              // Beheer
              { path: 'overzicht',    element: <Overzicht /> },
              { path: 'docs',         element: <DocsPage /> },
              { path: 'docs/upload',  element: <DocsUpload /> },
              { path: 'docs/:docId',  element: <DocDetail /> },
              { path: 'connecties',   element: <Connecties /> },
              { path: 'mensen',       element: <Mensen /> },
              {
                path: 'instellingen',
                element: <InstellingenLayout />,
                children: [
                  { index: true,        element: <Instellingen /> },
                  { path: 'abonnement', element: <Abonnement /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NietGevonden /> },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  </StrictMode>
)
