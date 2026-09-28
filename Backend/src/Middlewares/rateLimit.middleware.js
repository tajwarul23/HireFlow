import {rateLimit, ipKeyGenerator} from "express-rate-limit"
const MINUTE = 1 * 60 * 1000;
const HOUR = 1 * 60 * MINUTE;

const limitReached = (message) => (req, res) =>{
     return res.status(429).json({success: false, message})
}
const byUser = (req) => (req.user ? `user:${req.user._id}` :ipKeyGenerator(req.ip) )

const baseOptions = {
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
}

// ─── Auth (not logged in yet → counted by IP) ──────────────────────────────────
export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true, // only failed logins count
  handler: limitReached("Too many failed login attempts. Please try again in 15 minutes."),
});

export const registerLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR,
  limit: 5,
  handler: limitReached("Too many accounts created. Please try again later."),
});

export const googleAuthLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * MINUTE,
  limit: 10,
  handler: limitReached("Too many sign-in attempts. Please try again in a few minutes."),
});

// ─── AI features (logged in → counted per user) ────────────────────────────────
// One shared counter for every AI feature, so the total per user is capped.
export const aiLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR,
  limit: 5,
  keyGenerator: byUser,
  handler: limitReached("You've reached the AI limit of 5 requests per hour. Please try again later."),
});

export const applyLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR,
  limit: 5,
  keyGenerator: byUser,
  handler: limitReached("You've applied to many jobs in a short time. Please try again later."),
});

// ─── Emails and file uploads (real cost: EmailJS quota, Cloudinary storage) ─────
export const inviteEmailLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR,
  limit: 10,
  keyGenerator: byUser,
  handler: limitReached("You've sent many invites recently. Please try again later."),
});

export const uploadLimiter = rateLimit({
  ...baseOptions,
  windowMs: HOUR,
  limit: 5,
  keyGenerator: byUser,
  handler: limitReached("Too many uploads. Please try again later."),
});
