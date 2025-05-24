import { model, Schema } from "mongoose";
const combatSchema = new Schema({
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
