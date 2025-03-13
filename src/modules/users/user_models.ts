import mongoose from "mongoose";

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
    }
});

export interface IUser{
    name : string;
    age : number;
    email : string;

}

const User = mongoose.model('User', userSchema);
export default User;
