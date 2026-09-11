import mongoose from "mongoose";

//ids refer to user facing user ids not internal MongoDB document ids
//senderId/recipientId could be handled as reference instead

//needs better senderId, recipientId

export interface IMessage {
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new mongoose.Schema<IMessage>(
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
      required: true,
    },
  },
  { timestamps: true },
);
