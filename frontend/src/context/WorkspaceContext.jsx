import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { api } from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';
import { PERMISSIONS } from '../lib/permissions.js';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ slug, children }) {
  const { user, setUser }                 = useAuth();
  const [workspace, setWorkspace]         = useState(null);
  const [members, setMembers]             = useState([]);
  const [invitations, setInvitations]     = useState([]);
  const [documents, setDocuments]         = useState([]);
  const [connections, setConnections]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats]                 = useState({ docs: 0, connections: 0, members: 0 });

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    setWorkspace(null);
    setMembers([]);
    setDocuments([]);
    setConnections([]);
    setStats({ docs: 0, connections: 0, members: 0 });

    Promise.allSettled([
      api.get(`/workspaces/${slug}`),
      api.get(`/workspaces/${slug}/members`),
      api.get(`/workspaces/${slug}/docs`),
      api.get(`/workspaces/${slug}/connections`),
      api.get(`/workspaces/${slug}/stats`),
    ])
      .then(([wsRes, membersRes, docsRes, connectionsRes, statsRes]) => {
        const ws = wsRes.status === 'fulfilled' ? wsRes.value.data : null;

        setWorkspace(ws);
        setMembers(membersRes.status === 'fulfilled' ? membersRes.value.data : []);
        setDocuments(docsRes.status === 'fulfilled' ? docsRes.value.data : []);
        setConnections(connectionsRes.status === 'fulfilled' ? connectionsRes.value.data : []);
        setStats(statsRes.status === 'fulfilled' ? statsRes.value.data : { docs: 0, connections: 0, members: 0 });

        if (PERMISSIONS[ws?.role]?.invitations?.read) {
          api.get(`/invitations/${slug}/workspace/pending`)
            .then(res => setInvitations(res.data.invites ?? []))
            .catch(() => {});
        }
      })
      .catch(err => {
        console.dir(err, { depth: null });
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const hasProcessing = documents.some(doc =>
      ['uploading', 'queued', 'processing'].includes(doc.status)
    );
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      api.get(`/workspaces/${slug}/docs`)
        .then(res => setDocuments(res.data))
        .catch(err => console.error('Polling failed:', err));
    }, 3000);

    return () => clearInterval(interval);
  }, [documents, slug]);

  const can = useCallback((resource, action) => {
    return PERMISSIONS[workspace?.role]?.[resource]?.[action] ?? false
  }, [workspace?.role]);

  async function updateWorkspace(data) {
    const res = await api.patch(`/workspaces/${slug}`, data);
    flushSync(() => {
      setWorkspace(prev => ({ ...prev, ...res.data }));
      if (data.name || data.slug) {
        setUser(prev => ({
          ...prev,
          memberships: prev.memberships.map(m =>
            m.orgSlug === slug
              ? {
                  ...m,
                  ...(data.name && { orgName: data.name }),
                  ...(data.slug && { orgSlug: data.slug }),
                }
              : m
          )
        }));
      }
    });
    return res.data;
  }

  async function inviteMembers(invitees) {
    const res = await api.post(`/invitations/${slug}/create`, { invitees });
    setInvitations(prev => [...prev, ...res.data]);
    return res.data;
  }

  async function revokeInvite(inviteId) {
    await api.post(`/invitations/${slug}/workspace/revoke`, { inviteId });
    setInvitations(prev => prev.filter(i => i.id !== inviteId));
  }

  async function updateMember(memberId, newRole) {
    const res = await api.patch(`/workspaces/${slug}/members/${memberId}`, { role: newRole });
    setMembers(prev =>
      prev.map(mem => mem.id === memberId ? { ...mem, role: res.data.newRole } : mem)
    );
  }

  async function removeMember(memberId) {
    await api.delete(`/workspaces/${slug}/members/${memberId}`);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  function toggleSidebar() {
    setIsSidebarOpen(prev => !prev);
  }

  async function uploadDocuments(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    const res = await api.post(`/workspaces/${slug}/docs`, formData);
    setDocuments(prev => [...prev, ...res.data.docs]);
    return res.data;
  }

  const refreshDocuments = useCallback(async () => {
    const res = await api.get(`/workspaces/${slug}/docs`);
    setDocuments(res.data);
  }, [slug]);

  const deleteDocument = async (docId) => {
    await api.delete(`/workspaces/${slug}/docs/${docId}`);
    setDocuments(prev => prev.filter(p => p.id !== docId));
  };

  const reindexDocument = async (docId) => {
    await api.post(`/workspaces/${slug}/docs/${docId}/reindex`);
    setDocuments(prev =>
      prev.map(d => d.id === docId ? { ...d, status: 'queued' } : d)
    );
  };

  async function connectConnection(connectionId, config = {}) {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    if (connection.auth_type === 'oauth') {
      window.location.href = connection.auth_config.oauth_url;
      return;
    }

    const res = await api.post(
      `/workspaces/${slug}/connections/${connectionId}/connect`,
      { config }
    );

    setConnections(prev => prev.map(c =>
      c.id === connectionId ? { ...c, organization_connection: res.data } : c
    ));

    return res.data;
  }

  async function disableConnection(orgConnectionId) {
    await api.patch(`/workspaces/${slug}/connections/${orgConnectionId}/disable`);

    setConnections(prev => prev.map(c =>
      c.organization_connection?.id === orgConnectionId
        ? { ...c, organization_connection: { ...c.organization_connection, enabled: false } }
        : c
    ));
  }

  async function updateConnectionConfig(orgConnectionId, config) {
    const res = await api.patch(
      `/workspaces/${slug}/connections/${orgConnectionId}/config`,
      { config }
    );

    setConnections(prev => prev.map(c =>
      c.organization_connection?.id === orgConnectionId
        ? { ...c, organization_connection: res.data }
        : c
    ));

    return res.data;
  }

  async function deleteConnection(orgConnectionId) {
    await api.delete(`/workspaces/${slug}/connections/${orgConnectionId}`);

    setConnections(prev => prev.map(c =>
      c.organization_connection?.id === orgConnectionId
        ? { ...c, organization_connection: null }
        : c
    ));
  }

  return (
    <WorkspaceContext.Provider value={{
      isSidebarOpen, toggleSidebar,
      workspace, members, invitations, loading, error,
      can,
      updateWorkspace,
      inviteMembers, revokeInvite, updateMember, removeMember,
      documents, reindexDocument, deleteDocument,
      uploadDocuments, refreshDocuments,
      connections,
      connectConnection,
      disableConnection,
      updateConnectionConfig,
      deleteConnection,
      stats,
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