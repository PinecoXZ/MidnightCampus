/**
 * SECURITY: Main Express + Socket.io server
 *
 * Hardening checklist applied here:
 *  ✅ Helmet HTTP security headers (X-Content-Type-Options, X-Frame-Options, etc.)
 *  ✅ Body size limit (10 kb) — prevents memory-exhaustion via oversized payloads
 *  ✅ Global rate limiter applied before all route handlers
 *  ✅ JWT_SECRET startup assertion — server refuses to start without a strong secret
 *  ✅ CORS locked to FRONTEND_URL env var only
 *  ✅ DEMO_MODE flag controls whether OTP is echoed back in the JSON response
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const reportRoutes = require('./routes/report');
const { setupMatchmaking } = require('./socket/matchmaking');
const { setupSignaling } = require('./socket/signaling');
const { globalLimiter } = require('./middleware/rateLimit');

// ─── SECURITY: Startup assertion for JWT_SECRET ───────────────────────────────
// OWASP A02:2021 – Cryptographic Failures
// The server must NOT start with a missing or weak JWT_SECRET. A secret under
// 32 characters is trivially brute-forced offline against captured JWTs.
// To generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error(
        '\n❌ FATAL: JWT_SECRET is missing or too short (< 32 chars).\n' +
        '   Set a strong secret in your .env file.\n' +
        '   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n'
    );
    process.exit(1); // Hard stop — never run with a weak or missing secret
}

// ─── App setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3000';

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    // SECURITY: Limit incoming Socket.io message size to prevent DoS.
    maxHttpBufferSize: 1e5, // 100 KB per socket message
});

// ─── Global HTTP Middleware ───────────────────────────────────────────────────

// SECURITY: Helmet sets secure HTTP headers in one call:
//   Content-Security-Policy, X-Content-Type-Options, X-Frame-Options,
//   Strict-Transport-Security (HSTS), Referrer-Policy, etc.
app.use(helmet());

// SECURITY: CORS locked to the allowed frontend origin only.
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));

// SECURITY: Limit request body to 10 kb.
// Prevents memory exhaustion attacks via intentionally large JSON payloads
// (OWASP A05:2021 – Security Misconfiguration).
app.use(express.json({ limit: '10kb' }));

// SECURITY: Apply global rate limiter BEFORE route handlers.
// This ensures ALL routes (including undocumented ones) are protected.
app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/', (req, res) => {
    res.json({ status: 'ok', message: '🎓 UniConnect API running!', version: '1.0.0' });
});

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/report', reportRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
// SECURITY: Do not expose stack traces or route details in 404 responses.
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found.' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// SECURITY: Catch any unhandled errors and return a generic 500.
// Never leak error.stack to the client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An internal server error occurred.' });
});

// ─── In-memory stores (shared across socket handlers) ─────────────────────────
const matchmakingQueues = { random: [], campus: [], studybuddy: [], gaming: [], techtalk: [], ventroom: [] };
const activeRooms = new Map();
const connectedUsers = new Map(); // socketId -> user info

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    setupMatchmaking(socket, io, matchmakingQueues, activeRooms, connectedUsers);
    setupSignaling(socket, io, activeRooms);

    socket.on('disconnect', () => {
        console.log(`❌ Socket disconnected: ${socket.id}`);

        // Remove from all queues
        Object.keys(matchmakingQueues).forEach((mode) => {
            matchmakingQueues[mode] = matchmakingQueues[mode].filter((s) => s.id !== socket.id);
        });

        // Notify peer in active room
        const room = activeRooms.get(socket.id);
        if (room) {
            socket.to(room.peerId).emit('peer-disconnected');
            activeRooms.delete(room.peerId);
            activeRooms.delete(socket.id);
        }

        connectedUsers.delete(socket.id);
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';

server.listen(PORT, () => {
    console.log(`\n🚀 UniConnect backend running on port ${PORT}`);
    console.log(`🌐 Frontend origin: ${ALLOWED_ORIGIN}`);
    if (DEMO_MODE) {
        // SECURITY: Warn loudly when DEMO_MODE is on — OTP is exposed in API responses.
        console.warn('⚠️  DEMO_MODE=true — OTP is returned in API responses. Disable before deploying to production!\n');
    } else {
        console.log('🔒 Production mode — OTP is NOT returned in API responses.\n');
    }
});
