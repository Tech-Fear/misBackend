import mongoose from "mongoose";

const StopSchema = new mongoose.Schema({
  stopName: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
});

const RouteSchema = new mongoose.Schema({
  routeName: { type: String, required: true, unique: true },
  stops: [StopSchema],
  peakHourStops: [StopSchema],
  travelTimes: [
    {
      from: { type: String, required: true },
      to: { type: String, required: true },
      duration: { type: Number, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Route", RouteSchema);
