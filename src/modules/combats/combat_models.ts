import mongoose, { Types, model, Schema } from "mongoose";

export interface ICombat {
    creator: Types.ObjectId;
    opponent: Types.ObjectId;
    date: Date;
    time: string;
    level: string;
    gym: Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt?: Date;
    updatedAt?: Date;
}

const combatSchema = new Schema<ICombat>({
    creator: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    opponent: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    level: {
        type: String,
        required: true
    },
    gym: {
        type: Schema.Types.ObjectId,
        ref: "Gym",
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

const Combat = model('Combat', combatSchema);
export default Combat;
