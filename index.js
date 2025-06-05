const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const { connectDB } = require("./config/db");

dotenv.config();

const app = express();
app.use(express.json());

connectDB();

app.use("/api/users", userRoutes());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
