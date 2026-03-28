import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ slug, children }) {
  const {user}                    = useAuth();
  const [workspace, setWorkspace] = useState(null);
  const [members, setMembers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      api.get(`/workspaces/${slug}`),
      api.get(`/workspaces/${slug}/members`),
    ])
      .then(([wsRes, membersRes]) => {
        setWorkspace(wsRes.data);
        console.log(wsRes.data)
        setMembers(membersRes.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);


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

  return (
    <WorkspaceContext.Provider value={{ isSidebarOpen, toggleSidebar,
      workspace, members, loading, error,
      isOwner, currentMember,
      updateWorkspace, inviteMember, removeMember,
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