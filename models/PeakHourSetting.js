import mongoose from "mongoose";

const PeakHourSettingSchema = new mongoose.Schema({
  isPeak: { type: Boolean, required: true },
  manualOverride: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("PeakHourSetting", PeakHourSettingSchema);
