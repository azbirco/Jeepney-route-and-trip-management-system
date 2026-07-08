import { useEffect, useState } from 'react';
import api from '../services/api';
import { History, RefreshCw } from 'lucide-react';


const ActivityLogs = () => {

  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);



  const fetchLogs = async () => {

    try {

      const res = await api.get('/activity-logs');


      const activityLogs =
        res.data?.data ||
        res.data?.logs ||
        res.data ||
        [];


      setLogs(activityLogs);


    } catch (err) {

      console.error(
        "Failed to fetch activity logs:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Failed to load activity logs"
      );


    } finally {

      setLoading(false);

    }

  };



  useEffect(() => {

    let cancelled = false;


    const initializeLogs = async () => {

      if (cancelled) return;


      setLoading(true);

      setError(null);


      await fetchLogs();


    };


    initializeLogs();


    return () => {

      cancelled = true;

    };


  }, []);





  return (

    <div className="space-y-6">


      <div>

        <h1 className="text-2xl font-bold text-white">

          Activity Logs

        </h1>


        <p className="text-zinc-400">

          System audit trail and user activities

        </p>

      </div>




      <div className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        overflow-hidden
      ">


        {loading ? (

          <div className="
            p-8
            text-center
            text-zinc-400
          ">

            Loading logs...

          </div>


        ) : error ? (

          <div className="p-8 text-center">

            <p className="text-red-400 mb-4">

              {error}

            </p>


            <button

              onClick={fetchLogs}

              className="
                inline-flex
                items-center
                gap-2
                px-4
                py-2
                rounded-lg
                bg-orange-500
                text-black
                font-medium
              "

            >

              <RefreshCw size={18}/>

              Retry

            </button>


          </div>


        ) : logs.length === 0 ? (

          <div className="p-8 text-center">


            <History

              size={40}

              className="
                mx-auto
                text-orange-500
                mb-4
              "

            />


            <p className="text-zinc-400">

              No activity logs found

            </p>


          </div>


        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">


              <thead>

                <tr className="
                  bg-zinc-950
                  border-b
                  border-zinc-800
                ">


                  <th className="text-left p-4">

                    User

                  </th>


                  <th className="text-left p-4">

                    Action

                  </th>


                  <th className="text-left p-4">

                    Details

                  </th>


                  <th className="text-left p-4">

                    IP Address

                  </th>


                  <th className="text-left p-4">

                    Date

                  </th>


                </tr>

              </thead>



              <tbody>


                {logs.map((log) => (

                  <tr

                    key={log._id}

                    className="
                      border-b
                      border-zinc-800
                    "

                  >

                    <td className="p-4">

                      {
                        log.user?.fullName ||
                        log.user?.username ||
                        "System"
                      }

                    </td>


                    <td className="p-4 text-orange-400">

                      {log.action || "-"}

                    </td>


                    <td className="p-4">

                      {log.details || "-"}

                    </td>


                    <td className="p-4">

                      {log.ipAddress || "-"}

                    </td>


                    <td className="p-4">

                      {
                        log.createdAt
                          ? new Date(
                              log.createdAt
                            ).toLocaleString()
                          : "-"
                      }

                    </td>


                  </tr>

                ))}


              </tbody>


            </table>

          </div>

        )}

      </div>


    </div>

  );

};


export default ActivityLogs;