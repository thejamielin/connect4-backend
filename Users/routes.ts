let currentUser = null;
export default function UserRoutes(app: any) {
  const createUser = async (req: any, res: any) => {};
  const deleteUser = async (req: any, res: any) => {};
  const findAllUsers = async (req: any, res: any) => {};
  const findUserByUsername = async (req: any, res: any) => {};
  const updateUser = async (req: any, res: any) => {};
  const register = async (req: any, res: any) => {};
  const profile = async (req: any, res: any) => {};
  app.post("/user/:username", findUserByUsername);
  app.put("/user/:username", updateUser);
  app.post("/account/register", register);
}
