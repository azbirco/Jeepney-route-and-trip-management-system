import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import useAuth from '../hooks/useAuth';

import {
  LayoutDashboard,
  Bus,
  Route as RouteIcon,
  CalendarDays,
  Compass,
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  User,
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';



const Sidebar = ({

  isMobileOpen = false,

  setIsMobileOpen = () => {}

}) => {


  const {

    user,

    logout

  } = useAuth();



  const navigate = useNavigate();



  const [

    isCollapsed,

    setIsCollapsed

  ] = useState(false);



  if (!user) return null;



  const handleSignOut = async () => {

    await logout();

    navigate('/login');

  };



  const adminLinks = [

    {
      name: 'Dashboard',
      path: '/',
      icon: LayoutDashboard
    },

    {
      name: 'Jeepneys',
      path: '/jeepneys',
      icon: Bus
    },

    {
      name: 'Routes',
      path: '/routes',
      icon: RouteIcon
    },

    {
      name: 'Schedules',
      path: '/schedules',
      icon: CalendarDays
    },

    {
      name: 'Trips',
      path: '/trips',
      icon: Compass
    },

    {
      name: 'Passengers',
      path: '/passengers',
      icon: FileSpreadsheet
    },

    {
      name: 'Reports',
      path: '/reports',
      icon: FileSpreadsheet
    },

    {
      name: 'Synchronization',
      path: '/synchronization',
      icon: RefreshCw
    },

    {
      name: 'Activity Logs',
      path: '/activity-logs',
      icon: History
    },

    {
      name: 'Profile',
      path: '/profile',
      icon: User
    }

  ];



  const personnelLinks = adminLinks.filter(

    item => item.name !== 'Activity Logs'

  );



  const navLinks =

    user.role?.toLowerCase() === 'admin'

      ? adminLinks

      : personnelLinks;



  const sidebarVariants = {

    expanded: {

      width: '260px'

    },

    collapsed: {

      width: '80px'

    }

  };



  return (

    <>

      {isMobileOpen && (

        <div

          className="
            fixed
            inset-0
            z-40
            bg-black/60
            md:hidden
            backdrop-blur-sm
          "

          onClick={() => setIsMobileOpen(false)}

        />

      )}



      <motion.aside

        variants={sidebarVariants}

        animate={

          isCollapsed

            ? 'collapsed'

            : 'expanded'

        }

        transition={{

          duration: 0.3,

          ease: 'easeInOut'

        }}

        className={`

          fixed md:sticky

          top-0 left-0 bottom-0

          z-40

          flex flex-col

          h-screen

          border-r

          border-[#27272A]

          bg-[#09090B]/90

          backdrop-blur-md

          text-white

          md:translate-x-0

          ${

            isMobileOpen

              ? 'translate-x-0 w-[260px]'

              : '-translate-x-full md:block'

          }

        `}

      >



        <div

          className="
            flex
            items-center
            justify-between
            h-20
            px-6
            border-b
            border-[#27272A]
          "

        >

          <div className="flex items-center gap-3 overflow-hidden">


            <div

              className="
                flex
                items-center
                justify-center
                p-2
                rounded-lg
                bg-orange-500/10
                border
                border-orange-500/20
              "

            >

              <Bus className="w-6 h-6 text-orange-500"/>

            </div>



            {!isCollapsed && (

              <motion.div

                initial={{
                  opacity: 0,
                  x: -10
                }}

                animate={{
                  opacity: 1,
                  x: 0
                }}

              >

                <span className="font-bold text-lg">

                  RouteOps

                  <span className="text-orange-500">

                    .NV

                  </span>

                </span>


              </motion.div>

            )}


          </div>



          <button

            onClick={() =>

              setIsCollapsed(!isCollapsed)

            }

            className="hidden md:flex"

          >

            {

              isCollapsed

                ? <ChevronRight size={18}/>

                : <ChevronLeft size={18}/>

            }


          </button>


        </div>





        <div

          className="
            flex-1
            px-4
            py-6
            space-y-1
            overflow-y-auto
          "

        >

          {

            navLinks.map(item => {


              const Icon = item.icon;



              return (

                <NavLink

                  key={item.path}

                  to={item.path}

                  onClick={() => setIsMobileOpen(false)}

                  className={({isActive}) => `

                    flex
                    items-center
                    gap-4
                    px-4
                    py-3
                    rounded-lg
                    transition-all

                    ${
                      isActive

                        ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'

                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                    }

                  `}

                >

                  <Icon size={20}/>



                  {!isCollapsed && (

                    <span>

                      {item.name}

                    </span>

                  )}


                </NavLink>

              );


            })

          }


        </div>





        <div

          className="
            p-4
            border-t
            border-[#27272A]
          "

        >

          <button

            onClick={handleSignOut}

            className={`

              w-full

              flex

              items-center

              gap-4

              rounded-lg

              py-2.5

              transition-all

              border

              border-[#27272A]

              hover:border-red-500/30

              hover:bg-red-500/5

              hover:text-red-500

              ${
                isCollapsed

                  ? 'justify-center'

                  : 'px-4'
              }

            `}

          >

            <LogOut size={20}/>



            {!isCollapsed && (

              <span>

                Sign Out

              </span>

            )}


          </button>


        </div>



      </motion.aside>


    </>

  );


};



export default Sidebar;