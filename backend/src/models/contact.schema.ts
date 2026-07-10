import mongoose from "mongoose";

// Its existance is proof there's currently a request, deleted on accept or reject
const contactRequestSchema = new mongoose.Schema(
  {
    senderId: {
      type: String,
    },
    receipientId: {
      type: String,
    },
  },
  { timestamps: true },
);

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);

export default ContactRequest;