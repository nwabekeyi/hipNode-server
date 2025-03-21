require("dotenv").config();
const mongoose = require("mongoose");
const Post = require("./src/models/postSchema");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected...");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Hardcoded Mock Posts
const mockPosts = [
  {
    title: "Building Scalable Web Apps",
    body: "Learn how to build scalable web applications with Node.js and MongoDB.",
    tags: ["Node.js", "MongoDB", "Backend"],
    imageUrl: "https://example.com/image1.jpg",
    posterId: new mongoose.Types.ObjectId("67d970649b835e163bfe1c17"), // Replace with an actual User ID from your DB
    likes: [],
    views: [],
    comments: [],
  },

];

// Insert Data into MongoDB
const seedDatabase = async () => {
  await connectDB();
  try {
    await Post.insertMany(mockPosts);
    console.log("✅ Successfully inserted mock posts!");
  } catch (error) {
    console.error("❌ Error inserting mock posts:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 MongoDB connection closed.");
  }
};

// Run Script
seedDatabase();
