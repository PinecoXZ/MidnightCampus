/**
 * SECURITY: Input Sanitization Utilities
 * OWASP A03:2021 – Injection
 *
 * Sanitization is a separate concern from validation (Joi handles type/format).
 * These utilities clean string content AFTER schema validation passes.
 *
 * Rules applied:
 *   1. Trim leading/trailing whitespace
 *   2. Strip ASCII control characters (0x00–0x1F, 0x7F) that could corrupt
 *      logs, cause parser confusion, or slip through JSON encoding.
 *   3. Collapse consecutive whitespace to a single space (prevents invisible
 *      homoglyph-style manipulation of displayed names).
 *   4. Lowercase email addresses for consistent key lookups.
 *
 * NOTE: We do NOT HTML-encode here because this is a JSON API — output
 * encoding is the responsibility of the consuming client (Next.js/React
 * handles this automatically via JSX). Encoding at the API layer would
 * corrupt data for non-HTML consumers.
 */

// Regex: matches any ASCII control character (tab/newline/carriage-return
// included) except space (0x20). Also strips DEL (0x7F).
const CONTROL_CHAR_RE = /[\x00-\x1F\x7F]+/g;

// Collapse runs of whitespace (space, tab, non-breaking space) to one space.
const MULTI_SPACE_RE = /\s{2,}/g;

/**
 * Sanitize a general-purpose string field (name, university, major, tag).
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str
        .trim()
        .replace(CONTROL_CHAR_RE, '') // strip control chars
        .replace(MULTI_SPACE_RE, ' ') // collapse whitespace
        .trim();                       // trim again after collapse
}

/**
 * Sanitize an email: lowercase + trim.
 * Do NOT strip control chars from emails separately — Joi's email validator
 * already rejects malformed values before we reach this stage.
 * @param {string} email
 * @returns {string}
 */
function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
}

/**
 * Sanitize an array of tag strings.
 * Each tag is sanitized individually; empty strings after sanitization are
 * removed. Duplicate tags (case-insensitive) are deduplicated.
 * @param {string[]} tags
 * @returns {string[]}
 */
function sanitizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    const seen = new Set();
    return tags
        .map((t) => sanitizeString(String(t)))
        .filter((t) => {
            if (!t) return false;                     // drop empty strings
            const key = t.toLowerCase();
            if (seen.has(key)) return false;          // drop duplicates
            seen.add(key);
            return true;
        });
}

/**
 * Sanitize a chat message: trim + strip control chars + enforce max length.
 * Newlines (0x0A) are preserved — they are meaningful in chat.
 * @param {string} msg
 * @param {number} maxLen
 * @returns {string}
 */
function sanitizeChatMessage(msg, maxLen = 500) {
    if (typeof msg !== 'string') return '';
    return msg
        .replace(/[\x00-\x09\x0B-\x1F\x7F]+/g, '') // strip controls EXCEPT \n (0x0A)
        .trim()
        .slice(0, maxLen);
}

module.exports = { sanitizeString, sanitizeEmail, sanitizeTags, sanitizeChatMessage };
