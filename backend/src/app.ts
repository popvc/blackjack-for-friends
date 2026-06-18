import type { Request, Response } from "express";
// src/index.ts
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import router from "./routes/auth.route";
import { ENV } from "./config/env";
import { CORS } from "./config/cors";
import { connectDB } from "./config/db";
import helmet from "helmet";

const { PORT, NODE_ENV } = ENV;

const app = express();

//look into eslint

//todo: asyncHandler()

//need to define additional default headers

app.use(express.json({ limit: "10kb" })); //should have custom sizes set for specific routes
app.use(helmet());
//app.use(express.json()); // json destructuring allows req.body
app.use(cors(CORS));
app.use(cookieParser());

app.use("/api/auth", router);

//need auto fail on failed db connect

//need log about closed connections to db or other services

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment: " + NODE_ENV);

  connectDB();
});
