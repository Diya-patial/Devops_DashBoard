const express = require("express");
const router = express.Router();

const Deployment = require("../models/deployement");
const Log = require("../models/log");
const SystemMetrics = require("../models/systemMetrices");

router.post("/github", async (req, res) => {
  try {
    const payload = req.body;

    const repository = payload.repository?.name || "unknown-service";
    const branch = payload.ref ? payload.ref.split("/").pop() : "main";
    const commitId = payload.head_commit?.id?.slice(0, 7) || "N/A";
    const author =
      payload.head_commit?.author?.name || payload.sender?.login || "system";

    const environment =
      branch === "main"
        ? "production"
        : branch === "staging"
          ? "staging"
          : "development";

    const deployment = await Deployment.create({
      serviceName: repository,
      version: "latest",
      commitId,
      environment,
      status: "success",
      duration: 60,
      owner: author,
      region: "ap-south-1",
    });

    await Log.create({
      level: "info",
      service: repository,
      message: `GitHub webhook received for ${repository} on branch ${branch}`,
      traceId: commitId,
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
      message: "Webhook processed successfully",
      deployment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
