import express from "express";
import { followUser, unfollowUser, getFollowers, savePushSubscription, removePushSubscription, getFollowing, removeFollower, checkFollow } from "./follower_controller.js";
import { checkJwt } from "../../middleware/session.js";
import Follower from "./follower_model.js"; // Importa el modelo para el endpoint de conteo

const router = express.Router();

// POST /api/followers/follow/:userId
router.post("/follow/:userId", checkJwt, followUser);
// DELETE /api/followers/unfollow/:userId
router.delete("/unfollow/:userId", checkJwt, unfollowUser);

// GET /api/followers/:userId
router.get("/:userId", checkJwt, getFollowers);

// POST /api/followers/push-subscription
router.post("/push-subscription", checkJwt, savePushSubscription);
// DELETE /api/followers/push-subscription
router.delete("/push-subscription", checkJwt, removePushSubscription);

// Guardar suscripción push (para notificaciones)
router.post("/save-subscription", checkJwt, savePushSubscription);

// GET /api/followers/count/:userId
router.get("/count/:userId", checkJwt, async (req, res) => {
  try {
    const userId = req.params.userId;
    const followersCount = await Follower.countDocuments({ following: userId });
    const followingCount = await Follower.countDocuments({ follower: userId });
    res.json({ followers: followersCount, following: followingCount });
  } catch (err) {
    res.status(500).json({ message: "Error al contar seguidores/seguidos" });
  }
});

// GET /api/followers/following/:userId
router.get("/following/:userId", checkJwt, getFollowing);

// DELETE /api/followers/remove/:followerId
router.delete("/remove/:followerId", checkJwt, removeFollower);

// GET /api/followers/check/:userId
router.get("/check/:userId", checkJwt, checkFollow);

export default router;
