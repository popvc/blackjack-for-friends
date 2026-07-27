// src/index.ts
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.route.ts";
import contactRoutes from "./routes/contact.route.ts";
import { ENV } from "./config/env";
import { CORS_POLICY } from "./config/cors";
import { connectDB } from "./config/db";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.middleware";

const { PORT, NODE_ENV } = ENV;

const app = express();

//TODO: I'd like to simulate failures in DB mid-transaction to see if I'm missing anything

//Going to need rate limiter rules to account for the number of DB pings an endpoint CAN ping

//look into eslint

//need to define additional default headers

app.use(express.json({ limit: "10kb" })); //should have custom sizes set for specific routes
app.use(helmet());
//app.use(express.json()); // json destructuring allows req.body
app.use(cors(CORS_POLICY));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);

app.use(errorHandler);

//need auto fail on failed db connect

//need log about closed connections to db or other services

//Separate this file into app.ts and server.ts files for automated testing

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment: " + NODE_ENV);

  connectDB();
});
