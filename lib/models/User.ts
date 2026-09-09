import mongoose, { type Model, Schema } from "mongoose";
import type { IUser } from "../../types";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const UserModel =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);

export default UserModel;
