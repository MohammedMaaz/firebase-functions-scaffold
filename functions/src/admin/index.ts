//@ts-nocheck
import { withCallable, callable_error } from "../utils/cf";
import { auth, serverTimestamp } from "../utils/firebase_config";
import { createAdmin } from "./userManagement";

const get_new_doc = ({ email, displayName }) => {
  return {
    email,
    displayName,
    userType: "admin",
    createdAt: serverTimestamp(),
  };
};

const is_admin_email = withCallable(async (config, { email }, context) => {
  try {
    const user = await auth().getUserByEmail(email);
    return (
      user.customClaims?.admin === true ||
      user.customClaims?.superAdmin === true
    );
  } catch (error) {
    if (error.code === "auth/user-not-found")
      throw callable_error(
        "not-found",
        "This email does not correspond to any user!"
      );
    throw error;
  }
}, true);

const Admin = {
  get_new_doc,
  create_admin: createAdmin,
  is_admin_email,
};

export default Admin;
