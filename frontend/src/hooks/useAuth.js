import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export function useAuth() {
  const [token, setToken] = useState(localStorage.getItem("wanderlist_token"));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("wanderlist_token", token);
      try {
        const decoded = jwtDecode(token);
        setUser({ id: decoded.sub, username: decoded.username });
      } catch (err) {
        setToken(null);
        localStorage.removeItem("wanderlist_token");
      }
    } else {
      localStorage.removeItem("wanderlist_token");
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => setToken(newToken);
  const logout = () => setToken(null);

  return { token, user, login, logout };
}
