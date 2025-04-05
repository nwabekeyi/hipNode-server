require("dotenv").config();
const http = require("http");
const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const WebSocket = require("ws");
const connectDB = require("./src/config/dbConfig");
const authRoutes = require("./src/routes/authRoute");
const postRoutes = require("./src/routes/postRoutes");
const notificationRoute = require("./src/routes/notifRoute");
const userManager = require("./src/utils/userManager");
const authHandler = require("./src/handlers/authHandler");
const messageHandler = require("./src/handlers/messageHandler");
const disconnectHandler = require("./src/handlers/disconnectHandler");
const messageRoute = require("./src/routes/messageRoute");
const User = require("./src/models/authSchema");
const Notification = require("./src/models/notifSchema"); // Added for pending notifications
const { onlineUsers } = require("./src/utils/websocketUtils"); // Updated import

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), {
  flags: "a",
});
app.use(morgan("combined", { stream: accessLogStream }));

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1"],
    methods: ["POST", "GET", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // credentials: true,
  })
);

app.set("trust proxy", 1);
app.options("*", cors());

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader("Permissions-Policy", "geolocation=(), midi=()");
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/api", messageRoute);
app.use("/api", notificationRoute);

// Create HTTP and WebSocket servers
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Broadcast updated online users list with usernames
const broadcastOnlineUsers = async () => {
  try {
    const userIds = [...onlineUsers.keys()];
    const users = await User.find({ _id: { $in: userIds } }).select("_id username");
    const userList = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
    }));

    const message = JSON.stringify({ type: "onlineUsers", data: userList });
    onlineUsers.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    console.log("Broadcasted online users:", userList);
  } catch (error) {
    console.error("Error broadcasting online users:", error);
  }
};

// Handle WebSocket connections
wss.on("connection", (ws, req) => {
  const params = new URLSearchParams(req.url.split("?")[1]);
  const userId = params.get("userId");

  if (!userId) {
    console.log("No userId provided, closing connection.");
    return ws.close();
  }

  onlineUsers.set(userId, ws);
  console.log(`User ${userId} connected. Online users:`, [...onlineUsers.keys()]);
  broadcastOnlineUsers();

  // Send pending notifications
  const sendPendingNotifications = async () => {
    try {
      const unreadNotifications = await Notification.find({ toUserId: userId, read: false });
      unreadNotifications.forEach((notification) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(notification));
          console.log(`Sent pending notification to ${userId}:`, notification);
        }
      });
      // Mark as read (optional, remove if you want manual marking)
      await Notification.updateMany({ toUserId: userId, read: false }, { read: true });
    } catch (error) {
      console.error("Error sending pending notifications:", error);
    }
  };
  sendPendingNotifications();

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Server received:", data);

      switch (data.type) {
        case "auth":
          authHandler(ws, data);
          break;
        case "message":
          messageHandler(ws, data, onlineUsers);
          break;
        case "typing":
          const recipientWs = onlineUsers.get(data.toUserId);
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            console.log("Forwarding typing event to:", data.toUserId);
            recipientWs.send(JSON.stringify(data));
          }
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    onlineUsers.delete(userId);
    console.log(`User ${userId} disconnected.`);
    broadcastOnlineUsers();
    disconnectHandler(ws);
  });
});

// Connect to MongoDB and start the server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});