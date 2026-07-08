import Jeepney from '../models/Jeepney.js';
import ActivityLog from '../models/ActivityLog.js';


// Create Jeepney
export const createJeepney = async (req, res) => {

  try {

    const jeepney =
      await Jeepney.create(req.body);

    await ActivityLog.create({

      user: req.user?._id,

      action: 'Create Jeepney',

      details:
        `Created jeepney ${jeepney.plateNumber}`,

      ipAddress: req.ip

    });

    res.status(201).json({

      success: true,

      message: 'Jeepney created successfully',

      data: jeepney

    });

  }

  catch (error) {

    if (error.code === 11000) {

      return res.status(400).json({

        success: false,

        message:
          'Plate number must be unique.'

      });

    }

    res.status(400).json({

      success: false,

      message: error.message

    });

  }

};




// Get Jeepneys
export const getJeepneys = async (req, res) => {

  try {

    const {

      search,

      status,

      type

    } = req.query;


    const query = {};


    if (status) {

      query.status = status;

    }


    if (type) {

      query.type = type;

    }


    let jeepneys =
      await Jeepney.find(query)

      .sort({

        createdAt: -1

      });


    if (search) {

      const regex =
        new RegExp(search, 'i');


      jeepneys =
        jeepneys.filter(j =>

          regex.test(

            j.plateNumber || ''

          ) ||

          regex.test(

            j.jeepneyNumber || ''

          ) ||

          regex.test(

            j.type || ''

          )

        );

    }


    res.status(200).json({

      success: true,

      count: jeepneys.length,

      data: jeepneys

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};




// Get Jeepney By Id
export const getJeepneyById = async (req, res) => {

  try {

    const jeepney =
      await Jeepney.findById(

        req.params.id

      );


    if (!jeepney) {

      return res.status(404).json({

        success: false,

        message:
          'Jeepney not found'

      });

    }


    res.status(200).json({

      success: true,

      data: jeepney

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};




// Update Jeepney
export const updateJeepney = async (req, res) => {

  try {

    const jeepney =
      await Jeepney.findByIdAndUpdate(

        req.params.id,

        req.body,

        {

          new: true,

          runValidators: true

        }

      );


    if (!jeepney) {

      return res.status(404).json({

        success: false,

        message:
          'Jeepney not found'

      });

    }


    await ActivityLog.create({

      user: req.user?._id,

      action: 'Update Jeepney',

      details:
        `Updated jeepney ${jeepney.plateNumber}`,

      ipAddress: req.ip

    });


    res.status(200).json({

      success: true,

      message:
        'Jeepney updated successfully',

      data: jeepney

    });

  }

  catch (error) {

    if (error.code === 11000) {

      return res.status(400).json({

        success: false,

        message:
          'Plate number must be unique.'

      });

    }


    res.status(400).json({

      success: false,

      message: error.message

    });

  }

};




// Delete Jeepney
export const deleteJeepney = async (req, res) => {

  try {

    const jeepney =
      await Jeepney.findByIdAndDelete(

        req.params.id

      );


    if (!jeepney) {

      return res.status(404).json({

        success: false,

        message:
          'Jeepney not found'

      });

    }


    await ActivityLog.create({

      user: req.user?._id,

      action: 'Delete Jeepney',

      details:
        `Deleted jeepney ${jeepney.plateNumber}`,

      ipAddress: req.ip

    });


    res.status(200).json({

      success: true,

      message:
        'Jeepney deleted successfully'

    });

  }

  catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};