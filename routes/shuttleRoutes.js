// import express from "express";
// import { sendEmail } from "../config/emailConfig.js";
// import authMiddleware from "../middlewares/authMiddleware.js";
// import Route from "../models/Route.js";
// import Shuttle from "../models/Shuttle.js";
// import Stop from "../models/Stops.js";
// import User from "../models/User.js";
// import {
//   buildCapacitatedGraph,
//   findNearestStop,
//   minCostMaxFlow,
// } from "../utils/flowAlgorithms.js";
// import { isPeakHour } from "../utils/timeUtils.js";

// const router = express.Router();

// const calculateTravelTime = async (routeId, stops) => {
//   const route = await Route.findById(routeId);
//   if (!route) return 0;

//   let totalDuration = 0;
//   for (let i = 0; i < stops.length - 1; i++) {
//     const travelSegment = route.travelTimes.find(
//       (t) => t.from === stops[i] && t.to === stops[i + 1]
//     );
//     if (travelSegment) {
//       totalDuration += travelSegment.duration;
//     }
//   }

//   return totalDuration;
// };

// router.get("/stops", async (req, res) => {
//   try {
//     const stops = await Stop.find();
//     if (!stops.length) {
//       return res.status(404).json({ msg: "No stops found" });
//     }
//     res.json({ stops });
//   } catch (err) {
//     console.error("Error fetching stops:", err);
//     res.status(500).json({ msg: "Server Error" });
//   }
// });

// router.post("/best-route", async (req, res) => {
//   try {
//     let { source, destination, currentLat, currentLng } = req.body;
//     const isPeak = await isPeakHour();
//     const shuttles = await Shuttle.find().populate("route");
//     // Determine source
//     if (!source) {
//       if (!currentLat || !currentLng) {
//         return res
//           .status(400)
//           .json({ msg: "Either provide source or current location." });
//       }
//       source = findNearestStop(shuttles, currentLat, currentLng);
//       if (!source) {
//         return res.status(404).json({ msg: "No nearby bus stop found" });
//       }
//     }

//     const graph = buildCapacitatedGraph(shuttles, isPeak);
//     const sources = shuttles.map((shuttle) => `${shuttle.name}_${source}`);
//     const sinks = shuttles.map((shuttle) => `${shuttle.name}_${destination}`);
//     const { maxFlow, minCost, flowPath } = minCostMaxFlow(
//       graph,
//       sources,
//       sinks
//     );
//     if (maxFlow === 0) {
//       return res
//         .status(400)
//         .json({ msg: "No available seats for this route." });
//     }

//     const routes = flowPath.map((path) => ({
//       routeId: path.routeId,
//       stops: formatRouteWithTransfers(path.path),
//       estimatedTravelTime: calculateTravelTime(path.routeId, path.path),
//       cost: minCost,
//     }));
//     console.log(flowPath);
//     res.json({
//       msg: "Available routes found",
//       nearestStop: source, // If found via GPS, return nearest stop
//       routes,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server error", error: err.message });
//   }
// });

// router.post("/book", authMiddleware, async (req, res) => {
//   try {
//     const { routeId, stops } = req.body;
//     const userId = req.user.userId;

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ msg: "User not found" });

//     const isPeak = await isPeakHour();
//     const shuttles = await Shuttle.find({ "route._id": routeId }).populate(
//       "route"
//     );

//     const route = await Route.findById(routeId);
//     if (!route) return res.status(404).json({ msg: "Route not found" });

//     let estimatedDistance = 0;
//     for (let i = 0; i < stops.length - 1; i++) {
//       const segment = route.travelTimes.find(
//         (t) => t.from === stops[i] && t.to === stops[i + 1]
//       );
//       if (segment) estimatedDistance += segment.distance;
//     }

//     let selectedShuttle = shuttles.find(
//       (shuttle) => shuttle.availableSeats > 0
//     );
//     if (!selectedShuttle) {
//       return res.status(400).json({ msg: "No available seats on this route." });
//     }

//     const cost = Math.ceil(estimatedDistance / 100) * 2;
//     if (user.walletBalance < cost) {
//       return res.status(400).json({ msg: "Insufficient wallet balance" });
//     }

//     user.walletBalance -= cost;
//     selectedShuttle.availableSeats -= 1;

//     user.transactions.push({
//       amount: cost,
//       type: "debit",
//       description: `Ride from ${stops[0]} to ${stops[stops.length - 1]}`,
//     });

//     await user.save();
//     await selectedShuttle.save();

//     const emailSubject = "Shuttle Ride Confirmation";
//     const emailText = `Hello ${user.name},\n\nYour ride from ${stops[0]} to ${
//       stops[stops.length - 1]
//     } is confirmed.\n\nRoute: ${formatRouteWithTransfers(stops)}\nShuttle: ${
//       selectedShuttle.name
//     }\nCost: ${cost} points\nRemaining Balance: ${
//       user.walletBalance
//     } points\n\nSafe travels!\n\nThanks for using Shuttle Management System!`;

//     try {
//       await sendEmail(user.email, emailSubject, emailText);
//     } catch (emailError) {
//       console.error("Error sending email:", emailError);
//     }

//     res.json({
//       msg: "Ride booked successfully! Email sent.",
//       bestRoute: formatRouteWithTransfers(stops),
//       estimatedTravelTime: await calculateTravelTime(routeId, stops),
//       estimatedDistance,
//       cost,
//       newBalance: user.walletBalance,
//       availableSeats: selectedShuttle.availableSeats,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ msg: "Server Error" });
//   }
// });

// const formatRouteWithTransfers = (path) => {
//   return path.join(" → ");
// };

