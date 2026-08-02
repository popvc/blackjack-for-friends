import bcrypt from "bcryptjs";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import Profile from "../models/profile.schema";

//for testing purposes only

//seeded emails:
//testuser1@example.com
//testuser2@example.com
//testuser3@example.com
//testuser4@example.com
//testuser5@example.com

//seeded password:
//1234567890123456

let _n = 0;

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
}

async function createTestProfile() {
  const n = ++_n;

  const newProfile = new Profile({
    userId: `1234567890123456789${n}`,
    username: `testuser${n}`,
    email: `testuser${n}@example.com`,
    password: await hashPassword("1234567890123456"),
  });

  await newProfile.save();
}

export const connectDevDB = async () => {
  process.on("exit", () => {
    mongod.stop();
  });

  // A standalone MongoMemoryServer has no oplog and can't run sessions/transactions
  // (acceptContactRequest/removeContact use mongoose.connection.transaction), so a
  // single-node replica set is required here instead.
  const mongod = await MongoMemoryReplSet.create({ replSet: { count: 1 } });

  const uri = mongod.getUri();
  console.log("mongoduri", uri);

  if (!mongod) {
    console.error("failed to start test DB");
    process.exit(1);
  }

  try {
    const pool = await mongoose.connect(uri);

    for (let i = 0; i < 5; i++) {
      await createTestProfile();
    }

    console.log(
      `In-memory MongoDB connected to '${pool.connection.name}' at '${pool.connection.host}'`,
    );
  } catch (e) {
    console.error("Failed to connect to DB: error:\n", e);
    process.exit(1);
  }
};
