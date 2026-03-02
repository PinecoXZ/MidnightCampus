/**
 * Alias Generator — creates a semi-anonymous, contextual display name.
 * e.g. "CSE_3rdYear_IN" or "DataSci_Masters_UK"
 * No PII is included; university name is never used.
 */

const ADJECTIVES = [
    'Stellar', 'Cosmic', 'Quantum', 'Neon', 'Solar',
    'Lunar', 'Phantom', 'Echo', 'Nova', 'Cipher',
    'Vertex', 'Nexus', 'Orbit', 'Pulse', 'Zenith',
];

const NOUNS = [
    'Scholar', 'Coder', 'Thinker', 'Analyst', 'Builder',
    'Hacker', 'Dreamer', 'Explorer', 'Pioneer', 'Sage',
    'Wizard', 'Maverick', 'Catalyst', 'Voyager', 'Nomad',
];

/**
 * Generate a random alias.
 * Falls back to a random adjective+noun combo if no profile info provided.
 * @param {string} major - e.g. "Computer Science"
 * @param {string} year  - e.g. "3rd Year"
 * @returns {string}     - e.g. "CSE_3rdYear" or "NeonScholar"
 */
function generateAlias(major = '', year = '') {
    const majorSlug = slugifyMajor(major);
    const yearSlug = slugifyYear(year);

    if (majorSlug && yearSlug) {
        return `${majorSlug}_${yearSlug}`;
    }
    if (majorSlug) {
        return `${majorSlug}_${randomItem(NOUNS)}`;
    }

    // Fully anonymous fallback
    return `${randomItem(ADJECTIVES)}${randomItem(NOUNS)}`;
}

function slugifyMajor(major) {
    const map = {
        'computer science': 'CSE',
        'cs': 'CSE',
        'cse': 'CSE',
        'data science': 'DataSci',
        'electrical': 'ECE',
        'electronics': 'ECE',
        'mechanical': 'MechE',
        'civil': 'CivilE',
        'medicine': 'MedSci',
        'law': 'LawSci',
        'business': 'BizMgmt',
        'mba': 'BizMgmt',
        'finance': 'FinSci',
        'psychology': 'PsychSci',
        'design': 'DesignSci',
        'arts': 'ArtsSci',
        'physics': 'PhySci',
        'chemistry': 'ChemSci',
        'mathematics': 'MathSci',
        'math': 'MathSci',
        'biology': 'BioSci',
        'ai': 'AISci',
        'machine learning': 'ML',
    };
    const key = major.trim().toLowerCase();
    return map[key] || (major.trim() ? major.trim().replace(/\s+/g, '').slice(0, 6) : '');
}

function slugifyYear(year) {
    const map = {
        '1st year': '1stYr',
        '2nd year': '2ndYr',
        '3rd year': '3rdYr',
        '4th year': '4thYr',
        'masters': 'Masters',
        'phd': 'PhD',
    };
    return map[year?.toLowerCase()] || '';
}

function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { generateAlias };
