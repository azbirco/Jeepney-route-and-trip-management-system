import Trip from "../models/Trip.js";
import Jeepney from "../models/Jeepney.js";
import Route from "../models/Route.js";
import PassengerStatistic from "../models/PassengerStatistic.js";



// =====================================
// SUMMARY API
// GET /api/external/summary
// =====================================

export const getExternalSummary = async (req, res) => {

  try {


    // FIXED: dating walang filter, kaya kinukuha lahat ng jeepney
    // (kasama na yung Inactive). "Active fleet" = hindi Inactive
    // (Available + In Transit).
    const totalJeepneys =
      await Jeepney.countDocuments({
        status: { $ne: "Inactive" }
      });



    const totalRoutes =
      await Route.countDocuments();



    const totalTrips =
      await Trip.countDocuments();



    const totalPassengers =
      await Trip.aggregate([

        {
          $group:{
            _id:null,
            total:{
              $sum:"$passengerCount"
            }
          }
        }

      ]);



    const totalRevenue =
      await Trip.aggregate([

        {
          $match:{
            status:"Arrived"
          }
        },

        {
          $group:{
            _id:null,
            total:{
              $sum:"$estimatedRevenue"
            }
          }
        }

      ]);



    const tripsByStatus =
      await Trip.aggregate([

        {
          $group:{

            _id:"$status",

            count:{
              $sum:1
            }

          }

        }

      ]);



    // NEW: Revenue by Route — kulang na piece para sa "Revenue by Route"
    // bar chart sa dashboard mo. Dating wala talagang endpoint nito.
    const revenueByRouteRaw =
      await Trip.aggregate([

        {
          $match:{
            status:"Arrived"
          }
        },

        {
          $lookup:{
            from:"routes",
            localField:"route",
            foreignField:"_id",
            as:"routeInfo"
          }
        },

        {
          $unwind:"$routeInfo"
        },

        {
          $group:{
            _id:"$route",
            origin:{ $first:"$routeInfo.origin" },
            destination:{ $first:"$routeInfo.destination" },
            totalRevenue:{ $sum:"$estimatedRevenue" }
          }
        },

        {
          $sort:{ totalRevenue:-1 }
        }

      ]);


    const revenueByRoute =
      revenueByRouteRaw.map(item => ({
        route: `${item.origin} - ${item.destination}`,
        totalRevenue: item.totalRevenue
      }));



    const occupancy =
      await PassengerStatistic.aggregate([

        {
          $group:{

            _id:null,

            average:{
              $avg:"$occupancyRate"
            }

          }

        }

      ]);



    const statusSummary = {

      Scheduled:0,

      Departed:0,

      Arrived:0,

      Cancelled:0

    };



    tripsByStatus.forEach(item=>{

      statusSummary[item._id] =
        item.count;

    });



    res.json({

      success:true,

      data:{

        // NEW: para malaman ni central admin kung gaano ka-fresh
        // itong data (useful kung nag-cache siya sa kanyang side)
        generatedAt:
          new Date(),


        totalJeepneys,


        totalRoutes,


        totalTrips,


        totalPassengers:
          totalPassengers[0]?.total || 0,


        totalEstimatedRevenue:
          totalRevenue[0]?.total || 0,


        averageOccupancyRate:
          Math.round(
            occupancy[0]?.average || 0
          ),


        tripsByStatus:
          statusSummary,


        // NEW: para sa "Revenue by Route" bar chart
        revenueByRoute

      }

    });



  }

  catch(error){

    console.error(error);


    res.status(500).json({

      success:false,

      message:"Failed to generate summary"

    });

  }

};






// =====================================
// TRANSACTIONS API
// GET /api/external/transactions
// =====================================

export const getExternalTransactions = async (req,res)=>{


  try{


    // NEW: optional query params para may date range at pagination
    // ang central admin, kung sakaling kailangan niya
    const {
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;


    const filter = {};

    if (startDate || endDate) {

      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }

    }


    const pageNum = Math.max(parseInt(page) || 1, 1);

    const limitNum = Math.min(parseInt(limit) || 50, 100);

    const skip = (pageNum - 1) * limitNum;


    const totalCount =
      await Trip.countDocuments(filter);


    const trips = await Trip.find(filter)

      // FIXED: dating "routeName ... fare" — mga fields na hindi
      // umiiral sa Route schema. Totoong fields ay routeCode at
      // estimatedFare.
      .populate(
        "route",
        "routeCode origin destination estimatedFare"
      )

      .populate(
        "jeepney",
        "plateNumber jeepneyNumber"
      )

      .populate(
        "driver",
        "username fullName"
      )

      .sort({
        createdAt:1
      })

      .skip(skip)

      .limit(limitNum)

      .lean();





    const transactions = trips.map(trip=>({


      _id:
        trip._id,


      type:
        "trip",


      tripCode:
        trip.tripCode,


      route:

        trip.route

        ?

        `${trip.route.origin} - ${trip.route.destination}`

        :

        null,



      jeepney:

        trip.jeepney

        ?

        trip.jeepney.plateNumber

        :

        null,



      driver:

        trip.driver

        ?

        trip.driver.fullName

        :

        null,



      passengerCount:
        trip.passengerCount,



   

      amount:
        trip.estimatedRevenue,



      status:
        trip.status,



      timestamp:
        trip.createdAt


    }));





    res.json({

      success:true,

      data:transactions,

   
      pagination:{
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        limit: limitNum
      }

    });



  }

  catch(error){


    console.error(error);



    res.status(500).json({

      success:false,

      message:"Failed to fetch transactions"

    });


  }


};

export const getExternalRoutes = async (req,res)=>{


  try{
    const routes = await Route.find()
      .sort({
        createdAt:1
      })
      .lean();


    res.json({
      success:true,
      data:routes
    });
  }
  catch(error){
    console.error(error);
    res.status(500).json({
      success:false,
      message:"Failed to fetch routes"
    });
  }
};