import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import shuttleRoutes from "./routes/shuttleRoutes.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());
app.use(cors());

connectDB();

io.on("connection", (socket) => {
  // console.log("New client connected:", socket.id);

  socket.on("updateLocation", ({ shuttleId, lat, lng }) => {
    io.emit("locationUpdate", { shuttleId, lat, lng });
  });

  socket.on("disconnect", () => {
    // console.log("Client disconnected:", socket.id);
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/shuttle", shuttleRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
