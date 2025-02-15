import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  universityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "University",
    required: true,
  },
  walletBalance: { type: Number, default: 500, min: 0 },
  transactions: [
    {
      amount: { type: Number, required: true },
      type: { type: String, enum: ["credit", "debit"], required: true },
      description: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  rideHistory: [
    {
      shuttleId: { type: mongoose.Schema.Types.ObjectId, ref: "Shuttle" },
      source: { type: String, required: true },
      destination: { type: String, required: true },
      cost: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", function (next) {
  if (this.walletBalance < 0) {
    return next(new Error("Wallet balance cannot be negative!"));
  }
  next();
});

export default mongoose.model("User", UserSchema);
