import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  getVideoLikes,
  toggleTweetLike,
  toggleCommentLike,
  toggleVideoLike,
} from "../controllers/like.controllers.js";

const router = Router();
router.use(authenticateUser);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getVideoLikes);

export default router;
