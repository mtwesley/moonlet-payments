import {
  React,
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useIdToken } from "react-firebase-hooks/auth";

import { auth } from "./firebase";

const AuthContext = createContext();

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, loading, error] = useIdToken(auth);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
    }),
    [user, loading, error]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
