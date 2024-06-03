const uuid = require('uuid/v4');
const countWords = require('../../stringWordCount');
const { makeArrayOfMessages, parseMessages } = require('./whatsappParser.js');
const _ = require("lodash");
const messageService = require("../../messageService");

function whatsappTxtFilesHandler(filelist) {
    const i18nSupport = $('#i18n-support');
    var files = [];
    for (var i = 0; i < filelist.length; i++) {
        files.push(filelist[i]);
    }
    ;


    return new Promise((resolve, reject) => {
        // check if number of files is in the limits
        // TODO: put number of files in some config file
        if (files.length !== 0 && (files.length < 5 || files.length > 7)) {
            reject(i18nSupport.data('error-not-enough-chats').replace('%s', files.length));
            return;
        } else {
            // check if all files seem to be the same
            let fileSize = files[0].size
            let allSameSize = true
            for (let i = 1; i < files.length; i++) {
                if (files[i].size !== fileSize) {
                    allSameSize = false
                }
            }
            if (allSameSize) {
                reject(i18nSupport.data('error-same-files'));
                return;
            }
        }

        const parsedFiles = files.map(file => {
            return handlefile(file)
                .then(data => data.split('\n'))
                .then(makeArrayOfMessages)
                .then(messages => parseMessages(messages))
        });

        // determine possible usernames
        Promise.all(parsedFiles)
            .then((parsed) => {
                let isRejected = false

                // check if any textList of a chat is empty or there is only one person in that chat
                parsed.forEach(({ texts, contacts }) => {
                    if (texts.length < 100 || contacts.length <= 1) {
                        reject(i18nSupport.data('error-empty-or-onecontact'));
                        isRejected = true
                        return;
                    }
                })
                // check if a rejection reason was found -> so dont continue if there was a reason to reject
                if (isRejected) {
                    return;
                }

                let textList = parsed.map((obj) => obj.texts)
                let contacts = parsed.map((obj) => obj.contacts)

                // determine possible alias - if only one is possible then that is the alias
                let possibleUserNames = _.intersection(...contacts)

                if (possibleUserNames.length === 1) {
                    let result = deIdentification(textList, possibleUserNames[0])

                    resolve(result);
                } else {
                    askUserForUsername(possibleUserNames)
                        .then(username => {
                            let result = deIdentification(textList, username)
                            resolve(result);
                        })
                }
            })
            .catch((event) => {
                reject(event.target.error)
            })


    })

}


function checkOneSidedThreshold(data) {
    const i18nSupport = $('#i18n-support');
    let donor = i18nSupport.data('donor');
    let allWordCounts = data.map(conv => {
        return {
            participants: conv.participants,
            wordCount: conv.messages.reduce((pv, cv) => pv + cv.word_count, 0),
            wordCountDonor: conv.messages.reduce((pv, cv) => {
                if (cv.sender_name === donor) {
                    return pv + cv.word_count
                } else {
                    return pv
                }
            }, 0)
        };
    })

    // check if there is a conversation where the donors participation is below a threshold
    // if it is a group chat: donorsParticipationValue = donorWordCount/(totalWordCount/noOfParticipants)
    // donors participation value must be between 0.1 and 0.9 (in the follwing called valueToCompare)
    let rejectionReason = false
    allWordCounts.forEach((wordCountObj) => {
        if (wordCountObj.wordCountDonor === 0) {
            rejectionReason = true
            return;
        } else if (wordCountObj.participants.length <= 2) {
            // in this case its not a group chat
            let valueToCompare = wordCountObj.wordCountDonor / wordCountObj.wordCount
            if (valueToCompare <= 0.1 || valueToCompare >= 0.9) {
                rejectionReason = true
                return;
            }
        } else {
            // in this case it is a group chat
            let valueToCompare = wordCountObj.wordCountDonor / (wordCountObj.wordCount / wordCountObj.participants.length)
            if (valueToCompare <= 0.1 || valueToCompare >= 0.9) {
                rejectionReason = true
                return;
            }
        }
    })

    console.log(rejectionReason)
}

function askUserForUsername(possibilities) {
    return new Promise((resolve) => {

        let usernameSelector = document.getElementById("usernameSelect");
        usernameSelector.innerHTML = '';
        possibilities.forEach((name) => {
            usernameSelector.options[usernameSelector.options.length] = new Option(name, name);
        })

        usernameSelector.options[0].setAttribute("selected", true)

        let usernameSelectButton = document.getElementById("usernameSelectButton");
        usernameSelectButton.onclick = () => {
            resolve(usernameSelector.value)
        }
        $('#usernameModal').modal('show')
    })
}

function handlefile(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = event => resolve(event.target.result);
        reader.onprogress = event => {
            if (event.target.error) {
                return reject(event.target.error)
            }
        }
        reader.onloadend = event => {
            if (event.target.error) {
                return reject(event.target.error)
            }
        }
        reader.onabort = event => {
            if (event.target.error) {
                return reject(event.target.error)
            }
        }
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

function deIdentification(parsedFiles, alias) {
    const participantNameToRandomIds = {};
    const deIdentifiedJsonContents = [];
    const systemMessage = "Messages to this chat and calls are now secured with end-to-end encryption.";
    let i = 1;

    return Promise.all(parsedFiles)
        .then(textList => {
            textList.forEach(lines => {
                const jsonContent = { "participants": [], "messages": [], thread_type: "Regular" };
                var eachFileParticipants = new Set();
                const i18nSupport = $('#i18n-support');
                participantNameToRandomIds[alias] = i18nSupport.data('donor');
                const messages = lines.map(line => {
                    if (!line.message.includes(systemMessage)) {
                        const participant = getDeIdentifiedId(line.author);
                        eachFileParticipants.add(participant);
                        const sender_name = participant;
                        const timestamps_ms = line.date;
                        const wordCount = countWords(line.message);
                        const message = {
                            "sender_name": sender_name,
                            "timestamp_ms": timestamps_ms,
                            "word_count": wordCount
                        };
                        return message;
                    }
                });
                messages.splice(messages.indexOf(undefined), 1)  //remove the system message which is now undefined
                jsonContent.messages = messages;
                const arr = Array.from(eachFileParticipants)
                const t = arr.map(participantId => {
                    return {
                        "name": participantId
                    }
                });
                jsonContent.participants = t;

                if (jsonContent.participants.length === 3) {
                    const systemName = i18nSupport.data("system")
                    // check if one of the participants is the system, then it is no group!
                    if (!arr.includes(systemName)) {
                        jsonContent.thread_type = "RegularGroup"
                    }
                } else if (jsonContent.participants.length > 2) {
                    jsonContent.thread_type = "RegularGroup"
                }
                ;

                deIdentifiedJsonContents.push(jsonContent);
            });

            let result = {
                deIdentifiedJsonContents: deIdentifiedJsonContents,
                participantNameToRandomIds: participantNameToRandomIds,
                chatsToShowMapping: deIdentifiedJsonContents.map(chat => chat.participants)
            }

            return result;
        });

    function getDeIdentifiedId(name) {
        const i18nSupport = $('#i18n-support');
        const systemName = i18nSupport.data("system")

        if (!(name in participantNameToRandomIds)) {
            if (name === systemName) {
                participantNameToRandomIds[name] = systemName;
            } else {
                participantNameToRandomIds[name] = i18nSupport.data("friend") + i;
                i++;
            }
        }
        return participantNameToRandomIds[name];
    }

};

module.exports = whatsappTxtFilesHandler;