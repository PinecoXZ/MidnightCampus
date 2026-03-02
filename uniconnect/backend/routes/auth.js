/**
 * SECURITY: Authentication Routes
 * OWASP A07:2021 – Identification and Authentication Failures
 *
 * Hardening applied:
 *  ✅ Joi schema validation on every endpoint via validateBody()
 *  ✅ All string inputs sanitized before storage
 *  ✅ Strict rate limiting: authLimiter on register/login, otpLimiter on verify
 *  ✅ OTP brute-force: per-record attempt counter (max 5 wrong → auto-delete)
 *  ✅ Cryptographically random OTP via crypto.randomInt (not Math.random)
 *  ✅ Password minimum 8 chars (NIST SP 800-63B)
 *  ✅ Neutral login error messages (don't confirm email existence)
 *  ✅ DEMO_MODE guard — OTP only returned in response when explicitly enabled
 *  ✅ bcrypt cost factor 12 (OWASP recommended minimum for 2024)
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // SECURITY: use built-in crypto, not Math.random
const { v4: uuidv4 } = require('uuid');

const { authLimiter, otpLimiter } = require('../middleware/rateLimit');
const { validateBody, registerSchema, verifyOtpSchema, loginSchema } = require('../middleware/validate');
const { sanitizeString, sanitizeEmail, sanitizeTags } = require('../middleware/sanitize');

// ─── In-memory stores ─────────────────────────────────────────────────────────
const users = new Map();    // email (lowercase) -> user object
const otpStore = new Map(); // email -> { otp, expiresAt, attempts, userData }

// ─── University email domain allowlist ───────────────────────────────────────
// SECURITY: This is a second-layer check. The Joi email validator ensures the
// value is a valid email format; this check ensures it is from an academic domain.
const VALID_DOMAINS = [
    '.edu', '.ac.in', '.ac.uk', '.edu.au', '.ac.nz', '.ac.za',
    '.edu.sg', '.edu.my', '.edu.pk', '.ac.bd', '.edu.ng',
    '.ac',   // bare .ac TLD — used by many universities (e.g. university.ac)
];

function isUniversityEmail(email) {
    // email is already lowercase-trimmed by Joi at this point
    return VALID_DOMAINS.some((domain) => email.endsWith(domain));
}

/**
 * Generate a cryptographically secure 6-digit OTP.
 * SECURITY: crypto.randomInt uses CSPRNG, unlike Math.random() which is
 * deterministic and predictable. With CSPRNG the OTP space is uniformly
 * distributed across 100000–999999 (900000 values).
 */
function generateOTP() {
    return crypto.randomInt(100000, 1000000).toString();
}

// ─── POST /auth/register ──────────────────────────────────────────────────────
router.post(
    '/register',
    authLimiter,          // SECURITY: max 10 req / 15 min per IP
    validateBody(registerSchema), // SECURITY: schema validation + unknown field stripping
    async (req, res) => {
        // req.body is already validated and stripped by validateBody().
        const { name, email: rawEmail, password, university: rawUniversity } = req.body;

        // Sanitize string fields before storage.
        const email = sanitizeEmail(rawEmail);
        const cleanName = sanitizeString(name);
        const cleanUniversity = sanitizeString(rawUniversity || '');

        if (!isUniversityEmail(email)) {
            return res.status(400).json({
                error: 'Please use a valid university email address (.edu, .ac.in, .ac.uk, etc.)',
            });
        }

        if (users.has(email)) {
            // SECURITY: Still return 409 here — email existence leakage on
            // registration is acceptable. Login uses a neutral message instead.
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        // SECURITY: bcrypt cost factor 12 (OWASP 2024 recommendation).
        // Higher factors increase resistance to offline brute-force attacks.
        const hashedPassword = await bcrypt.hash(password, 12);

        const otp = generateOTP();

        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10-minute window
            attempts: 0,                              // attempt counter for brute-force guard
            userData: {
                email,
                password: hashedPassword,
                name: cleanName,
                university: cleanUniversity || 'Unknown University',
            },
        });

        console.log(`📧 OTP for ${email}: ${otp}`);

        // SECURITY: DEMO_MODE controls OTP visibility.
        // In production set DEMO_MODE=false — OTP must be delivered by email.
        const DEMO_MODE = process.env.DEMO_MODE === 'true';

        res.json({
            message: DEMO_MODE
                ? 'OTP sent. Check server console or the otp field below (demo only).'
                : 'OTP sent to your university email.',
            ...(DEMO_MODE && { otp }), // Only include otp in response when explicitly in demo mode
        });
    }
);

