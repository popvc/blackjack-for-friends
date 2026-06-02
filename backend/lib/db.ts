import { SQL } from "bun";

import { ENV } from "../config/env";

const pg = new SQL({
  url: ENV.POSTGRESQL_URI,
  //this does weird stuff and I don't know why
  /*
  onconnect: (client) => {
    console.log("PostgreSQL DB connected!", client);
  },
  */
  onclose: (client) => {
    console.log("PostgreSQL DB connection closed!", client);
  },
});

//
export const connectDB = async () => {
  try {
    const conn = await pg.connect();
    console.log("PostgreSQL connecting to: ", conn.options.hostname);
  } catch (error) {
    console.error("Failed to connect to DB: error: ", error);
    process.exit(1);
  }
};
