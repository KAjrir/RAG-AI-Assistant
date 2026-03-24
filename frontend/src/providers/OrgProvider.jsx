import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";

import API_URL from "../config/api.js";


const OrgContext = createContext(null);

export const OrgProvider = ({ children }) => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState([]);
  const [currentMembership, setCurrentMembership] = useState(null);

  // memberships ophalen zodra user bekend is
  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/users/memberships`, {
        credentials: "include"
    })
    .then(res => {
        if(!res.ok) throw new Error("Couldn't retrieve memberships")
        return res.json()
    })
    .then(data => {
        setMemberships(data)
    })
    .catch((err) => {
        console.error(err)
        setMemberships([])

    })
  }, [user]);

  // herstel laatste org na refresh
  useEffect(() => {
    if (!memberships.length) return;
    const saved = localStorage.getItem('lastOrgSlug');
    const match = memberships.find(m => m.slug === saved) ?? memberships[0];
    setCurrentMembership(match);
  }, [memberships]);

  const switchOrg = (slug) => {
    const membership = memberships.find(m => m.slug === slug);
    if (!membership) return;
    localStorage.setItem('lastOrgSlug', slug);
    setCurrentMembership(membership);
  };

  return (
    <OrgContext.Provider value={{ memberships, currentMembership, switchOrg }}>
      {children}
    </OrgContext.Provider>
  );
};


export function useOrg() {
    return useContext(OrgContext)
}