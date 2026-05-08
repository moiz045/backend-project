import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  getVideoLikes,
  getLikedVideos,
  toggleTweetLike,
  toggleCommentLike,
  toggleVideoLike,
} from "../controllers/like.controllers.js";

const router = Router();
router.use(authenticateUser);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);
router.route("/videos/:videoId").get(getVideoLikes);

export default router;
