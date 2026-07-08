import {
  useState,
  useEffect
} from "react";

import AuthContext from "./AuthContext";

import api from "../services/api";



const AuthProvider = ({ children }) => {


  const [user, setUser] = useState(null);


  const [loading, setLoading] = useState(true);


  const [error, setError] = useState(null);



  const token = localStorage.getItem(
    "jeepney_auth_token"
  );



  useEffect(() => {


    const checkProfile = async () => {


      if (!token) {

        setLoading(false);

        return;

      }



      try {


        const res = await api.get(
          "/auth/profile"
        );



        const profile =

          res.data?.user ||

          res.data?.data ||

          res.data;



        setUser(profile);



      } catch (err) {


        console.error(
          "Profile verification failed:",
          err
        );



        localStorage.removeItem(
          "jeepney_auth_token"
        );



        setUser(null);



      } finally {


        setLoading(false);


      }


    };



    checkProfile();



  }, [token]);





  const login = async (

    username,

    password

  ) => {


    try {


      setLoading(true);

      setError(null);



      const res = await api.post(

        "/auth/login",

        {

          username,

          password

        }

      );



      const receivedToken =

        res.data?.token ||

        res.data?.data?.token;



      const loggedUser =

        res.data?.user ||

        res.data?.data?.user;



      localStorage.setItem(

        "jeepney_auth_token",

        receivedToken

      );



      setUser(loggedUser);



      return {

        success: true

      };



    } catch (error) {



      const message =

        error.response?.data?.message ||

        error.message ||

        "Login failed";



      setError(message);



      return {

        success: false,

        error: message

      };



    } finally {


      setLoading(false);


    }


  };





  const logout = async () => {


    try {


      await api.post(
        "/auth/logout"
      );


    } catch {

      // Ignore logout API errors

    }



    localStorage.removeItem(

      "jeepney_auth_token"

    );



    setUser(null);


    setError(null);


  };





  return (


    <AuthContext.Provider


      value={{

        user,

        loading,

        error,

        login,

        logout,

        setError

      }}


    >


      {children}


    </AuthContext.Provider>


  );


};



export default AuthProvider;