function isVoiceMessage(message) {
    const messageKeys = Object.keys(message);
    if (messageKeys.includes("sender_name") &&
        messageKeys.includes("audio_files") &&
        messageKeys.includes("timestamp_ms"))
        return true;
    else return false;
}

module.exports = isVoiceMessage