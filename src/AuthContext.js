import { React, createContext, useContext, useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";

import { auth } from "./firebase";

const AuthContext = createContext();

export function useAuthContext() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return () => {
      setLoading(true);
      auth.onIdTokenChanged((user) => {
        // process custom claims
        setUser(user);
        setLoading(false);
      });
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {loading ? (
        <Spinner animation="border" className="mx-auto my-auto" />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
