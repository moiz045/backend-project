import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRouter from "./routes/user.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "YTClone API is running",
  });
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/videos", videoRouter);

app.use((err, _req, res, _next) => {
  const statusCode = err?.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err?.message || "Internal server error",
    errors: err?.errors || [],
  });
});

export default app;
