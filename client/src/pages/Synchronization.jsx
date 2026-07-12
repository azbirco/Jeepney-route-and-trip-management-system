import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Database,
  FileSpreadsheet,
  History,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

import { motion } from 'framer-motion';


const Synchronization = () => {

  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [statusFilter, setStatusFilter] = useState('All');

  const [actionLoading, setActionLoading] = useState(null);

  const [notice, setNotice] = useState(null);



  // ================================
  // FETCH LOGS
  // ================================

  const loadLogs = useCallback(async () => {

    const response = await api.get('/synchronization/logs');

    return response.data;

  }, []);



  const refreshLogs = async () => {

    try {

      const data = await loadLogs();

      setLogs(data.data || []);

      setError(null);

    }

    catch (err) {

      setError(

        err.response?.data?.message ||

        'Failed to load synchronization logs'

      );

    }

  };



  useEffect(() => {

    let ignore = false;


    (async () => {

      try {

        const data = await loadLogs();


        if (!ignore) {

          setLogs(data.data || []);

          setError(null);

        }

      }

      catch (err) {

        if (!ignore) {

          setError(

            err.response?.data?.message ||

            'Failed to load synchronization logs'

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


  }, [loadLogs]);




  // ================================
  // ACTIONS
  // ================================

  const handleManualSync = async (type) => {

    setActionLoading(type);

    setNotice(null);


    try {

      const endpoint =

        type === 'summaries'

          ? '/synchronization/sync-summaries'

          : '/synchronization/sync-transactions';


      const response = await api.post(endpoint);


      setNotice({

        type: 'success',

        message:

          response.data?.message ||

          'Synchronization completed.'

      });


      await refreshLogs();

    }

    catch (err) {

      setNotice({

        type: 'error',

        message:

          err.response?.data?.message ||

          'Synchronization failed. Check the logs below.'

      });


      await refreshLogs();

    }

    finally {

      setActionLoading(null);

    }

  };



  const handleRetry = async (id) => {

    setActionLoading(id);

    setNotice(null);


    try {

      await api.post(`/synchronization/retry/${id}`);


      setNotice({

        type: 'success',

        message: 'Sync session retried successfully.'

      });


      await refreshLogs();

    }

    catch (err) {

      setNotice({

        type: 'error',

        message:

          err.response?.data?.message ||

          'Retry failed. Please try again.'

      });

    }

    finally {

      setActionLoading(null);

    }

  };




  // ================================
  // DERIVED DATA
  // ================================

  const successCount = logs.filter(

    log => log.syncStatus === 'Success'

  ).length;


  const failedCount = logs.filter(

    log => log.syncStatus === 'Failed'

  ).length;


  const pendingCount = logs.filter(

    log => log.syncStatus === 'Pending'

  ).length;


  const filteredLogs =

    statusFilter === 'All'

      ? logs

      : logs.filter(

          log => log.syncStatus === statusFilter

        );




  // ================================
  // RENDER STATES
  // ================================

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


      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>

          <h1 className="text-3xl font-bold text-white">

            Synchronization

          </h1>


          <p className="text-zinc-400 mt-1">

            Terminal-to-cloud data replication status

          </p>

        </div>



        <div className="flex flex-wrap gap-3">

          <button

            onClick={() => handleManualSync('summaries')}

            disabled={actionLoading === 'summaries'}

            className="
              flex
              items-center
              gap-2
              px-4
              py-2.5
              rounded-lg
              bg-zinc-900
              border
              border-zinc-800
              text-sm
              text-zinc-200
              hover:border-orange-500/40
              hover:text-orange-400
              transition-all
              disabled:opacity-50
              disabled:cursor-not-allowed
            "

          >

            {

              actionLoading === 'summaries'

                ? <RefreshCw size={16} className="animate-spin"/>

                : <FileSpreadsheet size={16}/>

            }

            Sync Summaries

          </button>



          <button

            onClick={() => handleManualSync('transactions')}

            disabled={actionLoading === 'transactions'}

            className="
              flex
              items-center
              gap-2
              px-4
              py-2.5
              rounded-lg
              bg-orange-500
              text-sm
              text-white
              font-medium
              hover:bg-orange-600
              transition-all
              disabled:opacity-50
              disabled:cursor-not-allowed
            "

          >

            {

              actionLoading === 'transactions'

                ? <RefreshCw size={16} className="animate-spin"/>

                : <Database size={16}/>

            }

            Sync Transactions Now

          </button>


        </div>


      </div>




      {notice && (

        <motion.div

          initial={{ opacity: 0, y: -10 }}

          animate={{ opacity: 1, y: 0 }}

          className={`

            flex

            items-center

            gap-3

            px-4

            py-3

            rounded-xl

            border

            text-sm

            ${

              notice.type === 'success'

                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'

                : 'bg-red-500/10 border-red-500/20 text-red-400'

            }

          `}

        >

          {

            notice.type === 'success'

              ? <CheckCircle2 size={18}/>

              : <AlertTriangle size={18}/>

          }

          {notice.message}

        </motion.div>

      )}




      {/* SUMMARY CARDS */}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">


        <SummaryCard

          title="Total Sessions"

          value={logs.length}

          icon={<History size={22}/>}

          accent="text-orange-500"

        />


        <SummaryCard

          title="Successful"

          value={successCount}

          icon={<CheckCircle2 size={22}/>}

          accent="text-emerald-400"

        />


        <SummaryCard

          title="Failed"

          value={failedCount}

          icon={<XCircle size={22}/>}

          accent="text-red-400"

        />


        <SummaryCard

          title="Pending"

          value={pendingCount}

          icon={<Clock size={22}/>}

          accent="text-yellow-400"

        />


      </div>




      {/* LOGS TABLE */}

      <motion.div

        initial={{ opacity: 0, y: 20 }}

        animate={{ opacity: 1, y: 0 }}

        className="
          bg-zinc-900
          border
          border-zinc-800
          rounded-2xl
          overflow-hidden
        "

      >


        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-center
          sm:justify-between
          gap-3
          p-6
          border-b
          border-zinc-800
        ">

          <div className="flex items-center gap-3">

            <RefreshCw className="text-orange-500" size={20}/>

            <h2 className="text-lg font-semibold">

              Sync History

            </h2>

          </div>



          <div className="flex gap-2">

            {

              ['All', 'Success', 'Failed', 'Pending'].map(

                option => (

                  <button

                    key={option}

                    onClick={() => setStatusFilter(option)}

                    className={`

                      px-3

                      py-1.5

                      rounded-lg

                      text-xs

                      font-medium

                      transition-all

                      ${

                        statusFilter === option

                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'

                          : 'text-zinc-400 hover:text-white border border-transparent'

                      }

                    `}

                  >

                    {option}

                  </button>

                )

              )

            }

          </div>

        </div>




        {filteredLogs.length === 0 ? (

          <div className="p-10 text-center text-zinc-500 text-sm">

            No synchronization sessions match this filter yet.

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead>

                <tr className="text-left text-zinc-500 border-b border-zinc-800">

                  <th className="px-6 py-3 font-medium">Session</th>

                  <th className="px-6 py-3 font-medium">Type</th>

                  <th className="px-6 py-3 font-medium">Records</th>

                  <th className="px-6 py-3 font-medium">Status</th>

                  <th className="px-6 py-3 font-medium">Timestamp</th>

                  <th className="px-6 py-3 font-medium text-right">Action</th>

                </tr>

              </thead>


              <tbody>

                {

                  filteredLogs.map(log => (

                    <tr

                      key={log._id}

                      className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors"

                    >

                      <td className="px-6 py-4 font-mono text-zinc-300">

                        {log.syncId}

                      </td>


                      <td className="px-6 py-4 text-zinc-400">

                        {log.payload?.syncType || '—'}

                      </td>


                      <td className="px-6 py-4 font-mono text-zinc-300">

                        {log.recordsTransmitted}

                      </td>


                      <td className="px-6 py-4">

                        <StatusBadge status={log.syncStatus}/>

                      </td>


                      <td className="px-6 py-4 text-zinc-500">

                        {

                          new Date(

                            log.lastSync || log.createdAt

                          ).toLocaleString()

                        }

                      </td>


                      <td className="px-6 py-4 text-right">

                        {

                          log.syncStatus === 'Failed' && (

                            <button

                              onClick={() => handleRetry(log._id)}

                              disabled={actionLoading === log._id}

                              className="
                                inline-flex
                                items-center
                                gap-1.5
                                px-3
                                py-1.5
                                rounded-lg
                                bg-zinc-800
                                text-xs
                                text-zinc-200
                                hover:bg-orange-500/10
                                hover:text-orange-400
                                transition-all
                                disabled:opacity-50
                              "

                            >

                              {

                                actionLoading === log._id

                                  ? <RefreshCw size={13} className="animate-spin"/>

                                  : <RotateCcw size={13}/>

                              }

                              Retry

                            </button>

                          )

                        }

                        {

                          log.errorMessage && (

                            <p

                              className="
                                text-xs
                                text-red-400/80
                                mt-1
                                max-w-[220px]
                                ml-auto
                                text-right
                              "

                              title={log.errorMessage}

                            >

                              {log.errorMessage}

                            </p>

                          )

                        }

                      </td>

                    </tr>

                  ))

                }

              </tbody>

            </table>

          </div>

        )}


      </motion.div>


    </div>

  );

};





const SummaryCard = ({ title, value, icon, accent }) => (

  <motion.div

    whileHover={{ y: -3 }}

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

        <h3 className="text-3xl font-bold mt-2 font-mono">

          {value}

        </h3>

      </div>

      <div className={accent}>

        {icon}

      </div>

    </div>

  </motion.div>

);




const StatusBadge = ({ status }) => {

  const styles = {

    Success:
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',

    Failed:
      'bg-red-500/10 text-red-400 border-red-500/20',

    Pending:
      'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'

  };


  return (

    <span

      className={`

        inline-flex

        items-center

        px-2.5

        py-1

        rounded-md

        text-xs

        font-medium

        border

        ${styles[status] || styles.Pending}

      `}

    >

      {status}

    </span>

  );

};



export default Synchronization;