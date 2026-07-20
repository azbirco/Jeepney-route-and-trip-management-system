import { useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';

import useAuth from '../hooks/useAuth';


const pageTitles = {

  '/': {
    title: 'Operations Dashboard',
    subtitle: 'Plan Routes. Manage Trips. Monitor Operations.'
  },

  '/jeepneys': {
    title: 'Jeepney Management',
    subtitle: 'Active Public Utility Vehicles'
  },

  '/routes': {
    title: 'Route Management',
    subtitle: 'Travel corridors and regional fare formulas'
  },

  '/schedules': {
    title: 'Schedule Management',
    subtitle: 'Timetables and active weekday alignments'
  },

  '/trips': {
    title: 'Active Trip Registry',
    subtitle: 'Live trip dispatching and control'
  },

  '/passengers': {
    title: 'Passenger Statistics',
    subtitle: 'Real-time boarding metrics and stops logging'
  },

  '/reports': {
    title: 'Operational Reports',
    subtitle: 'Analytical metrics and compliance auditing'
  },

  '/activity-logs': {
    title: 'System Activity Logs',
    subtitle: 'Immutable record of staff actions'
  },

  '/profile': {
    title: 'My Profile',
    subtitle: 'Account details and session controls'
  }

};



const Navbar = ({ onMobileToggle }) => {


  const { user } = useAuth();


  const location = useLocation();



  if (!user) return null;



  const pageMeta =

    pageTitles[location.pathname] ||

    {
      title: 'RouteOps.NV',
      subtitle: 'Metro Jeepney Operations Control'
    };



  return (

    <header
      className="
        sticky
        top-0
        z-30
        flex
        items-center
        justify-between
        h-20
        px-6
        md:px-8
        border-b
        border-zinc-800
        bg-zinc-950/90
        backdrop-blur-md
      "
    >


      <div className="flex items-center gap-4">


        <button

          onClick={onMobileToggle}

          className="
            md:hidden
            flex
            items-center
            justify-center
            p-2
            rounded-lg
            hover:bg-zinc-900
            transition
          "

        >

          <Menu className="w-5 h-5" />

        </button>



        <div>


          <h2 className="font-bold text-lg md:text-xl">

            {pageMeta.title}

          </h2>



          <p className="hidden sm:block text-xs text-zinc-400 mt-1">

            {pageMeta.subtitle}

          </p>


        </div>


      </div>





      <div className="flex items-center gap-3">


        <div
          className="
            flex
            items-center
            justify-center
            w-10
            h-10
            rounded-full
            border
            border-zinc-800
            bg-zinc-900
          "
        >

          <User className="w-5 h-5 text-zinc-400" />

        </div>



        <div className="hidden lg:flex flex-col">


          <span className="text-sm font-semibold">

            {user.fullName || user.username || 'User'}

          </span>



          <span className="text-xs text-zinc-400">

            {user.role || 'Staff'}

          </span>


        </div>


      </div>


    </header>

  );

};



export default Navbar;