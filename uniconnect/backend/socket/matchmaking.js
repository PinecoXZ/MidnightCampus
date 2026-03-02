/**
 * SECURITY: Matchmaking Socket Handler
 * OWASP A03:2021 – Injection | A04:2021 – Insecure Design
 *
 * Hardening applied:
 *  ✅ All socket event payloads validated with Joi schemas before processing
 *  ✅ join-queue: mode is enum-whitelisted; userInfo fields length-limited
 *  ✅ send-message: message length hard-capped at 500 chars; sanitized before relay
 *  ✅ leave-queue: mode validated against enum
 *  ✅ Malformed payloads emit a structured 'error' event and return early
 *  ✅ userInfo fields sanitized before being stored in connectedUsers map
 *  ✅ peerInfo relayed to peer only contains safe whitelisted fields
 *
 * Modes: random | campus | studybuddy | gaming | techtalk | ventroom
 */

const { validateSocketPayload, joinQueueSchema, sendMessageSchema, leaveQueueSchema } = require('../middleware/validate');
const { sanitizeString, sanitizeTags, sanitizeChatMessage } = require('../middleware/sanitize');
const { getIcebreaker } = require('../utils/icebreakers');
const { generateAlias } = require('../utils/aliasGen');

const ALL_MODES = ['random', 'campus', 'studybuddy', 'gaming', 'techtalk', 'ventroom'];

// Per-socket match history (last 5 entries)
const matchHistories = new Map(); // socketId -> [{mode, timestamp, peerMajorHint}]

function setupMatchmaking(socket, io, queues, activeRooms, connectedUsers) {

    // ── join-queue ────────────────────────────────────────────────────────────
    socket.on('join-queue', (data) => {
        const { valid, value, errors } = validateSocketPayload(joinQueueSchema, data);
        if (!valid) {
            socket.emit('error', { message: 'Invalid join-queue payload.', details: errors });
            return;
        }

        const { mode, userInfo } = value;

        // Validate mode is one of the 6 allowed values
        if (!ALL_MODES.includes(mode)) {
            socket.emit('error', { message: `Unknown mode: ${mode}` });
            return;
        }

        const safeUserInfo = {
            name: sanitizeString(userInfo?.name || ''),
            alias: generateAlias(userInfo?.major || '', userInfo?.year || ''),
            university: sanitizeString(userInfo?.university || ''),
            major: sanitizeString(userInfo?.major || ''),
            year: sanitizeString(userInfo?.year || ''),
            tags: sanitizeTags(userInfo?.tags || []),
            showUniversity: userInfo?.showUniversity !== false, // default true
            socketId: socket.id,
            mode,
            reputation: 0,
        };

        connectedUsers.set(socket.id, safeUserInfo);
        console.log(`👤 ${socket.id} [${safeUserInfo.alias}] joined ${mode} queue. Size: ${queues[mode].length + 1}`);

        // Remove from ALL queues before adding to the chosen one
        ALL_MODES.forEach((m) => {
            queues[m] = queues[m].filter((s) => s.id !== socket.id);
        });

        let matchFound = false;

        if (mode === 'campus') {
            // Match by same university
            const peerIndex = queues[mode].findIndex((s) => {
                const peerInfo = connectedUsers.get(s.id);
                return peerInfo?.university === safeUserInfo.university;
            });
            if (peerIndex !== -1) {
                const peer = queues[mode].splice(peerIndex, 1)[0];
                matchUsers(socket, peer, io, activeRooms, connectedUsers, mode);
                matchFound = true;
            }
        } else if (mode === 'studybuddy') {
            // Match by shared interest tags (best-score wins)
            const myTags = new Set(safeUserInfo.tags);
            let bestMatch = { index: -1, score: -1 };
            queues[mode].forEach((s, idx) => {
                const peerInfo = connectedUsers.get(s.id);
                const sharedCount = (peerInfo?.tags || []).filter((t) => myTags.has(t)).length;
                if (sharedCount > bestMatch.score) bestMatch = { index: idx, score: sharedCount };
            });
            // Match even with 0 shared tags if someone is waiting
            if (queues[mode].length > 0 && bestMatch.index === -1) {
                bestMatch.index = 0;
            }
            if (bestMatch.index !== -1) {
                const peer = queues[mode].splice(bestMatch.index, 1)[0];
                matchUsers(socket, peer, io, activeRooms, connectedUsers, mode);
                matchFound = true;
            }
        } else {
            // Random, gaming, techtalk, ventroom — FIFO
            if (queues[mode].length > 0) {
                const peer = queues[mode].shift();
                matchUsers(socket, peer, io, activeRooms, connectedUsers, mode);
                matchFound = true;
            }
        }

        if (!matchFound) {
            queues[mode].push(socket);
            socket.emit('waiting', { message: 'Looking for a match...', mode, queueSize: queues[mode].length });
        }
    });

    // ── leave-queue ───────────────────────────────────────────────────────────
    socket.on('leave-queue', (data) => {
        const { valid, value } = validateSocketPayload(leaveQueueSchema, data || {});
        const mode = valid ? value?.mode : undefined;

        if (mode && queues[mode]) {
            queues[mode] = queues[mode].filter((s) => s.id !== socket.id);
        } else {
            // Remove from all queues if mode not specified
            ALL_MODES.forEach((m) => {
                queues[m] = queues[m].filter((s) => s.id !== socket.id);
            });
        }
        socket.emit('left-queue');
    });

    // ── send-message ──────────────────────────────────────────────────────────
    socket.on('send-message', (data) => {
        const { valid, value, errors } = validateSocketPayload(sendMessageSchema, data);
        if (!valid) {
            socket.emit('error', { message: 'Invalid message payload.', details: errors });
            return;
        }

        const cleanMessage = sanitizeChatMessage(value.message, 500);
        const room = activeRooms.get(socket.id);
        if (room && cleanMessage) {
            io.to(room.peerId).emit('receive-message', {
                message: cleanMessage,
                fromSelf: false,
                timestamp: new Date().toISOString(),
            });
        }
    });

    // ── extend-chat ───────────────────────────────────────────────────────────
    // Relayed to peer; if peer also emits extend-chat the client resets timer.
    socket.on('extend-chat', () => {
        const room = activeRooms.get(socket.id);
        if (room) {
            io.to(room.peerId).emit('peer-wants-extend');
        }
    });

    // ── upvote ────────────────────────────────────────────────────────────────
    // Called at end of session to give the peer a thumbs-up.
    socket.on('upvote', () => {
        const room = activeRooms.get(socket.id);
        if (room) {
            const peerInfo = connectedUsers.get(room.peerId);
            if (peerInfo) {
                peerInfo.reputation = (peerInfo.reputation || 0) + 1;
                connectedUsers.set(room.peerId, peerInfo);
                io.to(room.peerId).emit('reputation-updated', { reputation: peerInfo.reputation });
            }
        }
    });

    // ── match-history ─────────────────────────────────────────────────────────
    socket.on('get-match-history', () => {
        const history = matchHistories.get(socket.id) || [];
        socket.emit('match-history', { history });
    });

    // ── skip ──────────────────────────────────────────────────────────────────
    socket.on('skip', () => {
        const room = activeRooms.get(socket.id);
        if (room) {
            io.to(room.peerId).emit('peer-disconnected');
            activeRooms.delete(room.peerId);
            activeRooms.delete(socket.id);
        }
        socket.emit('skipped');
    });
}

