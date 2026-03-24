import { createContext, useContext, useState, useEffect } from "react";
import API_URL from "../config/api.js";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, {
        credentials: "include"
      })
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
            setUser(data.user);
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => setLoading(false));
  }, []);

  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    if (!res.ok) {
      throw new Error("Register failed");
    }

    const data = await res.json();

    // 🔥 belangrijke keuze (zie hieronder)
    setUser(data.user);
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();

    setUser(data.user);
  };

  const logout = async () => {
    const res = await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include"
    })

    if(!res.ok) throw new Error("Log out failed")

    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}