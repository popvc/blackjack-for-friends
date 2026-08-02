import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

export const connectDevDB = async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  if (!mongod) {
    console.error("failed to start test DB");
    process.exit(1);
  }

  try {
    const pool = await mongoose.connect(uri);
    console.log(
      `In-memory MongoDB connected to '${pool.connection.name}' at '${pool.connection.host}'`,
    );
  } catch (e) {
    console.error("Failed to connect to DB: error:\n", e);
    process.exit(1);
  }

  process.on("exit", () => {
    mongod.stop();
  });
};
