require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();
const connectDB = require("./src/config/dbConfig");
const authRoutes = require("./src/routes/authRoute");

const PORT = process.env.PORT || 5000;




app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser()); // Parse cookies
//Create a write stream (in append mode) for logging requests
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

//Security Middleware
app.use(helmet());
app.use(cors({
    origin: "http://localhost:5173",
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.set('trust proxy', true);

app.options('*', cors());


app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Permissions-Policy', 'geolocation=(), midi=()');
    next();
});
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);


// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);

// Connect to MongoDB and start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});