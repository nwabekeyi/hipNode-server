require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/authSchema");

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully.");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const updateUsers = async () => {
  try {
    await connectDB();

    const users = await User.find({});
    if (users.length === 0) {
      console.log("⚠️ No users found in the database.");
      return;
    }

    for (const user of users) {
      user.resetPasswordToken = user.resetPasswordToken || null;
      user.resetPasswordExpires = user.resetPasswordExpires || null;
      user.followers = user.followers || [];
      user.following = user.following || [];

      await user.save();
      console.log(`✅ Updated user: ${user.username}`);
    }

    console.log("🎉 All users updated successfully.");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error updating users:", error);
    mongoose.connection.close();
  }
};

// Run the script
updateUsers();
