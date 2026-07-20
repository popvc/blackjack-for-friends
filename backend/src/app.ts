import type { Request, Response } from "express";
// src/index.ts
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.route.ts";
import contactRoutes from "./routes/contact.route.ts";
import { ENV } from "./config/env";
import { CORS } from "./config/cors";
import { connectDB } from "./config/db";
import helmet from "helmet";

const { PORT, NODE_ENV } = ENV;

const app = express();

//TODO: I'd like to simulate failures in DB mid-transaction to see if I'm missing anything

//Going to need rate limiter rules to account for the number of DB pings an endpoint CAN ping

//look into eslint

//todo: functions to create response objects, currently takes up too much screen real estate
//todo: asyncHandler()

//need to define additional default headers

app.use(express.json({ limit: "10kb" })); //should have custom sizes set for specific routes
app.use(helmet());
//app.use(express.json()); // json destructuring allows req.body
app.use(cors(CORS));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);

//need auto fail on failed db connect

//need log about closed connections to db or other services

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment: " + NODE_ENV);

  connectDB();
});
