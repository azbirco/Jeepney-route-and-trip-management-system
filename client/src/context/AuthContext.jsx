import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    const storedUser = localStorage.getItem("jeepney_auth_user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);

  }, []);

  const login = async (username, password) => {

    try {

      setError(null);

      const { data } = await api.post("/auth/login", {
        username,
        password
      });

      localStorage.setItem(
        "jeepney_auth_token",
        data.token
      );

      localStorage.setItem(
        "jeepney_auth_user",
        JSON.stringify(data.user)
      );

      setUser(data.user);

      return {
        success: true,
        user: data.user
      };

    } catch (err) {

      const message =
        err.response?.data?.message ||
        "Login failed";

      setError(message);

      return {
        success: false,
        message
      };

    }

  };

  const logout = async () => {

    try {

      await api.post("/auth/logout");

    } catch (err) {

      console.log(err);

    }

    localStorage.removeItem("jeepney_auth_token");
    localStorage.removeItem("jeepney_auth_user");

    setUser(null);

  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => {

  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;

};

export default AuthContext;