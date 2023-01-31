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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setLoading(true);
    return auth.onIdTokenChanged((_user) => {
      setUser(_user);
      setLoading(false);
      if (_user?.uid) {
        _user.getIdTokenResult().then((idTokenResult) => {
          setIsAdmin(idTokenResult.claims.admin ?? false);
        });
      }
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {loading ? (
        <Spinner animation="border" style={{ margin: "30% 50%" }} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
