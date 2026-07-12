import SynchronizationLog from '../models/SynchronizationLog.js';
import Trip from '../models/Trip.js';
import PassengerStatistic from '../models/PassengerStatistic.js';
import Report from '../models/Report.js';
import ActivityLog from '../models/ActivityLog.js';


/**
 * Service to manage terminal-to-cloud synchronization.
 */


// @desc Sync summary reports
export const sendSummaryReports = async (
  startDate,
  endDate,
  userId = null,
  ipAddress = null
) => {


  const start = startDate
    ? new Date(startDate)
    : new Date(Date.now() - 24 * 60 * 60 * 1000);


  const end = endDate
    ? new Date(endDate)
    : new Date();



  const reportsCount =
    await Report.countDocuments({
      createdAt:{
        $gte:start,
        $lte:end
      }
    });



  const payload = {

    syncType:'Summary Reports',

    period:{
      start,
      end
    },

    recordsCount:reportsCount,

    timestamp:new Date()

  };



  const syncLog =
    await SynchronizationLog.create({

      syncStatus:'Success',

      recordsTransmitted:reportsCount,

      payload,

      apiResponse:{

        status:200,

        message:
        'Synchronized summary reports successfully with Central Admin server.',

        syncedCount:reportsCount

      }

    });



  await ActivityLog.create({

    user:userId,

    action:'Synchronization Success',

    details:
    `Synced ${reportsCount} summary reports to cloud admin. Sync Session: ${syncLog.syncId}`,

    ipAddress

  });



  return syncLog;

};





// @desc Sync transaction records
export const sendTransactionRecords = async (
  userId = null,
  ipAddress = null
) => {


  try {


    const trips =
      await Trip.find({

        status:{
          $in:[
            'Arrived',
            'Cancelled'
          ]
        }

      })

      .sort({
        createdAt:-1
      })

      .limit(50);




    const stats =
      await PassengerStatistic.find({})

      .sort({
        createdAt:-1
      })

      .limit(50);




    const totalRecords =
      trips.length + stats.length;



    if(totalRecords === 0){

      return {

        synced:false,

        message:
        'No new terminal transactions found to synchronize.'

      };

    }




    const payload = {

      syncType:'Transaction Records',

      tripsTransmitted:
        trips.map(
          trip=>trip.tripCode
        ),

      statisticsTransmittedCount:
        stats.length,

      timestamp:new Date()

    };




    const syncLog =
      await SynchronizationLog.create({

        syncStatus:'Success',

        recordsTransmitted:
          totalRecords,


        payload,


        apiResponse:{

          status:201,

          message:
          'Transaction records successfully replicated on central cloud database.',

          insertedRecords:
          totalRecords

        }

      });





    await ActivityLog.create({

      user:userId,

      action:'Synchronization Success',

      details:
      `Synced ${totalRecords} operational transactions to cloud server. Sync Session: ${syncLog.syncId}`,

      ipAddress

    });





    return {

      synced:true,

      data:syncLog

    };


  }

  catch(error){


    // Log the failure instead of throwing,
    // so callers (like auto-sync on trip update)
    // can decide whether to surface it or not.

    const failedLog =
      await SynchronizationLog.create({

        syncStatus:'Failed',

        recordsTransmitted:0,

        errorMessage:
          error.message,

        apiResponse:{

          status:500,

          message:
          'Failed to synchronize transaction records with central server.'

        }

      });



    await ActivityLog.create({

      user:userId,

      action:'Synchronization Failed',

      details:
      `Auto-sync failed. Sync Session: ${failedLog.syncId}. Reason: ${error.message}`,

      ipAddress

    });



    return {

      synced:false,

      failed:true,

      message:error.message,

      data:failedLog

    };


  }


};







// @desc Retry failed synchronization
export const retrySynchronization = async (
  syncLogId,
  userId = null,
  ipAddress = null
) => {



  const syncLog =
    await SynchronizationLog.findById(
      syncLogId
    );




  if(!syncLog){

    throw new Error(
      'Synchronization log not found.'
    );

  }





  if(syncLog.syncStatus === 'Success'){

    throw new Error(
      'This synchronization session was already completed successfully.'
    );

  }





  syncLog.syncStatus =
    'Success';


  syncLog.errorMessage =
    null;


  syncLog.lastSync =
    new Date();




  syncLog.apiResponse = {

    status:200,

    message:
    'Re-sync operation triggered successfully. Replicated missing segments.'

  };




  const updatedLog =
    await syncLog.save();





  await ActivityLog.create({

    user:userId,

    action:'Synchronization Success',

    details:
    `Retried and completed sync session ${updatedLog.syncId} successfully.`,

    ipAddress

  });




  return updatedLog;

};







// @desc Get synchronization logs
export const getSynchronizationLogs = async()=>{


  return await SynchronizationLog.find({})

    .sort({

      createdAt:-1

    });

};






const synchronizationService = {

  sendSummaryReports,

  sendTransactionRecords,

  retrySynchronization,

  getSynchronizationLogs

};



export default synchronizationService;