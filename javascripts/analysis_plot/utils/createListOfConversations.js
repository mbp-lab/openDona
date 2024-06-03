const shortenFriendId = require("./shortenFriendId");

function createListOfConversations(conversationFriends, chat, chatInitial, chatWith, friendsInitial, systemName) {

    let listOfConversations = []

    for (let i = 0; i < conversationFriends.length; i++) {


        conversationFriends[i] = conversationFriends[i].map((friend) => shortenFriendId(friend, friendsInitial, systemName))

        listOfConversations.push(chatWith + " <br>" + conversationFriends[i][0]);
        if (conversationFriends[i].length === 1) {
            listOfConversations[i] += "  "
        }
        for (let j = 1; j < conversationFriends[i].length; j++) {
            if (conversationFriends[i][j] !== "donor") {

                if (j > 6) {
                    listOfConversations[i] += ", ..."
                    break;
                }

                if (j % 4 === 0) {
                    listOfConversations[i] += ", <br>" + conversationFriends[i][j]
                } else {
                    listOfConversations[i] += ", " + conversationFriends[i][j]
                }
                if (j === conversationFriends[i].length - 1) {
                    listOfConversations[i] += "  "
                }
            }
        }

        listOfConversations[i] = chat + " " + chatInitial + (i+1)
    }
    return listOfConversations
}


module.exports = createListOfConversations;