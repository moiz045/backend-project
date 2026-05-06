import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  getAccessAndRefreshToken,
  changePassword,
  updateUserProfile,
  getUserProfile,
  changeAvatar,
  changeCoverImage,
  getUserChannelProfile,
  getWatchHistory,
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
router.route("/change-password").post(authenticateUser, changePassword);
router.route("/update-profile").patch(authenticateUser, updateUserProfile);
router.route("/user-profile").get(authenticateUser, getUserProfile);
router
  .route("/avatar")
  .patch(authenticateUser, upload.single("avatar"), changeAvatar);

router
  .route("/cover-image")
  .patch(authenticateUser, upload.single("coverImage"), changeCoverImage);

router.route("/channel/:username").get(authenticateUser, getUserChannelProfile);
router.route("/watch-history").get(authenticateUser, getWatchHistory);

export default router;
