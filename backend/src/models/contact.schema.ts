import mongoose from "mongoose";

//compound id to run unique on, prevents race conditions, theoretically

//compound id{high, low}, sender

// Its existance is proof there's currently a request, deleted on accept or reject
/*
const contactRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
      required: true,
    },
    recipientId: {
      type: String,
      required: true,
    },
    compoundId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);
*/
const contactRequestSchema = new mongoose.Schema(
  {
    lowId: {
      type: String,
      required: true,
    },
    highId: {
      type: String,
      required: true,
    },
    compoundId: {
      type: String,
      unique: true,
    },
  },
  { timestamps: true },
);

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);

export default ContactRequest;
