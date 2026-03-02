/**
 * SECURITY: Profile Routes
 * OWASP A01:2021 – Broken Access Control | A03:2021 – Injection
 *
 * Hardening applied:
 *  ✅ JWT authentication via shared middleware/auth.js
 *  ✅ Joi schema validation — only known fields accepted, unknown fields stripped
 *  ✅ Input sanitization on all mutable string fields before storage
 *  ✅ Profile rate limiter (60 req/min) prevents automated scraping
 *  ✅ Password hash never included in any GET or PUT response
 */

const express = require('express');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const { profileLimiter } = require('../middleware/rateLimit');
const { validateBody, profileUpdateSchema } = require('../middleware/validate');
const { sanitizeString, sanitizeTags } = require('../middleware/sanitize');
const authModule = require('./auth');

// ─── GET /profile ─────────────────────────────────────────────────────────────
router.get('/', profileLimiter, authenticate, (req, res) => {
    const users = authModule.users;
    const user = users.get(req.user.email);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // SECURITY: Destructure to explicitly exclude password hash from response.
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
});

// ─── PUT /profile ─────────────────────────────────────────────────────────────
router.put(
    '/',
    profileLimiter,
    authenticate,
    validateBody(profileUpdateSchema), // SECURITY: unknown fields stripped, lengths enforced
    (req, res) => {
        const users = authModule.users;
        const user = users.get(req.user.email);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        // req.body is already validated and stripped by Joi.
        // Sanitize string fields before writing to storage.
        const { name, university, major, year, tags } = req.body;

        if (name !== undefined) user.name = sanitizeString(name);
        if (university !== undefined) user.university = sanitizeString(university);
        if (major !== undefined) user.major = sanitizeString(major);
        if (year !== undefined) user.year = year; // enum-validated by Joi, no sanitization needed
        if (tags !== undefined) user.tags = sanitizeTags(tags); // dedup + sanitize each tag

        users.set(req.user.email, user);

        // SECURITY: Exclude password hash from profile update response.
        const { password: _pw, ...safeUser } = user;
        res.json({ message: 'Profile updated!', user: safeUser });
    }
);

module.exports = router;
