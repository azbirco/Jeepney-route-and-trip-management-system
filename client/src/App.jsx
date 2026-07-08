import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layouts/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Jeepneys from "./pages/Jeepneys";
import RoutesPage from "./pages/Routes";
import Schedules from "./pages/Schedules";
import Trips from "./pages/Trips";
import Passengers from "./pages/Passengers";
import Reports from "./pages/Reports";
import Synchronization from "./pages/Synchronization";
import ActivityLogs from "./pages/ActivityLogs";
import Profile from "./pages/Profile";


export default function App() {

  return (
    <Routes>

      {/* PUBLIC ROUTE */}
      <Route
        path="/login"
        element={<Login />}
      />


      {/* PROTECTED ROUTES */}
      <Route element={<ProtectedRoute />}>

        <Route element={<Layout />}>

          <Route 
            path="/" 
            element={<Dashboard />} 
          />

          <Route 
            path="/dashboard" 
            element={<Dashboard />} 
          />

          <Route 
            path="/jeepneys" 
            element={<Jeepneys />} 
          />

          <Route 
            path="/routes" 
            element={<RoutesPage />} 
          />

          <Route 
            path="/schedules" 
            element={<Schedules />} 
          />

          <Route 
            path="/trips" 
            element={<Trips />} 
          />

          <Route 
            path="/passengers" 
            element={<Passengers />} 
          />

          <Route 
            path="/reports" 
            element={<Reports />} 
          />

          <Route 
            path="/synchronization" 
            element={<Synchronization />} 
          />

          <Route 
            path="/activity-logs" 
            element={<ActivityLogs />} 
          />

          <Route 
            path="/profile" 
            element={<Profile />} 
          />

        </Route>

      </Route>


    </Routes>
  );
}