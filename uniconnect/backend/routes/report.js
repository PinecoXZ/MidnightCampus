/**
 * SECURITY: Report Route
 * OWASP A04:2021 – Insecure Design | A03:2021 – Injection
 *
 * Hardening applied:
 *  ✅ Joi schema validation — reason constrained to enum whitelist only
 *  ✅ reportedSocketId validated against safe alphanumeric pattern
 *  ✅ Report rate limiter (10 req/hour) prevents spam-reporting abuse
 *  ✅ Reason is never interpolated into log messages unsanitized
 *  ✅ Unknown fields stripped by Joi (prevents prototype pollution)
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const { reportLimiter } = require('../middleware/rateLimit');
const { validateBody, reportSchema } = require('../middleware/validate');

// In-memory store — replace with a database in production.
const reports = [];

// ─── POST /report ─────────────────────────────────────────────────────────────
router.post(
    '/',
    reportLimiter,                 // SECURITY: max 10 reports per hour per IP
    validateBody(reportSchema),    // SECURITY: reason must be from enum; socketId pattern-checked
    (req, res) => {
        // req.body is validated and stripped — safe to use directly.
        const { reportedSocketId, reason, reporterSocketId } = req.body;

        const report = {
            id: uuidv4(),
            reportedSocketId,
            // SECURITY: Default to 'anonymous' when reporterSocketId is omitted.
            reporterSocketId: reporterSocketId || 'anonymous',
            reason,
            timestamp: new Date().toISOString(),
        };

        reports.push(report);

        // SECURITY: Log the reason as a discrete field, not via template literal
        // interpolation, to prevent log injection from crafted reason strings.
        console.log('🚨 Report filed:', { reason, reportedSocketId });

        res.json({ message: 'Report submitted. Thank you for helping keep UniConnect safe.' });
    }
);

module.exports = router;
