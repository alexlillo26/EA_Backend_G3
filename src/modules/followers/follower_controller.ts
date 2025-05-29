import { Request, Response } from "express";
import Follower from "./follower_model.js";

/**
 * followUser: el usuario autenticado (req.user.id) sigue a req.params.userId
 */
export const followUser = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const followerId = req.user.id;
    const followingId = req.params.userId;

    // 1) Si ya existe un “follow” de followerId → followingId, devolvemos 409
    const exists = await Follower.findOne({ follower: followerId, following: followingId });
    if (exists) {
      return res.status(409).json({ message: "Ya sigues a este usuario" });
    }

    // 2) Crear el nuevo “follow”
    const newFollow = await Follower.create({ follower: followerId, following: followingId });
    return res.status(201).json(newFollow);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * getFollowers: devuelve la lista de seguidores de la ruta /:userId
 *  → Busca Follower.find({ following: userId })
 */
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const followers = await Follower.find({ following: userId }).select("follower");
    return res.status(200).json({ success: true, followers });
  } catch (err) {
    return res.status(500).json({ message: "Error interno" });
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
