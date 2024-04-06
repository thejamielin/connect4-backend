import model from "./model";
export const createUser = (user: any) => model.create(user);
export const findAllUsers = () => model.find();
export const findUserById = (userId: string) => model.findById(userId);
export const findUserByUsername = (username: string) =>
  model.findOne({ username: username });
export const findUserByCredentials = (username: string, password: string) =>
  model.findOne({ username, password });
export const updateUser = (userId: string, user: any) =>
  model.updateOne({ _id: userId }, { $set: user });
export const deleteUser = (userId: string) => model.deleteOne({ _id: userId });
