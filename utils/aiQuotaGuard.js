let aiBlockedUntil = null;

export function isAIBlocked() {
    return aiBlockedUntil && Date.now() < aiBlockedUntil;
}

export function blockAI(minutes = 30) {
    aiBlockedUntil = Date.now() + minutes * 60 * 1000;
    console.warn(`🚫 AI blocked for ${minutes} minutes`);
}
