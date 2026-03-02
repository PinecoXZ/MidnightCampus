/**
 * Icebreaker questions per matching mode.
 * One random question is sent with the 'matched' event so users
 * have an immediate conversation starter — kills awkward silence.
 */

const ICEBREAKERS = {
    random: [
        "What's one thing you wish more people knew about your field?",
        "If you could swap majors for a week, what would you pick?",
        "What's the most underrated skill a student can have?",
        "What's your go-to coping method during exam season?",
        "Describe your university in 3 emojis.",
    ],
    studybuddy: [
        "What subject are you prepping for right now?",
        "What's your mid-sem stress level right now — 1 to 10?",
        "Do you prefer studying in silence or with music?",
        "What's your biggest academic goal this semester?",
        "Pomodoro technique — yes or no, and why?",
    ],
    gaming: [
        "Best game of all time — go!",
        "Valorant, BGMI, or GTA — which one defines your soul?",
        "What game have you sunk the most hours into?",
        "Are you a solo-queue hero or a team-only player?",
        "Name a game that's criminally underplayed.",
    ],
    techtalk: [
        "What's the most interesting tech project you've worked on?",
        "AI hype — justified or overblown?",
        "Which tech stack would you bet on for the next 5 years?",
        "Best open-source project you've discovered recently?",
        "Startup founder or Big Tech — which path would you rather take?",
    ],
    ventroom: [
        "On a scale of 1–10, how overwhelmed are you feeling right now?",
        "What's been the hardest part of this semester for you?",
        "What's one small thing that would make your day better?",
        "Is there something you've been holding in that you need to say?",
        "What does rest look like for you when you actually get it?",
    ],
    campus: [
        "What's the most underrated spot on your campus?",
        "Best professor you've had and why?",
        "What campus event do you wish more people attended?",
        "If you could change one thing about your university, what would it be?",
        "What's your campus canteen's worst and best dish?",
    ],
};

/**
 * Get a random icebreaker for a given mode.
 * @param {string} mode
 * @returns {string}
 */
function getIcebreaker(mode) {
    const questions = ICEBREAKERS[mode] || ICEBREAKERS.random;
    return questions[Math.floor(Math.random() * questions.length)];
}

module.exports = { getIcebreaker, ICEBREAKERS };
