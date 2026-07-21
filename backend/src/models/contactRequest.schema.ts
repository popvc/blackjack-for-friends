import mongoose from "mongoose";

//lowId, highId and senderId could be fk references instead

export interface IContactRequest {
  lowId: string;
  highId: string;
  senderId: string;
  createdAt: Date;
  updatedAt: Date;
}

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
