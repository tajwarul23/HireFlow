import mongoose from "mongoose";


const inviteSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    email: { type: String, lowercase: true, trim: true, default: null }, // only for email invites
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);


inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const InviteModel = mongoose.model("Invite", inviteSchema);
