import Report from '../models/Report.js';
import Trip from '../models/Trip.js';
import Route from '../models/Route.js';
import Jeepney from '../models/Jeepney.js';
import PassengerStatistic from '../models/PassengerStatistic.js';
import ActivityLog from '../models/ActivityLog.js';


// Helper function for date filters
const getDateRange = (startDateStr, endDateStr) => {

  const start = startDateStr
    ? new Date(startDateStr)
    : new Date();

  const end = endDateStr
    ? new Date(endDateStr)
    : new Date();


  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);


  return {
    start,
    end
  };

};



// @desc    Daily Trip Report
// @route   GET /api/reports/daily-trips
// @access  Private
export const getDailyTripReport = async (req, res) => {

  try {

    const {
      startDate,
      endDate
    } = req.query;


    const {
      start,
      end
    } = getDateRange(startDate, endDate);



    const trips = await Trip.find({

      tripDate: {
        $gte: start,
        $lte: end
      }

    })
    .populate('jeepney')
    .populate('route')
    .populate('schedule');



    const tripsByStatus = {

      Scheduled: 0,
      Boarding: 0,
      "In Transit": 0,
      Completed: 0,
      Cancelled: 0

    };



    let completedTrips = 0;
    let cancelledTrips = 0;
    let totalPassengers = 0;



    trips.forEach(trip => {


      tripsByStatus[trip.status] =
        (tripsByStatus[trip.status] || 0) + 1;



      if (trip.status === "Completed") {

        completedTrips++;

        totalPassengers +=
          trip.passengerCount || 0;

      }



      if (trip.status === "Cancelled") {

        cancelledTrips++;

      }


    });



    const summaryData = {

      totalTrips: trips.length,

      completedTrips,

      cancelledTrips,

      totalPassengers,

      tripsByStatus

    };



    const report = await Report.create({

      reportType: "Daily Trip Report",

      generatedBy: req.user?.id,

      dateFrom: start,

      dateTo: end,

      summaryData

    });



    await ActivityLog.create({

      user: req.user?.id,

      action: "Generated Report",

      details:
        `Generated Daily Trip Report from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. ID: ${report._id}`,

      ipAddress: req.ip

    });



    res.status(200).json({

      success: true,

      reportId: report._id,

      data: summaryData,

      trips

    });



  } catch (error) {


    res.status(500).json({

      success: false,

      message: "Error generating Daily Trip Report",

      error: error.message

    });


  }

};





// @desc    Passenger Summary Report
// @route   GET /api/reports/passengers
// @access  Private
export const getPassengerSummaryReport = async (req, res) => {

  try {


    const {
      startDate,
      endDate
    } = req.query;



    const {
      start,
      end
    } = getDateRange(startDate, endDate);



    const completedTrips =
      await Trip.find({

        tripDate: {
          $gte: start,
          $lte: end
        },

        status: "Completed"

      })
      .select("_id");



    const stats =
      await PassengerStatistic.find({

        trip: {
          $in: completedTrips.map(
            trip => trip._id
          )
        }

      })
      .populate({

        path: "trip",

        populate: [
          "route",
          "schedule",
          "jeepney"
        ]

      });



    let totalPassengers = 0;
    let peakPassengerCount = 0;
    let peakTripCode = "N/A";
    let totalOccupancySum = 0;



    stats.forEach(stat => {


      totalPassengers +=
        stat.passengerCount;



      totalOccupancySum +=
        stat.occupancyRate || 0;



      if (
        stat.passengerCount >
        peakPassengerCount
      ) {

        peakPassengerCount =
          stat.passengerCount;


        peakTripCode =
          stat.trip?.tripCode || "N/A";

      }


    });



    const averageOccupancy =
      stats.length
        ? totalOccupancySum / stats.length
        : 0;



    const summaryData = {

      totalPassengers,

      averageOccupancy:
        Number(
          averageOccupancy.toFixed(2)
        ),

      peakRecord: {

        passengerCount: peakPassengerCount,

        tripCode: peakTripCode

      },

      recordsCount: stats.length

    };



    const report = await Report.create({

      reportType:
        "Passenger Summary Report",

      generatedBy: req.user?.id,

      dateFrom: start,

      dateTo: end,

      summaryData

    });



    await ActivityLog.create({

      user: req.user?.id,

      action: "Generated Report",

      details:
        `Generated Passenger Summary Report from ${start.toLocaleDateString()} to ${end.toLocaleDateString()}. ID: ${report._id}`,

      ipAddress: req.ip

    });



    res.status(200).json({

      success: true,

      reportId: report._id,

      data: summaryData,

      details: stats

    });



  } catch (error) {


    res.status(500).json({

      success: false,

      message:
        "Error generating Passenger Summary Report",

      error: error.message

    });


  }

};





