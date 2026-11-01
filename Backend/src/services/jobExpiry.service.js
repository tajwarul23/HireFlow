import { redis } from "../config/redis.js";
import { JobModel } from "../Models/job.model.js";

export const closeExpiredJobs = async () => {
  try {
    const ids = await JobModel.find({
      status:"OPEN",
      deadline:{$lt: new Date()}
    }).distinct("_id");
    if(!ids.length){
      console.log("Job expiry check completed. 0 jobs closed.");
      return;
    }
   const result = await JobModel.updateMany(
    {_id: {$in: ids}},
    {$set:{status:"CLOSED"}}
   );
    console.log(
      `Job expiry check completed. ${result.modifiedCount} jobs closed.`,
    );

    try {
      await redis.del(...ids.map((id) => `job:${id}`));
    } catch (error) {
      console.error("REDIS del failed on job expiry", error.message);
    }
  } catch (error) {
    console.log("Error closing expired jobs", error.message);
  }
};
