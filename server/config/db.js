import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    isConnected = true;

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );

    return true;

  } catch (error) {

    isConnected = false;

    console.error(
      `❌ Database Error: ${error.message}`
    );

    return false;
  }
};


export const getIsConnected = () => {
  return isConnected;
};


export default connectDB;