import Redis from "ioredis";

const redis = new Redis();

redis.on("connect", () => {
  console.log("[Redis] Connected to Redis server");
});

redis.on("error", (err) => {
  console.error("[Redis] Error:", err);
});

process.on("SIGINT", () => {
  redis
    .quit()
    .then(() => {
      console.log("[Redis] Client disconnected");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Redis] Error during disconnection:", err);
    });
});


const limiter = (userRateLimit = 5, timeFrame = 60, quotaLimit = 1000) => {
  return async (req, res, next) => {
    try {
      const userIP = req.ip;
      const data = await redis.hgetall(userIP);

      // If user doesn't exist, create new entry
      if (!data || Object.keys(data).length === 0) {
        await redis.hmset(userIP, {
          requestLimit: 1, // Start with 1 since this is first request
          quotaLimit: quotaLimit,
          timestamp: Date.now(),
        });
        await redis.expire(userIP, timeFrame);
        console.log(`[RateLimiter] New user: ${userIP}`);
        return next();
      }

      // Convert stored string values to numbers
      const currentRequestLimit = parseInt(data.requestLimit, 10) || 0;
      const currentQuotaLimit = parseInt(data.quotaLimit, 10) || 0;
      const timestamp = parseInt(data.timestamp, 10);

      // Check if timeFrame has expired and reset if needed
      if (Date.now() > timestamp + timeFrame * 1000) {
        await redis.hmset(userIP, {
          requestLimit: 1, // Reset to 1 for this new request
          quotaLimit: currentQuotaLimit,
          timestamp: Date.now(),
        });
        await redis.expire(userIP, timeFrame);
        return next();
      }

      // Check rate limit
      if (currentRequestLimit >= userRateLimit) {
        console.warn(
          `[RateLimiter] IP: ${userIP} exceeded rate limit with ${currentRequestLimit} requests`
        );
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(
            (timestamp + timeFrame * 1000 - Date.now()) / 1000
          ),
        });
      }

      // Check quota limit
      if (currentQuotaLimit <= 0) {
        console.warn(`[QuotaLimiter] IP: ${userIP} exceeded monthly quota`);
        return res.status(403).json({
          error: "Quota exceeded. Upgrade your plan.",
        });
      }

      // Update counters
      await redis.hmset(userIP, {
        requestLimit: currentRequestLimit + 1,
        quotaLimit: currentQuotaLimit - 1,
        timestamp: data.timestamp, // Keep original timestamp for this period
      });

      console.log(
        `[RateLimiter] Remaining requests: ${
          userRateLimit - (currentRequestLimit + 1)
        }`
      );
      console.log(`[QuotaLimiter] Remaining quota: ${currentQuotaLimit - 1}`);

      next();
    } catch (error) {
      console.error("[RateLimiter] Error:", error);
      next(error);
    }
  };
};

export { limiter };
