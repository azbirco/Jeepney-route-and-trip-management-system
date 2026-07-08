import {
  Navigate,
  useLocation,
  Outlet
} from 'react-router-dom';
import { motion } from 'framer-motion';

import useAuth from '../hooks/useAuth';



const ProtectedRoute = ({

  children,

  allowedRoles = []

}) => {


  const {

    user,

    loading

  } = useAuth();



  const location = useLocation();



  if (loading) {

    return (

      <div
        className="
          min-h-screen
          bg-zinc-950
          flex
          items-center
          justify-center
        "
      >

        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >

          <motion.div

            animate={{
              rotate: 360
            }}

            transition={{

              repeat: Infinity,

              duration: 1.2,

              ease: "linear"

            }}

            className="
              w-10
              h-10
              rounded-full
              border-2
              border-orange-500
              border-t-transparent
            "

          />


          <p className="text-sm text-zinc-400">

            Verifying RouteOps session...

          </p>


        </div>


      </div>

    );

  }



  if (!user) {

    return (

      <Navigate

        to="/login"

        replace

        state={{

          from: location

        }}

      />

    );

  }



  const hasAccess =

    allowedRoles.length === 0 ||

    allowedRoles.some(

      (role) =>

        role.toLowerCase() ===

        user.role?.toLowerCase()

    );



  if (!hasAccess) {

    return (

      <Navigate

        to="/"

        replace

      />

    );

  }



return children || <Outlet />;

};



export default ProtectedRoute;