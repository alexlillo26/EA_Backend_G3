import { User } from '../models/userModel';

const users: User[] = [];

export const createUser = (user: User): User => {
    users.push(user);
    return user;
};

export const getUser = (id: number): User | undefined => {
    return users.find(user => user.id === id);
};

export const updateUser = (id: number, updatedUser: Partial<User>): User | undefined => {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        return users[userIndex];
    }
    return undefined;
};

export const deleteUser = (id: number): boolean => {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex !== -1) {
        users.splice(userIndex, 1);
        return true;
    }
    return false;
};