// import mongoose from "mongoose";
// import PeakHourSetting from "../models/PeakHourSetting";

// export const isPeakHour = async () => {
//   try {
//     const PeakHourSetting = mongoose.model("PeakHourSetting");
//     const peakHourData = await PeakHourSetting.findOne();

//     if (peakHourData?.manualOverride) {
//       return peakHourData.isPeakHour;
//     }

//     const now = new Date();
//     const hours = now.getHours();

//     return (hours >= 7 && hours <= 10) || (hours >= 16 && hours <= 19);
//   } catch (error) {
//     console.error("Error checking peak hours:", error);
//     return false;
//   }
// };

// export const getPeakHourStatus = async () => {
//   try {
//     const isPeak = await isPeakHour();
//     return { isPeakHour: isPeak };
//   } catch (error) {
//     console.error("Error getting peak hour status:", error);
//     return { isPeakHour: false };
//   }
// };

// export const setPeakHourOverride = async (isPeakHour, manualOverride) => {
//   try {
//     const PeakHourSetting = mongoose.model("PeakHourSetting");

//     let peakHourData = await PeakHourSetting.findOne();
//     if (!peakHourData) {
//       peakHourData = new PeakHourSetting({});
//     }

//     peakHourData.isPeakHour = isPeakHour;
//     peakHourData.manualOverride = manualOverride;
//     await peakHourData.save();

//     console.log(
//       `Peak hour override set to: ${isPeakHour} (Manual: ${manualOverride})`
//     );
//     return { success: true, message: "Peak hour setting updated." };
//   } catch (error) {
//     console.error("Error setting peak hour override:", error);
//     return { success: false, message: "Error updating peak hour setting." };
//   }
// };

// export const getCurrentTime = () => {
//   return new Date().toLocaleTimeString("en-US", { hour12: false });
// };

import PeakHourSetting from "../models/PeakHourSetting.js";

export const isPeakHour = async () => {
  try {
    const peakHourData = await PeakHourSetting.findOne();

    if (peakHourData?.manualOverride) {
      return peakHourData.isPeakHour;
    }

    const now = new Date();
    const hours = now.getHours();

    return (hours >= 7 && hours <= 10) || (hours >= 16 && hours <= 19);
  } catch (error) {
    console.error("Error checking peak hours:", error);
    return false;
  }
};

export const getPeakHourStatus = async () => {
  try {
    const isPeak = await isPeakHour();
    return { isPeakHour: isPeak };
  } catch (error) {
    console.error("Error getting peak hour status:", error);
    return { isPeakHour: false };
  }
};

export const setPeakHourOverride = async (isPeakHour, manualOverride) => {
  try {
    let peakHourData = await PeakHourSetting.findOne();

    if (!peakHourData) {
      peakHourData = new PeakHourSetting({
        isPeakHour,
        manualOverride,
      });
    } else {
      peakHourData.isPeakHour = isPeakHour;
      peakHourData.manualOverride = manualOverride;
    }

    await peakHourData.save();

    console.log(
      `Peak hour override set: isPeakHour = ${isPeakHour}, manualOverride = ${manualOverride}`
    );
    return {
      success: true,
      message: "Peak hour setting updated successfully.",
    };
  } catch (error) {
    console.error("Error setting peak hour override:", error);
    return { success: false, message: "Failed to update peak hour setting." };
  }
};

export const getCurrentTime = () => {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
};
