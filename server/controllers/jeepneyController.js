import Jeepney from '../models/Jeepney.js';
import ActivityLog from '../models/ActivityLog.js';
import { notifyAdmin } from '../services/notifyService.js';


// CREATE JEEPNEY
export const createJeepney = async (req, res) => {

  try {

    console.log("CREATE JEEPNEY REQUEST:");
    console.log(req.body);


    const jeepney = await Jeepney.create({

      plateNumber: req.body.plateNumber,

      type:
        req.body.type || 'Traditional Jeepney',

      capacity:
        Number(req.body.capacity),

      status:
        req.body.status || 'Available'

    });



    await ActivityLog.create({

      user: req.user?._id,

      action: 'Create Jeepney',

      details:
        `Created jeepney ${jeepney.plateNumber}`,


    });



    // Changes totalJeepneys on the central admin dashboard.
    notifyAdmin();



    res.status(201).json({

      success:true,

      message:
        'Jeepney created successfully',

      data: jeepney

    });



  } catch(error) {


    console.error(
      "CREATE JEEPNEY ERROR:",
      error
    );



    if(error.code === 11000){

      const field =
        Object.keys(error.keyPattern)[0];


      return res.status(400).json({

        success:false,

        message:
          `${field} already exists.`

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
        "Server error while creating jeepney."

    });

  }

};




// GET ALL JEEPNEYS
export const getJeepneys = async (req,res)=>{

  try{

    const {
      search,
      status,
      type
    } = req.query;


    const query = {};


    if(status){
      query.status = status;
    }


    if(type){
      query.type = type;
    }



    let jeepneys =
      await Jeepney.find(query)
      .sort({
        createdAt:-1
      });



    if(search){

      const regex =
        new RegExp(search,'i');


      jeepneys =
        jeepneys.filter(j =>
          regex.test(j.plateNumber || '') ||
          regex.test(j.jeepneyNumber || '') ||
          regex.test(j.type || '')
        );

    }



    res.status(200).json({

      success:true,

      count:jeepneys.length,

      data:jeepneys

    });



  }catch(error){

    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};




// GET JEEPNEY BY ID
export const getJeepneyById = async(req,res)=>{

  try{


    const jeepney =
      await Jeepney.findById(req.params.id);



    if(!jeepney){

      return res.status(404).json({

        success:false,

        message:
          "Jeepney not found"

      });

    }



    res.status(200).json({

      success:true,

      data:jeepney

    });



  }catch(error){


    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};




// UPDATE JEEPNEY
export const updateJeepney = async(req,res)=>{

  try{


    const jeepney =
      await Jeepney.findByIdAndUpdate(

        req.params.id,

        req.body,

        {
          new:true,
          runValidators:true
        }

      );



    if(!jeepney){

      return res.status(404).json({

        success:false,

        message:
          "Jeepney not found"

      });

    }



    await ActivityLog.create({

      user:req.user?._id,

      action:
        "Update Jeepney",

      details:
        `Updated jeepney ${jeepney.plateNumber}`,


    });



    // Not notifying here — a jeepney edit (plate, capacity, status)
    // doesn't change totalJeepneys or anything else reflected in the
    // external summary/transactions payload.


    res.status(200).json({

      success:true,

      message:
        "Jeepney updated successfully",

      data:jeepney

    });



  }catch(error){


    console.error(
      "UPDATE JEEPNEY ERROR:",
      error
    );


    if(error.code === 11000){

      return res.status(400).json({

        success:false,

        message:
          "Plate number already exists."

      });

    }



    res.status(400).json({

      success:false,

      message:error.message

    });

  }

};




// DELETE JEEPNEY
export const deleteJeepney = async(req,res)=>{

  try{


    const jeepney =
      await Jeepney.findByIdAndDelete(
        req.params.id
      );



    if(!jeepney){

      return res.status(404).json({

        success:false,

        message:
          "Jeepney not found"

      });

    }



    await ActivityLog.create({

      user:req.user?._id,

      action:
        "Delete Jeepney",

      details:
        `Deleted jeepney ${jeepney.plateNumber}`,


    });



    // Changes totalJeepneys on the central admin dashboard.
    notifyAdmin();



    res.status(200).json({

      success:true,

      message:
        "Jeepney deleted successfully"

    });



  }catch(error){


    console.error(
      "DELETE JEEPNEY ERROR:",
      error
    );


    res.status(500).json({

      success:false,

      message:error.message

    });

  }

};