function validateMessage(message) {
    const messageKeys = Object.keys(message);
    if (messageKeys.includes("sender_name") &&
        messageKeys.includes("content") &&
        messageKeys.includes("timestamp_ms"))
        return true;
    else return false;
}

module.exports = validateMessage