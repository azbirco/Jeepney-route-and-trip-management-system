import synchronizationService from '../services/synchronizationService.js';


// @desc    Send Summary Reports to Central Admin
// @route   POST /api/synchronization/sync-summaries
// @access  Private (Transportation Personnel)
export const sendSummaryReports = async (req, res) => {

  try {

    const {
      startDate,
      endDate
    } = req.body;


    const result =
      await synchronizationService.sendSummaryReports(
        startDate,
        endDate,
        req.user?.id,
        req.ip
      );


    res.status(200).json({

      success: true,

      message:
        'Summary reports synchronized successfully',

      data: result

    });


  } catch (error) {


    res.status(500).json({

      success:false,

      message:
        'Error synchronizing summary reports',

      error:error.message

    });


  }

};




// @desc    Send Transaction Records
// @route   POST /api/synchronization/sync-transactions
// @access  Private
export const sendTransactionRecords = async (req,res)=>{

  try {


    const result =
      await synchronizationService.sendTransactionRecords(
        req.user?.id,
        req.ip
      );


    res.status(200).json({

      success:true,

      message:
        'Terminal transaction logs synchronized successfully',

      data:result

    });



  }catch(error){


    res.status(500).json({

      success:false,

      message:
        'Error synchronizing transaction logs',

      error:error.message

    });


  }

};




// @desc    Retry Failed Synchronization
// @route   POST /api/synchronization/retry/:id
// @access  Private
export const retrySynchronization = async(req,res)=>{

  try {


    const updatedLog =
      await synchronizationService.retrySynchronization(

        req.params.id,

        req.user?.id,

        req.ip

      );



    res.status(200).json({

      success:true,

      message:
        'Synchronization session retried successfully.',

      data:updatedLog

    });



  }catch(error){


    const status =
      error.message.includes('not found')
      ? 404
      : 400;


    res.status(status).json({

      success:false,

      message:error.message

    });


  }

};




// @desc    Get Synchronization Logs
// @route   GET /api/synchronization/logs
// @access  Private
export const getSynchronizationLogs = async(req,res)=>{

  try {


    const logs =
      await synchronizationService.getSynchronizationLogs();



    res.status(200).json({

      success:true,

      count:logs.length,

      data:logs

    });



  }catch(error){


    res.status(500).json({

      success:false,

      message:
        'Error retrieving synchronization logs',

      error:error.message

    });


  }

};