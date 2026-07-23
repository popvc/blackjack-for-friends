import mongoose from "mongoose";
import { ENV } from "./env";

const { MONGODB_URI } = ENV;

export const connectDB = async () => {
  try {
    const pool = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB connected to '${pool.connection.name}' at '${pool.connection.host}'`);
  } catch (error) {
    console.error("Failed to connect to DB: error:\n", error);
    process.exit(1);
  }
};
