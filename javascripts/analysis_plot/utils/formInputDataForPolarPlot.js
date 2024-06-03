const shortenFriendId = require("./shortenFriendId");

function formInputDataForPolarPlot(sortedGraphDataPoints, allFriends, yearToExclude, monthToExclude, monthsBefore) {

    if (sortedGraphDataPoints[0][0] != null) {


        let averageValues = []
        let valuesExcludedMonth = []

        let listOfConversations = []
        for (let i = 0; i < allFriends.length; i++) {

            allFriends[i] = allFriends[i].map((friend) => shortenFriendId(friend))

            listOfConversations.push("Chat with: <br>" + allFriends[i][0]);
            if (allFriends[i].length === 1) {
                listOfConversations[i] += "  "
            }
            for (let j = 1; j < allFriends[i].length; j++) {
                if (allFriends[i][j] !== "donor") {

                    if (j > 7) {
                        listOfConversations[i] += ", ..."
                        break;
                    }

                    if (j % 4 === 0) {
                        listOfConversations[i] += ", <br>" + allFriends[i][j]
                    } else {
                        listOfConversations[i] += ", " + allFriends[i][j]
                    }
                    if (j === allFriends[i].length - 1) {
                        listOfConversations[i] += "  "
                    }
                }
            }
        }

        // get earliest year and month of reference time span
        // -1 here because months in date object start with 0
        let earliestMonthYearBefore = new Date(yearToExclude, monthToExclude - 1, 1)
        earliestMonthYearBefore.setMonth(monthToExclude - monthsBefore - 1)
        let earliestYear = earliestMonthYearBefore.getFullYear()
        let earliestMonth = earliestMonthYearBefore.getMonth() + 1 // +1 for same reason as - 1

        //console.log("earliestYear: ", earliestYear)
        //console.log("earliestMonth: ", earliestMonth)


        for (let i = 0; i < allFriends.length; i++) {

            // get data without the selected month and only months in range before the selected month
            let filteredData = sortedGraphDataPoints[i].filter((obj) => {



                let yearMonthExcluded = (obj.year === yearToExclude && obj.month === monthToExclude) // is not in the excluded month
                let isInBetweenYears = (obj.year > earliestYear && obj.year < yearToExclude)
                let earliestEqualsExcludedYear = yearToExclude === earliestYear && yearToExclude === obj.year

                //console.log("obj::", obj)
                //console.log(yearMonthExcluded)
                //console.log(isInBetweenYears)
                //console.log(earliestEqualsExcludedYear)

                if (yearMonthExcluded || obj.year > yearToExclude || obj.year < earliestYear) { // is not the excluded month and year and is in range of years
                    return false
                } else if (isInBetweenYears) { // if it is between earliest and year to exclude -> then it is in range
                    return true
                } else if(earliestEqualsExcludedYear) { // if earliest year equals excluded year
                    return (obj.month < monthToExclude) && (obj.month >= earliestMonth) // month needs to be in between
                } else if (obj.year === yearToExclude) { // if year is the year to exclude, then month needs to be smaller
                    return obj.month < monthToExclude
                } else { // else the year is the same as earliest year, then month needs to be bigger or equal than earliest month
                    return obj.month >= earliestMonth
                }

            })

            /*
            console.log("earliestYear: ", earliestYear)
            console.log("earliestMonth: ", earliestMonth)
            console.log("yearToExclude: ", yearToExclude)
            console.log("filtered Data:", filteredData)

             */

            // get all sent counts from those objects and sum them up to calculate the average
            let sentCounts = filteredData.map(obj => obj.sentCount)
            let sum = 0;
            sentCounts.forEach((count) =>
                sum += count
            )
            let average = sum / monthsBefore
            averageValues.push(average)

            // get the data for the excludedMonth
            let excludedMonth = sortedGraphDataPoints[i].filter(obj => {
                return obj.year === yearToExclude && obj.month === monthToExclude
            })

            if (excludedMonth.length === 0) {
                valuesExcludedMonth.push(0)
            } else {
                valuesExcludedMonth.push(excludedMonth[0].sentCount)
            }

        }


        averageValues = averageValues.map((value) => Math.sqrt(value))
        valuesExcludedMonth = valuesExcludedMonth.map((value) => Math.sqrt(value))

        //console.log("AVERAGE values:", averageValues)
        //console.log("valuesExcluded:", valuesExcludedMonth)


        return new Promise((resolve) => {
            const plotInputData = {
                theta: listOfConversations,
                r: averageValues,
                rExcludedMonth: valuesExcludedMonth,
                thetaExcludedMonth: listOfConversations,
            }
            resolve(plotInputData);
        });

    }


    let friends = []
    let averageValues = []
    let friendsExcludedMonth = []
    let valuesExcludedMonth = []

    let filteredData;
    let sumSent;

    //console.log(allFriends)

    allFriends.forEach((friend) => {
        sumSent = 0;

        filteredData = sortedGraphDataPoints.filter((obj) => {
            return (obj.from === friend || obj.to === friend) && (obj.year !== yearToExclude && obj.month !== monthToExclude)
        })
        //console.log("friend: " + friend)
        //console.log(filteredData)

        friends.push(friend)

        if (filteredData.length === 0) {
            averageValues.push(0)
        } else {
            for (let i = 0; i < filteredData.length; i++) {
                sumSent += filteredData[i].sentCount
            }
            averageValues.push(sumSent / filteredData.length)
        }
    })

    allFriends.forEach((friend) => {
        filteredData = sortedGraphDataPoints.filter((obj) => {
            return (obj.from === friend || obj.to === friend) && (obj.year === yearToExclude && obj.month === monthToExclude)
        })

        friendsExcludedMonth.push(friend)

        if (filteredData.length === 0) {
            valuesExcludedMonth.push(0)
        } else {
            valuesExcludedMonth.push(filteredData[0].sentCount)
        }

    })


    averageValues = averageValues.map((value) => Math.sqrt(value))
    valuesExcludedMonth = valuesExcludedMonth.map((value) => Math.sqrt(value))


    return new Promise((resolve) => {
        const plotInputData = {
            theta: friends,
            r: averageValues,
            rExcludedMonth: valuesExcludedMonth,
            thetaExcludedMonth: friendsExcludedMonth,
        }
        resolve(plotInputData);
    });
}


module.exports = formInputDataForPolarPlot;