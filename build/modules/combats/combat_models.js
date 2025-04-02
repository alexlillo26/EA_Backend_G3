import { model, Schema } from "mongoose";
const combatSchema = new Schema({
    date: {
        type: Date,
        required: true
    },
    gym: {
        type: Schema.Types.ObjectId,
        ref: "Gym",
        required: true
    },
    boxers: [{
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }],
    isHidden: {
        type: Boolean,
        default: false
    }
});
const Combat = model('Combat', combatSchema);
export default Combat;
