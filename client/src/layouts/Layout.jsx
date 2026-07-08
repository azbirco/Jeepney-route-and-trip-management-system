
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function Layout() {

  return (

    <div className="flex min-h-screen bg-slate-950 text-white">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1">

        {/* Top Navigation */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">

          <Outlet />

        </main>

      </div>

    </div>

  );

}

