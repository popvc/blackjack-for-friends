import mongoose, { Document, type HydratedDocument } from "mongoose";


// ObjectId (_id) contains information about when it was created
// If I decide this is an issue then it would be prudent to have a separate public facing profile id
// NanoID
const profileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
