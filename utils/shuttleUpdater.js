import Shuttle from "../models/Shuttle.js";
import { isPeakHour } from "./timeUtils.js";

export const updateShuttlesForPeakHours = async () => {
  try {
    const peakHour = isPeakHour();
    console.log(`Updating shuttles for peak hours: ${peakHour ? "ON" : "OFF"}`);

    await Shuttle.updateMany({}, { peakHours: peakHour });

    const shuttles = await Shuttle.find().populate("route");
    for (let shuttle of shuttles) {
      let updatedStops = [...shuttle.route.stops];

      if (peakHour && shuttle.route.peakHourStops.length > 0) {
        updatedStops.push(...shuttle.route.peakHourStops);
      }

      shuttle.route.stops = updatedStops;
      await shuttle.route.save();
    }

    console.log("Shuttles updated successfully.");
  } catch (error) {
    console.error("Error updating shuttles for peak hours:", error);
  }
};

setInterval(updateShuttlesForPeakHours, 10 * 60 * 1000);
