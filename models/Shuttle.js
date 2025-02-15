import mongoose from "mongoose";

const ShuttleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
  capacity: { type: Number, required: true, min: 1 },
  availableSeats: { type: Number, required: true },
  peakHours: { type: Boolean, default: false },
  currentLocation: {
    lat: { type: Number, required: true, default: 0 },
    lng: { type: Number, required: true, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

ShuttleSchema.pre("save", function (next) {
  if (this.availableSeats > this.capacity) {
    this.availableSeats = this.capacity;
  }
  if (this.availableSeats < 0) {
    return next(new Error("Available seats cannot be negative!"));
  }
  next();
});

export default mongoose.model("Shuttle", ShuttleSchema);
