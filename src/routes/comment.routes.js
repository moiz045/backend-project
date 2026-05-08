import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controllers.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/:videoId").get(getVideoComments);

router.use(authenticateUser);

router.route("/:videoId").post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
