// src/services/user_service.ts
import User, { IUser } from '../users/user_models.js';

export const saveMethod = () => {
    return 'Hola';
};
export const createUser = async (userData: IUser) => {
    const user = new User(userData);
    return await user.save();
};

export const getAllUsers = async (page: number = 1, pageSize: number = 10) => {
    const skip = (page - 1) * pageSize;
    const users = await User.find().skip(skip).limit(pageSize);
    return users.map(user => ({...user.toObject(), age: calculateAge(user.birthDate)}));
};

export const getUserById = async (id: string) => {
    const user = await User.findById(id);
    if (user) {
        return {...user.toObject(), age: calculateAge(user.birthDate)};
    }
    return null;
};

export const updateUser = async (id: string, updateData: Partial<IUser>) => {
    return await User.updateOne({ _id: id }, { $set: updateData });
};

export const deleteUser = async (id: string) => {
    return await User.deleteOne({ _id: id });
};

export const hideUser = async (id: string, isHidden: boolean) => {
    return await User.updateOne({ _id: id }, { $set: { isHidden } });
}

export const loginUser = async (email: string, password: string) => {
    return await User.findOne({ email, password });
};

const calculateAge = (birthDate: Date) => {
    if (!birthDate) {
        return null;
    }
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};