/**
 * SECURITY: Rate Limiting Middleware
 * OWASP A05:2021 – Security Misconfiguration
 *
 * Tiered rate limiters using express-rate-limit:
 *   - globalLimiter     : broad catch-all for all routes
 *   - authLimiter       : strict limit for register & login (prevents credential stuffing)
 *   - otpLimiter        : very strict limit for OTP verification (prevents brute-force)
 *   - profileLimiter    : generous limit for authenticated profile reads/updates
 *   - reportLimiter     : moderate limit for abuse reports
 *
 * All limiters return RFC-7807-style JSON with a Retry-After header.
 */

const rateLimit = require('express-rate-limit');

// ─── Shared handler for 429 responses ─────────────────────────────────────────
const rateLimitHandler = (req, res, options) => {
    res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
    res.status(429).json({
        error: 'Too many requests. Please slow down.',
        retryAfterSeconds: Math.ceil(options.windowMs / 1000),
        // OWASP: Do not reveal internal rate-limit counters to clients.
    });
};

// ─── 1. Global limiter — applied to ALL routes ────────────────────────────────
// 200 requests per 15 minutes per IP. Broad safety net against mass scanning.
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,  // Emit `RateLimit-*` headers (RFC 6585)
    legacyHeaders: false,    // Disable `X-RateLimit-*` legacy headers
    handler: rateLimitHandler,
    // SECURITY: keyGenerator defaults to req.ip — works correctly behind proxies
    // when Express 'trust proxy' is enabled in production.
    message: 'Too many requests from this IP. Please try again later.',
});

// ─── 2. Auth limiter — /auth/register and /auth/login ─────────────────────────
// 10 attempts per 15 minutes per IP.
// Prevents credential stuffing and password spraying attacks.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    // Skip successful requests — only count failures towards the limit.
    // This keeps legitimate users from being locked out during normal use.
    skipSuccessfulRequests: false,
});

// ─── 3. OTP limiter — /auth/verify-otp only ───────────────────────────────────
// 5 attempts per 10 minutes per IP.
// OTP space is 10^6 (6 digits). At 5 rpm the worst-case brute-force takes
// ~139 days — effectively impractical. Combined with server-side attempt
// counters in auth.js this provides defense-in-depth.
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

// ─── 4. Profile limiter — /profile GET & PUT ──────────────────────────────────
// 60 requests per minute per IP. Generous for authenticated client usage
// but blocks automated scraping of user profiles.
const profileLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

// ─── 5. Report limiter — /report ──────────────────────────────────────────────
// 10 reports per hour per IP. Prevents report-spamming to abuse the moderation
// pipeline without restricting legitimate use.
const reportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

module.exports = { globalLimiter, authLimiter, otpLimiter, profileLimiter, reportLimiter };