// ─── POST /auth/verify-otp ────────────────────────────────────────────────────
router.post(
    '/verify-otp',
    otpLimiter,                   // SECURITY: max 5 req / 10 min per IP
    validateBody(verifyOtpSchema), // Ensures OTP is exactly 6 digits
    (req, res) => {
        const { email: rawEmail, otp } = req.body;
        const email = sanitizeEmail(rawEmail);

        const record = otpStore.get(email);

        if (!record) {
            return res.status(400).json({ error: 'No pending registration found. Please register again.' });
        }

        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({ error: 'OTP has expired. Please register again.' });
        }

        // SECURITY: Increment attempt counter BEFORE checking the OTP value.
        // This prevents a timing-based bypass where a correct OTP on attempt 6+
        // might succeed before the counter check fires.
        record.attempts += 1;

        // SECURITY: Max 5 wrong attempts per OTP issue.
        // Locks out brute-force even if the IP-based rate limiter is somehow bypassed.
        if (record.attempts > 5) {
            otpStore.delete(email);
            return res.status(429).json({
                error: 'Too many failed OTP attempts. Please register again to get a new OTP.',
            });
        }

        // SECURITY: Constant-time string comparison prevents timing attacks.
        // crypto.timingSafeEqual requires Buffer inputs of equal length.
        const expectedBuf = Buffer.from(record.otp, 'utf8');
        const actualBuf = Buffer.from(otp, 'utf8');
        const isValid =
            expectedBuf.length === actualBuf.length &&
            crypto.timingSafeEqual(expectedBuf, actualBuf);

        if (!isValid) {
            // Save updated attempt count back into the map.
            otpStore.set(email, record);
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }

        // OTP verified — create the user account.
        const userId = uuidv4();
        const user = {
            id: userId,
            ...record.userData,
            major: '',
            year: '1st Year',
            tags: [],
            createdAt: new Date().toISOString(),
        };

        users.set(email, user);
        otpStore.delete(email); // SECURITY: Delete OTP immediately after successful verification.

        const token = jwt.sign(
            { userId, email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // SECURITY: Never return the hashed password in any response.
        const { password: _pw, ...safeUser } = user;
        res.json({
            message: 'Account verified successfully! Welcome to UniConnect 🎓',
            token,
            user: { id: safeUser.id, name: safeUser.name, email: safeUser.email, university: safeUser.university },
        });
    }
);

// ─── POST /auth/login ─────────────────────────────────────────────────────────
router.post(
    '/login',
    authLimiter,          // SECURITY: max 10 req / 15 min per IP
    validateBody(loginSchema),
    async (req, res) => {
        const { email: rawEmail, password } = req.body;
        const email = sanitizeEmail(rawEmail);

        const user = users.get(email);

        // SECURITY: Use the same error message whether the email does not exist
        // OR the password is wrong. This prevents user enumeration
        // (OWASP A07:2021 – Identification and Authentication Failures).
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // SECURITY: Never include password hash in response.
        res.json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                university: user.university,
                major: user.major,
                year: user.year,
                tags: user.tags,
            },
        });
    }
);

// Export users map for profile route (no circular dependency — profile.js
// imports from here, not the other way around).
module.exports = router;
module.exports.users = users;
