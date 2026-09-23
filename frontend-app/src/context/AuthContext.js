import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [user, setUser] = useState({
    name: 'Prianshu Mitra',
    email: 'prianshu@debidorshon.com',
    avatar: null,
    completedTrips: 5,
    redeemPoints: 164,
    favoritePandals: ['p1', 'p3', 'p7'],
  });

  const login = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        setIsAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
