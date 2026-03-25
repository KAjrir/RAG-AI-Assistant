import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    api.get('/workspaces')
      .then(res => setWorkspaces(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createWorkspace(name) {
    const res = await api.post('/workspaces', { name });
    setWorkspaces(prev => [...prev, res.data]);
    return res.data;
  }

  async function joinWorkspace(inviteCode) {
    const res = await api.post('/workspaces/join', { inviteCode });
    setWorkspaces(prev => [...prev, res.data]);
    return res.data;
  }

  return (
    <OrgContext.Provider value={{ workspaces, loading, error, createWorkspace, joinWorkspace }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}