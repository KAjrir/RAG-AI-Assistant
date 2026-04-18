import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuth = () => {
    api.get('/auth/me')
      .then(res => {
        setUser(res.data.user)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    getAuth()
  }, []);

  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    if(res.data.success) getAuth()
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if(res.data.success) getAuth()
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  async function createOrg(data) {
    const res = await api.post('/users/create-org', data);
    if (res.data.success) getAuth();
    return res.data;
  }

  async function joinOrg(token) {
    const res = await api.post('/users/join-org', { token });
    if (res.data.success) getAuth();
    return res.data;
  }

  async function inviteMembers(emails) {
    const res = await api.post('/users/invite-members', { emails });
    return res.data;
  }

  return (
    <AuthContext.Provider value={{ 
      user, setUser, loading, login, register, logout,
      createOrg, joinOrg, inviteMembers
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}