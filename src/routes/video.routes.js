import { authenticateUser } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import { publishAVideo } from "../controllers/video.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(authenticateUser);

router.route("/publish").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

export default router;