// export default router;
import express from "express";
import { sendEmail } from "../config/emailConfig.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Route from "../models/Route.js";
import Shuttle from "../models/Shuttle.js";
import Stop from "../models/Stops.js";
import User from "../models/User.js";
import {
  buildCapacitatedGraph,
  findNearestStop,
  minCostMaxFlow,
} from "../utils/flowAlgorithms.js";
import { isPeakHour } from "../utils/timeUtils.js";

const router = express.Router();

const calculateTravelTime = async (stops) => {
  if (!stops || stops.length < 2) {
    console.warn("Invalid stops data:", stops);
    return "N/A";
  }

  // Extract actual stop names (remove shuttle prefixes)
  const stopNames = stops.map((stop) => stop.split("_").slice(1).join("_"));

  // Find a matching route
  const possibleRoutes = await Route.find();
  let selectedRoute = null;

  for (const route of possibleRoutes) {
    const routeStopNames = route.stops.map((s) => s.stopName);

    let allStopsExist = true;
    for (let i = 0; i < stopNames.length - 1; i++) {
      if (
        !routeStopNames.includes(stopNames[i]) ||
        !routeStopNames.includes(stopNames[i + 1])
      ) {
        allStopsExist = false;
        break;
      }
    }

    if (allStopsExist) {
      selectedRoute = route;
      break;
    }
  }

  if (!selectedRoute) {
    console.warn("No matching route found for stops:", stopNames);
    return "N/A";
  }

  let totalDuration = 0;
  for (let i = 0; i < stopNames.length - 1; i++) {
    const from = stopNames[i];
    const to = stopNames[i + 1];

    const travelSegment = selectedRoute.travelTimes.find(
      (t) => t.from === from && t.to === to
    );
    if (travelSegment) {
      totalDuration += travelSegment.duration;
    } else {
      console.warn(
        `No travel time found from ${from} to ${to} in route ${selectedRoute.routeName}`
      );
    }
  }

  return totalDuration > 0 ? `${totalDuration} min` : "N/A";
};

router.get("/stops", async (req, res) => {
  try {
    const stops = await Stop.find();
    if (!stops.length) {
      return res.status(404).json({ msg: "No stops found" });
    }
    res.json({ stops });
  } catch (err) {
    console.error("Error fetching stops:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.post("/best-route", async (req, res) => {
  try {
    let { source, destination, currentLat, currentLng } = req.body;
    const isPeak = await isPeakHour();
    const shuttles = await Shuttle.find().populate("route");

    if (!source) {
      if (!currentLat || !currentLng) {
        return res
          .status(400)
          .json({ msg: "Either provide source or current location." });
      }
      source = findNearestStop(shuttles, currentLat, currentLng);
      if (!source) {
        return res.status(404).json({ msg: "No nearby bus stop found" });
      }
    }

    const graph = buildCapacitatedGraph(shuttles, isPeak);
    const sources = shuttles.map((shuttle) => `${shuttle.name}_${source}`);
    const sinks = shuttles.map((shuttle) => `${shuttle.name}_${destination}`);

    const { maxFlow, minCost, flowPath } = minCostMaxFlow(
      graph,
      sources,
      sinks
    );
    if (maxFlow === 0) {
      return res
        .status(400)
        .json({ msg: "No available seats for this route." });
    }

    const routes = await Promise.all(
      flowPath.map(async (path) => ({
        routeId: path.routeId || null,
        stops: formatRouteWithTransfers(path.path),
        estimatedTravelTime: await calculateTravelTime(path.path),
        cost: parseInt(minCost),
      }))
    );

    res.json({
      msg: "Available routes found",
      nearestStop: source,
      routes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.post("/book", authMiddleware, async (req, res) => {
  try {
    const { route, cost } = req.body; // Get route string and cost
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const stops = route.split(" → "); // Convert string to stops array

    const shuttles = await Shuttle.find().populate("route");
    let selectedShuttle = shuttles.find(
      (shuttle) => shuttle.availableSeats > 0
    );

    if (!selectedShuttle) {
      return res.status(400).json({ msg: "No available seats on this route." });
    }

    if (user.walletBalance < cost) {
      return res.status(400).json({ msg: "Insufficient wallet balance" });
    }

    user.walletBalance -= cost;
    selectedShuttle.availableSeats -= 1;

    user.transactions.push({
      amount: cost,
      type: "debit",
      description: `Ride from ${stops[0]} to ${stops[stops.length - 1]}`,
    });

    await user.save();
    await selectedShuttle.save();

    const emailSubject = "Shuttle Ride Confirmation";
    const emailText = `Hello ${user.name},\n\nYour ride from ${stops[0]} to ${
      stops[stops.length - 1]
    } is confirmed.\n\nRoute: ${route}\nShuttle: ${
      selectedShuttle.name
    }\nCost: ${cost} points\nRemaining Balance: ${
      user.walletBalance
    } points\n\nSafe travels!\n\nThanks for using Shuttle Management System!`;

    try {
      await sendEmail(user.email, emailSubject, emailText);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    res.json({
      msg: "Ride booked successfully! Email sent.",
      bestRoute: route,
      cost,
      newBalance: user.walletBalance,
      availableSeats: selectedShuttle.availableSeats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server Error" });
  }
});

router.get("/shuttles", async (req, res) => {
  try {
    const shuttles = await Shuttle.find().populate("route");
    if (!shuttles.length) {
      return res.status(404).json({ msg: "No shuttles found" });
    }
    res.json({ shuttles });
  } catch (err) {
    console.error("Error fetching shuttles:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});
const formatRouteWithTransfers = (path) => {
  return path.join(" → ");
};

export default router;
