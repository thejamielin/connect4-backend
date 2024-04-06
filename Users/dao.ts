import { userModel } from "./model";
export const createUser = (user: any) => userModel.create(user);
export const findAllUsers = () => userModel.find();
export const findUserById = (userId: string) => userModel.findById(userId);
export const findUserByUsername = (username: string) =>
  userModel.findOne({ username: username });
export const findUserByCredentials = (username: string, password: string) =>
  userModel.findOne({ username, password });
export const updateUser = (userId: string, user: any) =>
  userModel.updateOne({ _id: userId }, { $set: user });
export const deleteUser = (userId: string) =>
  userModel.deleteOne({ _id: userId });
