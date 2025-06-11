import express from "express";
import { followUser, getFollowers, savePushSubscription, removePushSubscription } from "./follower_controller.js";
import { checkJwt } from "../../middleware/session.js";

const router = express.Router();

// POST /api/followers/follow/:userId
router.post("/follow/:userId", checkJwt, followUser);

// GET /api/followers/:userId
router.get("/:userId", checkJwt, getFollowers);

// POST /api/followers/push-subscription
router.post("/push-subscription", checkJwt, savePushSubscription);
router.delete("/push-subscription", checkJwt, removePushSubscription);

export default router;
