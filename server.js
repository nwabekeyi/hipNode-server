require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
// const cloudinary = require("./cloudinary"); // Import Cloudinary configuration
const connectDB = require("./src/config/dbConfig");
const authRoutes = require("./src/routes/authRoute");
const postRoutes = require("./src/routes/postRoutes"); // Import post routes

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// Logging requests to a file
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
app.use(morgan("combined", { stream: accessLogStream }));

// Security Middleware
app.use(helmet());
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1"],
    methods: ["POST", "GET", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));

app.set("trust proxy", 1);
app.options("*", cors());

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    res.setHeader("Permissions-Policy", "geolocation=(), midi=()");
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use("/auth", authRoutes);  // Authentication routes
app.use("/posts", postRoutes); // Post routes

// Connect to MongoDB and start the server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
});
