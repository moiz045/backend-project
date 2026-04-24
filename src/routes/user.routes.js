import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  getAccessAndRefreshToken,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(authenticateUser, logoutUser);
router.route("/refreshtoken").post(getAccessAndRefreshToken);

export default router;
