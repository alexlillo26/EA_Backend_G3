import mongoose from "mongoose";

export interface IUser{
    name : string;
    age : number;
    email : string;
    isAdmin : boolean;
    isHidden : boolean;
}

const userSchema = new mongoose.Schema({
    name :{
        type: String,
        required : true
    },
    age: {
        type: Number,
        required : true
    },
    email: {
        type : String,
        required : true
    },
    isAdmin: {
        type : Boolean,
        default : false
    },
    isHidden: {
        type : Boolean,
        default : false
    }
});

const User = mongoose.model('User', userSchema);
export default User;
