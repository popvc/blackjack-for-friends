import mongoose from "mongoose";

//Need to read more about dtos and mongoose, feels like there could be a better way of doing this

//unique: true handles race conditions, if I really wanted efficiency I'd handle this as part of my signin controller step, but this works fine for now

// ObjectId (_id) contains information about when it was created
// 20 character numeric id is more user friendly and doesn't provide this information, using userId now
export interface IProfile {
  userId: string;
  email: string;
  username: string;
  password: string;
  contactsId: string[];
  createdAt: Date;
  updatedAt: Date;
}

const profileSchema = new mongoose.Schema<IProfile>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    contactsId: [{ type: String }],
  },
  { timestamps: true },
);

const Profile = mongoose.model<IProfile>("Profile", profileSchema);

export type ProfileDocument = mongoose.HydratedDocument<IProfile>;
export default Profile;
