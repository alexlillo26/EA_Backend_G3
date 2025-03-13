import mongoose, { Types, model, ObjectId, Schema } from "mongoose";

export interface ICombat{
    date : Date;
    gym : Types.ObjectId;
    boxers : Types.ObjectId[];

}

const combatSchema = new Schema<ICombat>({
    date :{
        type: Date,
        required : true
    },
    gym: {
        type: Schema.Types.ObjectId,
        ref: "Gym",
        required : true
    },
    boxers: [{
        type : Schema.Types.ObjectId,  
        ref: "User",
        required : true
    }]
});

const Combat = model('Combat', combatSchema);
export default Combat;
