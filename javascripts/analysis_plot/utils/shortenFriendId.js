let shortenFriendId = (friend, friendsInitial) => {
    if (friend === "System") {
        return "System"
    }

    //find index where number starts, all friends have the following form: "friend" + "i" where i is a number
    let numberStart = friend.search(/\d+/)
    return friendsInitial + friend.substring(numberStart, friend.length)
}

module.exports = shortenFriendId;