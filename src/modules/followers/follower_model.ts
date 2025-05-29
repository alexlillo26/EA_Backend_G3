import mongoose, { Schema, Document } from "mongoose";

interface IFollower extends Document {
  follower: mongoose.Types.ObjectId;       // Quien sigue
  following: mongoose.Types.ObjectId;      // A quién sigue
  pushSubscription?: any;                  // Push subscription (opcional)
}

const FollowerSchema = new Schema<IFollower>(
  {
    follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
    following: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pushSubscription: { type: Object }, // Guardamos el JSON de PushSubscription
  },
  { timestamps: true }
);

export default mongoose.model<IFollower>("Follower", FollowerSchema);
