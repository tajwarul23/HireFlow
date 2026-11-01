import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue:false
});

redis.on("ready", () => {
  console.log("Connected to redis");
});

redis.on("error", (error) => {
  console.log("Error on Redis", error.message);
});

redis.on("close", () => {
  console.log("Redis connection closed");
});