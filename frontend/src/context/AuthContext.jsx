import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    getAuth()
  }, []);


  async function getAuth() {
    try {
      const res = await api.get('/auth/me')
      setUser(res.data.user)
    } catch (err) {
      console.error(err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function register(name, email, password) {
    const res = await api.post('/auth/register', { name, email, password });
    if(res.data.success) await getAuth();
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    if(res.data.success) await getAuth();
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

  async function acceptInvite(token) {
    const res = await api.post('/invitations/accept', { token });
    if (res.data.success) getAuth();
    return res.data.workspace;
  }

  async function declineInvite(token) {
    await api.post('/invitations/user/decline', { token });
  }

  return (
    <AuthContext.Provider value={{ 
      user, setUser, loading, login, register, logout,
      createOrg, acceptInvite, declineInvite
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