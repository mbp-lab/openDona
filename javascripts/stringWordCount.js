function contentSize(messageContent) {
    return messageContent.trim().split(/\s+/).filter(str=>str!='').length;
};

module.exports = contentSize
