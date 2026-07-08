import axios from "axios";

const api = axios.create({

  baseURL: import.meta.env.VITE_API_URL || "/api",

  headers: {
    "Content-Type": "application/json"
  },

  withCredentials: false

});


// Request Interceptor
api.interceptors.request.use(

  (config) => {

    const token = localStorage.getItem("jeepney_auth_token");

    console.log("========== AXIOS REQUEST ==========");
    console.log("Base URL:", config.baseURL);
    console.log("URL:", config.url);
    console.log("Token:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log("Headers:", config.headers);
    console.log("===================================");

    return config;

  },

  (error) => Promise.reject(error)

);


// Response Interceptor
api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (

      error.response &&

      error.response.status === 401

    ) {

      localStorage.removeItem(
        "jeepney_auth_token"
      );

      localStorage.removeItem(
        "jeepney_auth_user"
      );

      if (

        window.location.pathname !== "/login"

      ) {

        window.location.href =
          "/login";

      }

    }

    return Promise.reject(error);

  }

);

export default api;