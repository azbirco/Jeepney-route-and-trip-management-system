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

      const { data } = await api.post("/auth/login", { username, password });

      localStorage.setItem("jeepney_auth_token", data.token);
      localStorage.setItem("jeepney_auth_user", JSON.stringify(data.user));

      setUser(data.user);

      return { success: true, user: data.user };

    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      return { success: false, message };
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

  // NEW: i-syncs ang bagong data (galing sa PUT /auth/profile response)
  // papunta sa React state AT localStorage, para consistent yung tinitignan
  // ng buong app (e.g. sidebar name/avatar) kahit walang re-login.
  const updateUser = (newUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...newUserData };
      localStorage.setItem("jeepney_auth_user", JSON.stringify(merged));
      return merged;
    });
  };

  // NEW: wrapper function na tinatawag ng Profile.jsx
  const updateProfile = async (fullName) => {
    try {
      const { data } = await api.put("/auth/profile", { fullName });
      updateUser(data.user);
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update profile";
      return { success: false, message };
    }
  };

  // NEW: wrapper function para sa change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const { data } = await api.put("/auth/change-password", {
        currentPassword,
        newPassword
      });
      return { success: true, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || "Failed to change password";
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        login,
        logout,
        updateUser,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};

export default AuthContext;