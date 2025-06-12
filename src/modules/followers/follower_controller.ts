import { Request, Response } from "express";
import Follower from "./follower_model.js";
import User from "../users/user_models.js"; // Importa el modelo User

/**
 * followUser: el usuario autenticado (req.user.id) sigue a req.params.userId
 * Ahora es idempotente: nunca devuelve 409, siempre 200.
 */
export const followUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const targetId = req.params.userId;
    // Upsert: si ya existe, no hace nada; si no, crea
    await Follower.findOneAndUpdate(
      { follower: userId, following: targetId },
      { follower: userId, following: targetId },
      { upsert: true }
    );
    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

/**
 * getFollowers: devuelve la lista de seguidores de la ruta /:userId
 *  → Busca Follower.find({ following: userId }) y pobla el campo follower
 */
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    // Pobla el campo follower con name y username
    const followers = await Follower
      .find({ following: userId })
      .populate<{ follower: { _id: string; name: string; username: string } }>(
        "follower",
        "name username"
      );
    return res.status(200).json({ success: true, followers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al obtener seguidores" });
  }
};

/**
 * savePushSubscription: guarda la suscripción push en todos los documentos
 *   donde follower = usuario autenticado (req.user.id)
 */
export const savePushSubscription = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ message: "Falta la suscripción" });

    // Actualiza la subscripción en todos los registros donde follower = userId
    await Follower.updateMany(
      { follower: userId },
      { $set: { pushSubscription: subscription } }
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Error guardando la suscripción push" });
  }
};

/**
 * removePushSubscription: elimina la suscripción push del usuario autenticado
 */
export const removePushSubscription = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    await Follower.updateMany({ follower: userId }, { $unset: { pushSubscription: "" } });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: "Error eliminando la suscripción push" });
  }
};

/**
 * unfollowUser: el usuario autenticado (req.user.id) deja de seguir a req.params.userId
 */
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const followerId = req.user.id;
    const followingId = req.params.userId;
    await Follower.findOneAndDelete({ follower: followerId, following: followingId });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/** getFollowing: lista de usuarios que sigue el userId, poblado */
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const following = await Follower
      .find({ follower: userId })
      .populate<{ following: { _id: string; name: string; username: string } }>(
        "following",
        "name username"
      );
    return res.status(200).json({ success: true, following });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error al obtener following" });
  }
};

/** removeFollower: elimina a “followerId” de la lista de seguidores de req.user.id */
export const removeFollower = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.id;            // yo
    const followerId = req.params.followerId;  // el que quiero eliminar
    await Follower.findOneAndDelete({ follower: followerId, following: userId });
    return res.status(200).json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
