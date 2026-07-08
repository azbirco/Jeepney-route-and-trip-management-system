import User from "../models/User.js";
import Jeepney from "../models/Jeepney.js";
import Route from "../models/Route.js";
import Schedule from "../models/Schedule.js";
import ActivityLog from "../models/ActivityLog.js";


export const seedInitialData = async () => {

  try {

    console.log("🌱 Starting database seeding...");


    // Prevent duplicate seed
    const existingUser = await User.findOne({
      username: "admin"
    });


    if (existingUser) {

      console.log(
        "⚠️ Seed data already exists. Skipping..."
      );

      return;

    }



    // =========================
    // USERS
    // =========================

    const admin = await User.create({

      username: "admin",

      email: "admin@routeops.nv",

      password: "password123",

      role: "Admin",

      fullName: "System Administrator"

    });



    const terminalPersonnel = await User.create({

      username: "terminalpersonnel1",

      email: "terminalpersonnel1@routeops.nv",

      password: "password123",

      role: "Terminal Personnel",

      fullName: "Terminal Personnel"

    });



    console.log("👤 Users created");




    // =========================
    // ROUTES
    // =========================

    const route1 = await Route.create({

      origin: "Solano",

      destination: "Bayombong",

      estimatedTravelTime: 30,

      estimatedFare: 25

    });



    const route2 = await Route.create({

      origin: "Bagabag",

      destination: "Solano",

      estimatedTravelTime: 45,

      estimatedFare: 35

    });



    const route3 = await Route.create({

      origin: "Bambang",

      destination: "Bayombong",

      estimatedTravelTime: 40,

      estimatedFare: 30

    });



    console.log("🗺️ Routes created");




    // =========================
    // JEEPNEYS
    // =========================

    await Jeepney.create({

      plateNumber: "NGR-3829",

      type: "E-Jeep",

      capacity: 22,

      status: "Available"

    });



    await Jeepney.create({

      plateNumber: "PQR-1049",

      type: "Traditional Jeepney",

      capacity: 18,

      status: "Available"

    });



    await Jeepney.create({

      plateNumber: "EJP-9921",

      type: "E-Jeep",

      capacity: 25,

      status: "Inactive"

    });



    console.log("🚐 Jeepneys created");




    // =========================
    // SCHEDULES
    // =========================


    await Schedule.create({

      route: route1._id,

      departureTime: "08:00",

      status: "Active"

    });



    await Schedule.create({

      route: route1._id,

      departureTime: "13:00",

      status: "Active"

    });



    await Schedule.create({

      route: route2._id,

      departureTime: "09:30",

      status: "Active"

    });



    console.log("⏰ Schedules created");




    // =========================
    // ACTIVITY LOG
    // =========================


    await ActivityLog.create({

      user: admin._id,

      action: "Database Seeded",

      details:
        "Initial RouteOps database data created successfully.",

      ipAddress: "127.0.0.1"

    });



    console.log(
      "✅ Database seeding completed"
    );


  } catch(error) {


    console.error(
      "❌ Seeder error:",
      error.message
    );


  }

};