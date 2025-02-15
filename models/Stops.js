import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  stopName: { type: String, required: true, unique: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
});

const Stop = mongoose.model("Stop", stopSchema);

export default Stop;
