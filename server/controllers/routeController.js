import Route from '../models/Route.js';
import ActivityLog from '../models/ActivityLog.js';
import { notifyAdmin } from '../services/notifyService.js';


// CREATE ROUTE
export const createRoute = async (req, res) => {

  try {

    const {
      origin,
      destination,
      estimatedTravelTime,
      estimatedFare,
      status
    } = req.body;


    const route = await Route.create({

      origin,

      destination,

      estimatedTravelTime:
        Number(estimatedTravelTime),

      estimatedFare:
        Number(estimatedFare),

      status:
        status || 'Active'

    });


    try {

      await ActivityLog.create({

        user: req.user?._id,

        action: 'Create Route',

        details:
          `Created route ${route.origin} - ${route.destination}`,


      });

    } catch(logError) {

      console.error(
        "ACTIVITY LOG ERROR:",
        logError
      );

    }


    // Changes totalRoutes on the central admin dashboard.
    notifyAdmin();


    res.status(201).json({

      success: true,

      message: 'Route created successfully',

      data: route

    });


  } catch(error) {


    console.error(
      "CREATE ROUTE ERROR:",
      error
    );


    if(error.code === 11000){

      return res.status(400).json({

        success:false,

        message:
          "This route already exists."

      });

    }


    if(error.name === "ValidationError"){

      return res.status(400).json({

        success:false,

        message:
          Object.values(error.errors)
          .map(err => err.message)
          .join(", ")

      });

    }


    res.status(500).json({

      success:false,

      message:
        "Server error while creating route."

    });


  }

};




// GET ALL ROUTES
export const getRoutes = async (req,res)=>{

  try {


    const {
      search,
      origin,
      destination
    } = req.query;


    const query = {};


    if(origin){

      query.origin = origin;

    }


    if(destination){

      query.destination = destination;

    }


    if(search){

      query.$or = [

        {
          routeCode:{
            $regex:search,
            $options:'i'
          }
        },

        {
          origin:{
            $regex:search,
            $options:'i'
          }
        },

        {
          destination:{
            $regex:search,
            $options:'i'
          }
        }

      ];

    }


    const routes =
      await Route.find(query)
      .sort({
        createdAt:-1
      });



    res.status(200).json({

      success:true,

      count:routes.length,

      data:routes

    });



  } catch(error) {


    res.status(500).json({

      success:false,

      message:error.message

    });


  }

};




// GET ROUTE BY ID
export const getRouteById = async(req,res)=>{

  try {


    const route =
      await Route.findById(
        req.params.id
      );


    if(!route){

      return res.status(404).json({

        success:false,

        message:"Route not found"

      });

    }


    res.status(200).json({

      success:true,

      data:route

    });



  } catch(error) {


    res.status(500).json({

      success:false,

      message:error.message

    });


  }

};




// UPDATE ROUTE
export const updateRoute = async(req,res)=>{

  try {


    const route =
      await Route.findByIdAndUpdate(

        req.params.id,

        {

          origin:req.body.origin,

          destination:req.body.destination,

          estimatedTravelTime:
            Number(req.body.estimatedTravelTime),

          estimatedFare:
            Number(req.body.estimatedFare),

          status:req.body.status

        },

        {

          new:true,

          runValidators:true

        }

      );



    if(!route){

      return res.status(404).json({

        success:false,

        message:"Route not found"

      });

    }



    try {

      await ActivityLog.create({

        user:req.user?._id,

        action:'Update Route',

        details:
          `Updated route ${route.origin} - ${route.destination}`,


      });


    } catch(logError){

      console.error(
        "ACTIVITY LOG ERROR:",
        logError
      );

    }


    // Not notifying here — a route edit (fare, travel time, status)
    // doesn't change totalRoutes or anything currently reflected in
    // the external summary/transactions payload.


    res.status(200).json({

      success:true,

      message:"Route updated successfully",

      data:route

    });



  } catch(error) {


    console.error(
      "UPDATE ROUTE ERROR:",
      error
    );


    if(error.code === 11000){

      return res.status(400).json({

        success:false,

        message:
          "This route already exists."

      });

    }



    if(error.name === "ValidationError"){

      return res.status(400).json({

        success:false,

        message:
          Object.values(error.errors)
          .map(err=>err.message)
          .join(", ")

      });

    }



    res.status(500).json({

      success:false,

      message:error.message

    });


  }

};




// DELETE ROUTE
export const deleteRoute = async(req,res)=>{

  try {


    const route =
      await Route.findByIdAndDelete(
        req.params.id
      );


    if(!route){

      return res.status(404).json({

        success:false,

        message:"Route not found"

      });

    }



    try {

      await ActivityLog.create({

        user:req.user?._id,

        action:"Delete Route",

        details:
          `Deleted route ${route.origin} - ${route.destination}`,


      });


    } catch(logError){

      console.error(
        "ACTIVITY LOG ERROR:",
        logError
      );

    }


    // Changes totalRoutes on the central admin dashboard.
    notifyAdmin();


    res.status(200).json({

      success:true,

      message:
        "Route deleted successfully"

    });



  } catch(error) {


    res.status(500).json({

      success:false,

      message:error.message

    });


  }

};