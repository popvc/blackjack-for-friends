import mongoose from "mongoose";

//lowId, highId and senderId could be fk references instead

export interface IContactRequest {
  lowId: string;
  highId: string;
  senderId: string;
  senderName: string;
  createdAt: Date;
  updatedAt: Date;
}

//might be better to include the recipient id too, that way we don't have to compute it on every single retrieval
const contactRequestSchema = new mongoose.Schema<IContactRequest>(
  {
    lowId: {
      type: String,
      required: true,
    },
    highId: {
      type: String,
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      require: true,
    },
  },
  { timestamps: true },
);

//lowId/highId are fixed-length (20 char) numeric strings, so lexicographic comparison
//matches numeric order without the precision loss of converting through Number
contactRequestSchema.pre(["validate"], function () {
  if (this.lowId > this.highId) {
    [this.lowId, this.highId] = [this.highId, this.lowId];
  }
});

contactRequestSchema.index({ lowId: 1, highId: 1 }, { unique: true });

const ContactRequest = mongoose.model<IContactRequest>("ContactRequest", contactRequestSchema);

export type ContactRequestDocument = mongoose.HydratedDocument<IContactRequest>;
export default ContactRequest;
