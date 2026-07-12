import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import useAuth from '../hooks/useAuth';

import {
  Bus,
  Route,
  Users,
  Compass,
  RefreshCw,
  Activity,
  PhilippinePeso,
  Calendar
} from 'lucide-react';

import { motion } from 'framer-motion';


const Dashboard = () => {

  const { user } = useAuth();

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);



  // API FETCH ONLY
  const loadDashboardData = useCallback(async () => {

    const response = await api.get('/dashboard');

    return response.data;

  }, []);



  // INITIAL LOAD
  useEffect(() => {

    let ignore = false;


    (async () => {

      try {

        const data = await loadDashboardData();


        if (!ignore) {

          setDashboard(data);

          setError(null);

        }


      }

      catch (err) {

        if (!ignore) {

          setError(

            err.response?.data?.message ||

            'Failed to load dashboard'

          );

        }

      }


      finally {

        if (!ignore) {

          setLoading(false);

        }

      }


    })();



    return () => {

      ignore = true;

    };


  }, [loadDashboardData]);




  if (loading) {

    return (

      <div className="flex items-center justify-center min-h-screen">

        <RefreshCw

          className="animate-spin text-orange-500"

          size={40}

        />

      </div>

    );

  }



  if (error) {

    return (

      <div className="flex flex-col items-center justify-center min-h-screen gap-4">

        <p className="text-red-400">

          {error}

        </p>


        <button

          onClick={() => window.location.reload()}

          className="
            px-4
            py-2
            bg-orange-500
            rounded-lg
            text-white
          "

        >

          Retry

        </button>


      </div>

    );

  }




  return (

    <div className="space-y-6">


      <div>

        <h1 className="text-3xl font-bold text-white">

          Dashboard

        </h1>


        <p className="text-zinc-400 mt-1">

          Transportation Monitoring Overview

        </p>

      </div>




      {/* KPI CARDS */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">


        <Card

          title="Jeepneys"

          value={dashboard.metrics.totalJeepneys}

          icon={<Bus size={22}/>}

        />



        <Card

          title="Routes"

          value={dashboard.metrics.activeRoutes}

          icon={<Route size={22}/>}

        />



        <Card

          title="Trips Today"

          value={dashboard.metrics.tripsToday}

          icon={<Calendar size={22}/>}

        />



        <Card

          title="Passengers"

          value={dashboard.metrics.passengersToday}

          icon={<Users size={22}/>}

        />


      </div>





      <div className={`grid gap-5 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>



        {/* TRIP STATUS */}

        <motion.div

          initial={{opacity:0,y:20}}

          animate={{opacity:1,y:0}}

          className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-2xl
            p-6
          "

        >


          <div className="flex items-center gap-3 mb-6">

            <Compass className="text-orange-500"/>

            <h2 className="text-lg font-semibold">

              Trip Status

            </h2>

          </div>



          <div className="space-y-4">


            <StatusItem
              label="Scheduled"
              value={dashboard.tripStatus.scheduled}
            />


            <StatusItem
              label="Departed"
              value={dashboard.tripStatus.departed}
            />


            <StatusItem
              label="Arrived"
              value={dashboard.tripStatus.arrived}
            />


            <StatusItem
              label="Cancelled"
              value={dashboard.tripStatus.cancelled}
            />


          </div>


        </motion.div>






        {/* REVENUE */}

        <motion.div

          initial={{opacity:0,y:20}}

          animate={{opacity:1,y:0}}

          className="
            bg-zinc-900
            border
            border-zinc-800
            rounded-2xl
            p-6
          "

        >


          <div className="flex items-center gap-3 mb-6">

            <PhilippinePeso className="text-orange-500"/>

            <h2 className="text-lg font-semibold">

              Revenue Overview

            </h2>

          </div>



          <div className="space-y-5">


            <div>

              <p className="text-zinc-400 text-sm">

                Estimated Revenue

              </p>


              <h3 className="text-3xl font-bold">

                ₱

                {dashboard.revenue.estimatedRevenue.toLocaleString()}

              </h3>


            </div>




            <div>

              <p className="text-zinc-400 text-sm">

                Average Occupancy

              </p>


              <h3 className="text-2xl font-bold">

                {dashboard.revenue.averageOccupancy}%

              </h3>


            </div>


          </div>


        </motion.div>






        {/* SYNCHRONIZATION - ADMIN ONLY */}

        {isAdmin && dashboard.synchronization && (

          <motion.div

            initial={{opacity:0,y:20}}

            animate={{opacity:1,y:0}}

            className="
              bg-zinc-900
              border
              border-zinc-800
              rounded-2xl
              p-6
            "

          >


            <div className="flex items-center gap-3 mb-6">

              <RefreshCw className="text-orange-500"/>

              <h2 className="text-lg font-semibold">

                Synchronization

              </h2>

            </div>



            <div className="space-y-4">


              <p>

                Status:

                <span className="ml-2 text-orange-400">

                  {dashboard.synchronization.status}

                </span>

              </p>



              <p>

                Records:

                <span className="ml-2">

                  {dashboard.synchronization.records}

                </span>

              </p>



              <p className="text-sm text-zinc-500">

                Last Sync

              </p>


              <p>

                {

                  dashboard.synchronization.lastSync

                  ?

                  new Date(

                    dashboard.synchronization.lastSync

                  ).toLocaleString()

                  :

                  'No synchronization'

                }


              </p>


            </div>


          </motion.div>

        )}


      </div>





      {/* ACTIVITY */}

      <motion.div

        initial={{opacity:0,y:20}}

        animate={{opacity:1,y:0}}

        className="
          bg-zinc-900
          border
          border-zinc-800
          rounded-2xl
          p-6
        "

      >


        <div className="flex items-center gap-3 mb-5">


          <Activity className="text-orange-500"/>


          <h2 className="text-lg font-semibold">

            Recent Activities

          </h2>


        </div>



        <div className="space-y-4">


          {

            dashboard.activities.map(activity => (

              <div

                key={activity._id}

                className="border-b border-zinc-800 pb-3"

              >

                <p className="text-sm">

                  {activity.details}

                </p>


                <span className="text-xs text-zinc-500">

                  {

                    new Date(

                      activity.createdAt

                    ).toLocaleString()

                  }

                </span>


              </div>

            ))

          }


        </div>


      </motion.div>



    </div>

  );

};





const Card = ({title,value,icon}) => (

  <motion.div

    whileHover={{y:-3}}

    className="
      bg-zinc-900
      border
      border-zinc-800
      rounded-2xl
      p-6
    "

  >

    <div className="flex justify-between">


      <div>

        <p className="text-zinc-400">

          {title}

        </p>


        <h3 className="text-3xl font-bold mt-2">

          {value}

        </h3>


      </div>



      <div className="text-orange-500">

        {icon}

      </div>



    </div>


  </motion.div>

);





const StatusItem = ({label,value}) => (

  <div className="flex justify-between">

    <span className="text-zinc-400">

      {label}

    </span>


    <span className="font-semibold">

      {value}

    </span>


  </div>

);



export default Dashboard;