import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { connectDB } from "./config/db.js";


import authRoutes from "./routes/authRoutes.js";
import jeepneyRoutes from "./routes/jeepneyRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import passengerRoutes from "./routes/passengerRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";
import externalRoutes from "./routes/externalRoutes.js";
import { seedInitialData } from "./utils/seeder.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import userRoutes from './routes/userRoutes.js';


dotenv.config();


const app = express();

const PORT = process.env.PORT || 5000;


// ===========================
// MIDDLEWARE
// ===========================

const allowedOrigins = [
  "http://localhost:5173"
];


if(process.env.FRONTEND_URL){
  allowedOrigins.push(
    process.env.FRONTEND_URL
  );
}


app.use(
  cors({
    origin: allowedOrigins,
    credentials:true
  })
);


app.use(express.json());


app.use(
  express.urlencoded({
    extended:true
  })
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/activity-logs",
  activityLogRoutes
);

app.use('/api/users', userRoutes);



// ===========================
// ROOT TEST ROUTE
// ===========================

app.get("/", (req,res)=>{

  res.json({
    message:
      "🚀 Jeepney Route Management API is running"
  });

});



// ===========================
// DATABASE
// ===========================

connectDB()
.then(async()=>{


  console.log(
    "✅ MongoDB connected"
  );


  await seedInitialData();


})
.catch((error)=>{

  console.error(
    "❌ Database connection failed:",
    error.message
  );

});



// ===========================
// API ROUTES
// ===========================

app.use(
  "/api/auth",
  authRoutes
);


app.use(
  "/api/jeepneys",
  jeepneyRoutes
);


app.use(
  "/api/routes",
  routeRoutes
);


app.use(
  "/api/schedules",
  scheduleRoutes
);


app.use(
  "/api/trips",
  tripRoutes
);


app.use(
  "/api/passenger-statistics",
  passengerRoutes
);


app.use(
  "/api/reports",
  reportRoutes
);


app.use(
  "/api/synchronization",
  syncRoutes
);


app.use(
  "/api/external",
  externalRoutes
);



// ===========================
// HEALTH CHECK
// ===========================

app.get(
  "/api/health",
  (req,res)=>{

    res.status(200).json({

      status:"OK",

      server:
        "Express",

      database:
        "MongoDB",

      time:
        new Date()

    });

  }
);



// ===========================
// ERROR HANDLER
// ===========================

app.use(
  (err,req,res,next)=>{

    console.error(
      err.stack
    );


    res.status(
      err.status || 500
    )
    .json({

      success:false,

      message:
        err.message ||
        "Server Error"

    });

  }
);



// ===========================
// START SERVER
// ===========================

app.listen(
  PORT,
  ()=>{

    console.log(
      `🚀 Server running at http://localhost:${PORT}`
    );

  }
);