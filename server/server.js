require("dotenv").config();
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const deploymentRoutes = require("./routes/deployementRoutes");
const healthRoutes = require("./routes/healthRoutes");
const logRoutes = require("./routes/logRoutes");

const dashboardWebhookRoutes = require("./routes/dashboardWebhookRoutes");

const app = express();

app.use(express.json());
app.use(cors());

connectDB();

app.get("/", (req, res) => {
  res.send("DevOps Deployment Monitoring API is running...");
});

app.use("/api/deployments", deploymentRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/logs", logRoutes);

app.use("/api/dashboard-webhooks", dashboardWebhookRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server Error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
