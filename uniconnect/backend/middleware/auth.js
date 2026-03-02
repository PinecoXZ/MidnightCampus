/**
 * SECURITY: JWT Authentication Middleware
 * OWASP A07:2021 – Identification and Authentication Failures
 *
 * Shared middleware used by protected routes (/profile, /report with auth).
 * Moved here from routes/profile.js so it's reusable across all routes
 * without circular dependency risk.
 *
 * Security notes:
 *  - Bearer token is extracted only from the Authorization header (never
 *    from query strings or cookies) to avoid accidental token leakage in
 *    server logs.
 *  - jwt.verify() throws on: expired tokens, wrong signature, malformed JWTs.
 *    All error types are caught and collapsed into a single 401 response to
 *    avoid oracle attacks (e.g. distinguishing "expired" from "invalid").
 *  - The decoded payload is attached to req.user for downstream handlers.
 */

const jwt = require('jsonwebtoken');

/**
 * Express middleware that requires a valid Bearer JWT.
 * Attaches the decoded payload to `req.user` on success.
 */
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];

    // SECURITY: Authorization header must be present and follow "Bearer <token>" format.
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Authentication required. Provide a valid Bearer token.',
        });
    }

    const token = authHeader.split(' ')[1];

    // SECURITY: Guard against empty token after "Bearer ".
    if (!token || token.trim() === '') {
        return res.status(401).json({ error: 'Token is missing.' });
    }

    try {
        // jwt.verify throws if the token is expired, tampered, or malformed.
        // JWT_SECRET is validated at server startup (see server.js) so we
        // can safely assume it is a non-empty string here.
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { userId, email, iat, exp }
        next();
    } catch {
        // SECURITY: Do not distinguish between expired and invalid tokens —
        // return the same error to prevent oracle-based token attacks.
        return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
}

module.exports = { authenticate };
