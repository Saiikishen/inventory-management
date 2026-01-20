import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { AuthContext } from './useAuth.js';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        const idTokenResult = await getIdTokenResult(user);
        const isAdmin = !!idTokenResult.claims.admin;
        setUser(user);
        setIsAdmin(isAdmin);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const logout = () => {
    return auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
