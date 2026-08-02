import { createApp } from "./server";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";

const { PORT, NODE_ENV } = ENV;

const app = createApp();

//need auto fail on failed db connect

//need log about closed connections to db or other services

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment: " + NODE_ENV);

  connectDB();
});
