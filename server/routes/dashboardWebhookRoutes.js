const express = require("express");
const router = express.Router();

const Deployment = require("../models/deployement");
const Log = require("../models/log");
const SystemMetrics = require("../models/systemMetrices");

router.post("/dashboard", async (req, res) => {
  try {
    const {
      repository,
      branch,
      developer,
      commit_message,
      commit_url,
      timestamp,
      status,
    } = req.body;

    const environment =
      branch === "main"
        ? "production"
        : branch === "staging"
          ? "staging"
          : "development";

    const deployment = await Deployment.create({
      serviceName: repository || "unknown-repo",
      version: "latest",
      commitId: commit_url ? commit_url.split("/").pop() : "N/A",
      environment,
      status: status || "pending",
      duration: 60,
      owner: developer || "unknown",
      region: "ap-south-1",
      deployedAt: timestamp || new Date(),
    });

    await Log.create({
      level: status === "failed" ? "error" : "info",
      service: repository || "unknown-repo",
      message: commit_message || "Workflow update received",
      traceId: commit_url || "N/A",
      environment,
    });

    const activeDeploys = await Deployment.countDocuments({
      status: "in-progress",
    });
    const criticalErrors = await Log.countDocuments({ level: "error" });

    await SystemMetrics.create({
      cpuUsage: 40,
      memoryUsage: 55,
      activeDeploys,
      criticalErrors,
      status: criticalErrors > 0 ? "warning" : "stable",
    });

    res.status(201).json({
      message: "Dashboard webhook processed successfully",
      deployment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
