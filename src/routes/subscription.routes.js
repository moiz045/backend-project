import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
  checkSubscription,
} from "../controllers/subscription.controllers.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authenticateUser);

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);
router.route("/check/:channelId").get(checkSubscription);

export default router;
