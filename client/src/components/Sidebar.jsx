import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import useAuth from '../hooks/useAuth';
import api from '../services/api';

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
  ChevronRight,
  UserCog
} from 'lucide-react';


const Sidebar = ({ isMobileOpen = false, setIsMobileOpen = () => {} }) => {

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Badge count: Admin/Terminal Personnel see pending arrival confirmations;
  // Driver sees pending new-assignment/cancellation notifications. Only
  // one of these is ever non-zero for a given role.
  const [badgeCount, setBadgeCount] = useState(0);


  useEffect(() => {

    if (!user) return;

    const isDispatchRole = user.role === 'Admin' || user.role === 'Terminal Personnel';
    const isDriverRole = user.role === 'Driver';

    if (!isDispatchRole && !isDriverRole) return;

    const endpoint = isDispatchRole
      ? '/trips/pending-arrivals-count'
      : '/trips/my-notifications-count';

    const fetchBadgeCount = async () => {
      try {
        const response = await api.get(endpoint);
        if (response.data.success) {
          setBadgeCount(response.data.count);
        }
      } catch (err) {
        console.error('Error fetching badge count:', err);
      }
    };

    fetchBadgeCount();

    // Poll periodically so the badge stays current across pages.
    const interval = setInterval(fetchBadgeCount, 30000);

    return () => clearInterval(interval);

  }, [user]);


  if (!user) return null;


  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };


  const personnelLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Jeepneys', path: '/jeepneys', icon: Bus },
    { name: 'Routes', path: '/routes', icon: RouteIcon },
    { name: 'Schedules', path: '/schedules', icon: CalendarDays },
    { name: 'Trips', path: '/trips', icon: Compass },
    { name: 'Passengers', path: '/passengers', icon: FileSpreadsheet },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Profile', path: '/profile', icon: User }
  ];


  const adminLinks = [
    ...personnelLinks.slice(0, -1),
    { name: 'Synchronization', path: '/synchronization', icon: RefreshCw },
    { name: 'Activity Logs', path: '/activity-logs', icon: History },
    { name: 'Users', path: '/users', icon: UserCog },
    { name: 'Profile', path: '/profile', icon: User }
  ];


  const driverLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Trips', path: '/my-trips', icon: Compass },
    { name: 'Profile', path: '/profile', icon: User }
  ];


  const getNavLinks = () => {
    switch (user.role) {
      case 'Admin':
        return adminLinks;
      case 'Driver':
        return driverLinks;
      case 'Terminal Personnel':
      default:
        return personnelLinks;
    }
  };


  const navLinks = getNavLinks();

  // Which nav item gets the badge depends on role: dispatch roles badge
  // "Trips", Driver badges "My Trips".
  const badgeTargetName = user.role === 'Driver' ? 'My Trips' : 'Trips';


  const sidebarVariants = {
    expanded: { width: '260px' },
    collapsed: { width: '80px' }
  };


  return (

    <>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <motion.aside
        variants={sidebarVariants}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          fixed md:sticky top-0 left-0 bottom-0 z-40
          flex flex-col h-screen border-r border-[#27272A]
          bg-[#09090B]/90 backdrop-blur-md text-white md:translate-x-0
          ${isMobileOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full md:block'}
        `}
      >

        <div className="flex items-center justify-between h-20 px-6 border-b border-[#27272A]">

          <div className="flex items-center gap-3 overflow-hidden">

            <div className="flex items-center justify-center p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <Bus className="w-6 h-6 text-orange-500"/>
            </div>

            {!isCollapsed && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <span className="font-bold text-lg">
                  RouteOps<span className="text-orange-500">.NV</span>
                </span>
              </motion.div>
            )}

          </div>

          <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex">
            {isCollapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
          </button>

        </div>


        <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">

          {navLinks.map(item => {

            const Icon = item.icon;
            const showBadge = item.name === badgeTargetName && badgeCount > 0;

            return (

              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={({isActive}) => `
                  flex items-center gap-4 px-4 py-3 rounded-lg transition-all relative
                  ${isActive
                    ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}
                `}
              >

                <div className="relative">

                  <Icon size={20}/>

                  {showBadge && isCollapsed && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#09090B]" />
                  )}

                </div>

                {!isCollapsed && (
                  <span className="flex-1 flex items-center justify-between">
                    {item.name}
                    {showBadge && (
                      <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {badgeCount}
                      </span>
                    )}
                  </span>
                )}

              </NavLink>

            );

          })}

        </div>


        <div className="p-4 border-t border-[#27272A]">

          <button
            onClick={handleSignOut}
            className={`
              w-full flex items-center gap-4 rounded-lg py-2.5 transition-all
              border border-[#27272A] hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-500
              ${isCollapsed ? 'justify-center' : 'px-4'}
            `}
          >
            <LogOut size={20}/>
            {!isCollapsed && <span>Sign Out</span>}
          </button>

        </div>

      </motion.aside>

    </>

  );

};


export default Sidebar;