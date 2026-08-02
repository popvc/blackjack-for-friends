import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.ts";
import contactRoutes from "./routes/contact.route.ts";
import { ENV } from "./config/env";
import helmet from "helmet";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { CORS_POLICY } from "./config/cors.ts";

export function createApp() {
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

  //I think above???
  app.use(errorHandler);

  app.use("/api/auth", authRoutes);
  app.use("/api/contact", contactRoutes);

  return app;
}
