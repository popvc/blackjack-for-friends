import mongoose from "mongoose";

//ids refer to user facing user ids not internal MongoDB document ids

//needs better senderId, recipientId

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    recipientId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true },
);