/**
 * Pair two sockets, generate aliases, attach icebreaker.
 * Only safe, whitelisted fields are relayed to each peer.
 */
function matchUsers(socket1, socket2, io, activeRooms, connectedUsers, mode) {
    const peer1Info = connectedUsers.get(socket1.id);
    const peer2Info = connectedUsers.get(socket2.id);

    activeRooms.set(socket1.id, { peerId: socket2.id, mode });
    activeRooms.set(socket2.id, { peerId: socket1.id, mode });

    const icebreaker = getIcebreaker(mode);
    const timestamp = new Date().toISOString();

    // Record match in history (both sides) — anonymized
    recordHistory(socket1.id, { mode, timestamp, peerMajorHint: peer2Info?.major || '' });
    recordHistory(socket2.id, { mode, timestamp, peerMajorHint: peer1Info?.major || '' });

    socket1.emit('matched', {
        peerId: socket2.id,
        peerInfo: buildSafePeerInfo(peer2Info),
        isInitiator: true,
        icebreaker,
        mode,
    });

    socket2.emit('matched', {
        peerId: socket1.id,
        peerInfo: buildSafePeerInfo(peer1Info),
        isInitiator: false,
        icebreaker,
        mode,
    });

    console.log(`✅ [${mode}] Matched: ${peer1Info?.alias || socket1.id} <-> ${peer2Info?.alias || socket2.id}`);
}

/** Returns only safe, display-ready peer fields */
function buildSafePeerInfo(info) {
    if (!info) return { alias: 'Anonymous', university: null, tags: [] };
    return {
        alias: info.alias || 'Anonymous',
        university: info.showUniversity ? (info.university || null) : null,
        tags: info.tags || [],
        reputation: info.reputation || 0,
    };
}

/** Keep last 5 match history entries per socket */
function recordHistory(socketId, entry) {
    const current = matchHistories.get(socketId) || [];
    const updated = [entry, ...current].slice(0, 5);
    matchHistories.set(socketId, updated);
}

module.exports = { setupMatchmaking };
