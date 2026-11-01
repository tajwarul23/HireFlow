import { closeExpiredJobs } from "./jobExpiry.service.js";
import cron from "node-cron";

const runJobQuery = async ()=>{
  try {
    await closeExpiredJobs();
  } catch (error) {
    console.error("Job expiry failed", error.message);
    
  }
}
export const startJobExpireCron = async () => {
  await runJobQuery();

  cron.schedule("59 23 * * *", closeExpiredJobs);
  console.log("Job expiry cron started");
};
