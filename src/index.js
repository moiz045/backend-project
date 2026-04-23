import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "./config/db.config.js";
import router from "./routes/user.routes.js";

dotenv.config({
  path: "./.env",
});
const app = express();
const PORT = process.env.PORT || 5000;
connectDB();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());

app.use("/api/v1/users", router);
app.get("/", (req, res) => {
  res.send("HELLO FROM EXPRESS 🚀");
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
