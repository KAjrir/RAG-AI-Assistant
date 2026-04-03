import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ slug, children }) {
  const {user}                    = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers]     = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      api.get(`/workspaces/${slug}`),
      api.get(`/workspaces/${slug}/members`),
      api.get(`/workspaces/${slug}/docs`),
    ])
      .then(([wsRes, membersRes, docsRes]) => {
        setWorkspace(wsRes.data);
        setMembers(membersRes.data);
        setDocuments(docsRes.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const hasProcessing = documents.some(doc => ['uploading', 'queued', 'processing'].includes(doc.status))
    if(!hasProcessing) return;

    const interval = setInterval(() => {
      api.get(`/workspaces/${slug}/docs`)
        .then(res => setDocuments(res.data))
        .catch(err => console.error('Polling failed:', err))
    }, 3000)

    return () => clearInterval(interval)
  }, [documents, slug])


  const currentMember = members.find(m => m.id === user?.id);
  const isOwner       = currentMember?.role === 'owner';

  async function updateWorkspace(data) {
    const res = await api.patch(`/workspaces/${slug}`, data);
    setWorkspace(res.data);
    return res.data;
  }

  async function inviteMember(email) {
    return api.post(`/workspaces/${slug}/invites`, { email }).then(r => r.data);
  }

  async function removeMember(memberId) {
    await api.delete(`/workspaces/${slug}/members/${memberId}`);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  function toggleSidebar() {
    setIsSidebarOpen(prev => !prev)
  }

  async function uploadDocuments (files) {
    const formData = new FormData()

    files.forEach(file => formData.append("files", file))

    const res = await api.post(`/workspaces/${slug}/docs`, formData)
    console.log(res)

    setDocuments(prev => [...prev, ...res.data])
    return res.data
  }

  const refreshDocuments = useCallback(async () => {
    const res = await api.get(`/workspaces/${slug}/docs`)
    setDocuments(res.data)
  }, [slug])

  const deleteDocument = async (docId) => {
    await api.delete(`/workspaces/${slug}/docs/${docId}`)
    setDocuments(prev => (
      prev.filter(p => p.id !== docId)
    ))
  }

  const reindexDocument = async (docId) => {
    await api.post(`/workspaces/${slug}/docs/${docId}/reindex`)
    setDocuments(prev =>
      prev.map(d => d.id === docId ? { ...d, status: 'queued' } : d)
    )
  }

  return (
    <WorkspaceContext.Provider value={{ isSidebarOpen, toggleSidebar,
      workspace, members, loading, error,
      isOwner, currentMember,
      updateWorkspace, inviteMember, removeMember, 
      documents, reindexDocument, deleteDocument, uploadDocuments, refreshDocuments
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}