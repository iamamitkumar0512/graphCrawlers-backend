import { Router } from "express";
import {
  getTweets,
  getTweet,
  getTweetStats,
  fetchTweets,
  getMonitoringList,
  addToMonitoring,
  removeFromMonitoring,
  getCronStatus,
  stopCronJobs,
  startCronJobs,
} from "../controllers/tweetController";

const router = Router();

// Tweet routes
router.get("/", getTweets);
router.get("/stats", getTweetStats);
router.get("/monitoring", getMonitoringList);
router.get("/cron/status", getCronStatus);
router.get("/:id", getTweet);

// Tweet management routes
router.post("/fetch", fetchTweets);
router.post("/monitoring", addToMonitoring);
router.delete("/monitoring/:username", removeFromMonitoring);

// Cron job management routes
router.post("/cron/stop", stopCronJobs);
router.post("/cron/start", startCronJobs);

export default router;