// @desc    Route Summary Report
// @route   GET /api/reports/routes
// @access  Private
export const getRouteSummaryReport = async (req, res) => {

  try {


    const {
      startDate,
      endDate
    } = req.query;



    const {
      start,
      end
    } = getDateRange(startDate, endDate);



    const routes =
      await Route.find({});



    const routeSummary = [];



    for (const route of routes) {


      const trips =
        await Trip.find({

          route: route._id,

          tripDate: {
            $gte: start,
            $lte: end
          }

        });



      const completedTrips =
        trips.filter(
          trip => trip.status === "Completed"
        );



      routeSummary.push({

        routeId: route._id,

        origin: route.origin,

        destination: route.destination,

        estimatedFare: route.estimatedFare,

        totalTrips: trips.length,

        completedTrips:
          completedTrips.length,

        cancelledTrips:
          trips.filter(
            trip => trip.status === "Cancelled"
          ).length,

        totalPassengers:
          completedTrips.reduce(
            (sum, trip) =>
              sum + (trip.passengerCount || 0),
            0
          )

      });


    }



    const summaryData = {

      routesCount: routes.length,

      routeMetrics: routeSummary

    };



    const report = await Report.create({

      reportType:
        "Route Summary Report",

      generatedBy:req.user?.id,

      dateFrom:start,

      dateTo:end,

      summaryData

    });



    await ActivityLog.create({

      user:req.user?.id,

      action:"Generated Report",

      details:
        `Generated Route Summary Report. ID: ${report._id}`,

      ipAddress:req.ip

    });



    res.status(200).json({

      success:true,

      reportId:report._id,

      data:summaryData

    });



  }catch(error){


    res.status(500).json({

      success:false,

      message:"Error generating Route Summary Report",

      error:error.message

    });


  }

};





// @desc    Jeepney Activity Report
// @route   GET /api/reports/jeepneys
// @access  Private
export const getJeepneyActivityReport = async(req,res)=>{

  try {


    const {
      startDate,
      endDate
    } = req.query;



    const {
      start,
      end
    } = getDateRange(startDate,endDate);



    const jeepneys =
      await Jeepney.find({});



    const jeepneySummary = [];



    for(const jeepney of jeepneys){


      const trips =
        await Trip.find({

          jeepney: jeepney._id,

          tripDate:{
            $gte:start,
            $lte:end
          }

        });



      jeepneySummary.push({

        jeepneyId: jeepney._id,

        jeepneyNumber:
          jeepney.jeepneyNumber,

        plateNumber:
          jeepney.plateNumber,

        type:
          jeepney.type,

        currentStatus:
          jeepney.status,

        capacity:
          jeepney.capacity,

        tripsInPeriod:{

          totalTrips: trips.length,

          completedTrips:
            trips.filter(
              t=>t.status==="Completed"
            ).length,

          cancelledTrips:
            trips.filter(
              t=>t.status==="Cancelled"
            ).length

        }

      });


    }



    const summaryData = {

      totalJeepneysCount:
        jeepneys.length,

      jeepneyMetrics:
        jeepneySummary

    };



    const report = await Report.create({

      reportType:
        "Jeepney Activity Report",

      generatedBy:req.user?.id,

      dateFrom:start,

      dateTo:end,

      summaryData

    });



    res.status(200).json({

      success:true,

      reportId:report._id,

      data:summaryData

    });



  }catch(error){


    res.status(500).json({

      success:false,

      message:
        "Error generating Jeepney Activity Report",

      error:error.message

    });


  }

};





// @desc    Revenue Summary Report
// @route   GET /api/reports/revenue
// @access  Private
export const getRevenueSummaryReport = async(req,res)=>{

  try {


    const {
      startDate,
      endDate
    } = req.query;



    const {
      start,
      end
    } = getDateRange(startDate,endDate);



    const trips =
      await Trip.find({

        tripDate:{
          $gte:start,
          $lte:end
        },

        status:"Completed"

      })
      .populate("route");



    let revenue = 0;

    const revenueByRoute = {};



    trips.forEach(trip=>{


      if(!trip.route)
        return;



      const key =
        `${trip.route.origin}-${trip.route.destination}`;



      const amount =
        (trip.passengerCount || 0) *
        (trip.route.estimatedFare || 0);



      revenue += amount;



      if(!revenueByRoute[key]){

        revenueByRoute[key]={

          routeId:trip.route._id,

          origin:trip.route.origin,

          destination:trip.route.destination,

          revenue:0

        };

      }



      revenueByRoute[key].revenue += amount;


    });



    const summaryData = {

      overallEstimatedRevenue: revenue,

      completedTripsCount: trips.length,

      revenueByRoute:
        Object.values(revenueByRoute)

    };



    const report =
      await Report.create({

        reportType:
          "Revenue Summary Report",

        generatedBy:req.user?.id,

        dateFrom:start,

        dateTo:end,

        summaryData

      });



    res.status(200).json({

      success:true,

      reportId:report._id,

      data:summaryData

    });



  }catch(error){


    res.status(500).json({

      success:false,

      message:
        "Error generating Revenue Summary Report",

      error:error.message

    });


  }

};