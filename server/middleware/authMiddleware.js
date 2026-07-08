import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET =
  process.env.JWT_SECRET || 'routeops-secret-key-nv';


// =====================================
// Protect routes using JWT
// =====================================
export const protect = async (req, res, next) => {

  console.log("Authorization Header:");
  console.log(req.headers.authorization);

  let token;

  try {

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {

      token =
        req.headers.authorization.split(' ')[1];

    }


    if (!token) {

      return res.status(401).json({

        success: false,

        message: 'Not authorized',

        error: 'Bearer token is required.'

      });

    }


    const decoded = jwt.verify(
      token,
      JWT_SECRET
    );


    const user = await User.findById(
      decoded.id
    ).select('-password');


    if (!user) {

      return res.status(401).json({

        success: false,

        message: 'Not authorized',

        error: 'Invalid token'

      });

    }


    if (!user.isActive) {

      return res.status(403).json({

        success: false,

        message: 'Account deactivated',

        error: 'Your account has been deactivated.'

      });

    }


    req.user = user;

    next();

  }

  catch (error) {

    console.error(
      'Authentication error:',
      error.message
    );


    return res.status(401).json({

      success: false,

      message: 'Not authorized',

      error: 'Invalid or expired token.'

    });

  }

};



// =====================================
// Protect external APIs using API KEY
// =====================================
export const verifyApiKey = (req, res, next) => {


  const apiKey = req.headers['x-api-key'];



  if (
    !apiKey ||
    apiKey !== process.env.INTERNAL_API_KEY
  ) {

    return res.status(401).json({

      success: false,

      message: 'Unauthorized'

    });

  }



  next();

};



export default protect;