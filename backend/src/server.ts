import type { Request, Response } from "express";
// src/index.ts
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import router from "./routes/auth.route";
import { ENV } from "../config/env";
import { CORS } from "../config/cors";
import { connectDB } from "../lib/db";

const app = express();
const PORT = ENV.PORT;

//app.use(express.json({limit:"5mb"})); , should have custom sizes set for specific routes
app.use(express.json()); // json destructuring allows req.body
app.use(cors(CORS));
app.use(cookieParser());

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
