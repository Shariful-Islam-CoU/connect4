import mongoose from "./userDatabase";
import userDataSchema from "./userSchema";

const UserDataModel = mongoose.model("UserData", userDataSchema);

export default UserDataModel;
