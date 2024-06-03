const _ = require("lodash");

function formInputDataForBreaksInConvPlot(sentReceivedWords) {

    if (sentReceivedWords.length === 0) {
        return {
            x: [],
            y: []
        }
    }

    // returns the amount of days a given year-month has
    const getDays = (year, month) => {
        return new Date(year, (month + 1), 0).getDate();
    };

    // sort by date
    sentReceivedWords = sentReceivedWords.sort(function (current, next) {
        return current.epochSeconds - next.epochSeconds
    });

    // group data my year and month
    let groupedYearMonth = _.groupBy(sentReceivedWords, (point) => {
        let dateObj = new Date(point.epochSeconds * 1000)
        //return point.date + "-" + point.month + "-" + point.year;
        let year = dateObj.getFullYear()
        let month = dateObj.getMonth() + 1

        if (month < 10) {
            month = "0" + month
        }
        point["yearMonth"] = year + "-" + month + "-01"
        return year + "-" + month + "-01"
    })


    let yearMonthsMaxValues = {}

    let firstDate = new Date(sentReceivedWords[0].epochSeconds * 1000)
    let lastDate = new Date(sentReceivedWords[sentReceivedWords.length - 1].epochSeconds * 1000);


    let loopYearMonth = new Date(firstDate.getFullYear(), firstDate.getMonth())
    let lastYearMonth = new Date(lastDate.getFullYear(), lastDate.getMonth())

    // first and last month in data need special treatment
    let isFirstMonth = true
    let isLastMonth = false
    // loop through all months from first to last


    while (loopYearMonth.getTime() <= lastYearMonth.getTime()) {
        if (loopYearMonth.getFullYear() === lastYearMonth.getFullYear() && loopYearMonth.getMonth() === lastYearMonth.getMonth()) {
            isLastMonth = true
        }
        // generate key:
        let year = loopYearMonth.getFullYear()
        let month = loopYearMonth.getMonth() + 1

        if (month < 10) {
            month = "0" + month
        }
        let key = year + "-" + month + "-01" // the day is only for making plotly js accept this as a date

        // if there was no message in this month, then there was no contact for the whole month, else get max break in days
        if (groupedYearMonth[key] === undefined) {
            yearMonthsMaxValues[key] = getDays(loopYearMonth.getFullYear(), loopYearMonth.getMonth())
        } else {
            // find longest break in days
            let longestBreak = 0;
            let sortedGrouped = groupedYearMonth[key].sort(function (current, next) {
                return current.epochSeconds - next.epochSeconds
            });

            let difference;
            // if there is only one entry, then the longest break in this month is either from beginning to this date
            // or from this date to end of month
            // else go through days to find largest gap in between them
            // break times have to be subtracted by one, because for each day 12:30 is set as the time...
            // -> so if there is a message on first day and on second day, the difference is 1 -> but should be 0
            // -> if there is a message on first day and the next message on third day -> difference is 2 but should be 1
            if (sortedGrouped.length === 1) {
                let helperDay = new Date(sortedGrouped[0].epochSeconds * 1000)
                if (isFirstMonth) {
                    helperDay.setDate(getDays(helperDay.getFullYear(), helperDay.getMonth()))
                    longestBreak = helperDay.getTime() / 1000 - sortedGrouped[sortedGrouped.length - 1].epochSeconds - 1
                    isFirstMonth = false
                    loopYearMonth.setMonth(loopYearMonth.getMonth() + 1);
                    continue
                } else if (isLastMonth) {
                    // for distance to first date in the month
                    helperDay.setDate(1)
                    longestBreak = sortedGrouped[0].epochSeconds - helperDay.getTime() / 1000 - 1
                    loopYearMonth.setMonth(loopYearMonth.getMonth() + 1);
                    continue
                }
                // for distance to first date in the month
                helperDay.setDate(1)
                longestBreak = sortedGrouped[0].epochSeconds - helperDay.getTime() / 1000 - 1
                // for distance to last date in the month
                helperDay.setDate(getDays(helperDay.getFullYear(), helperDay.getMonth()))
                difference = helperDay.getTime() / 1000 - sortedGrouped[0].epochSeconds - 1
                if (difference > longestBreak) {
                    longestBreak = difference
                }
            } else {
                for (let i = 1; i < sortedGrouped.length; i++) {
                    difference = sortedGrouped[i].epochSeconds - sortedGrouped[i - 1].epochSeconds - 1
                    if (difference > longestBreak) {
                        longestBreak = difference
                    }
                }
                // also consider from first date to first message date in this month and
                // from last message date to end of the month date
                let helperDay = new Date(sortedGrouped[0].epochSeconds * 1000)


                // for distance to first date in the month
                // if clauses are for special cases of first and last month
                if (!isFirstMonth) {
                    helperDay.setDate(1)
                    difference = sortedGrouped[0].epochSeconds - helperDay.getTime() / 1000 - 1
                    if (difference > longestBreak) {
                        longestBreak = difference
                    }
                }
                // for distance to last date in the month
                if (!isLastMonth) {
                    helperDay.setDate(getDays(helperDay.getFullYear(), helperDay.getMonth()))
                    difference = helperDay.getTime() / 1000 - sortedGrouped[sortedGrouped.length - 1].epochSeconds - 1
                    if (difference > longestBreak) {
                        longestBreak = difference
                    }
                }
            }
            yearMonthsMaxValues[key] = Math.floor(longestBreak / (60 * 60 * 24))
        }

        //let loopDate = loopYearMonth.setMonth(loopYearMonth.getMonth() + 1);
        //loopYearMonth = new Date(loopDate);
        loopYearMonth.setMonth(loopYearMonth.getMonth() + 1);
    }

    let x = []
    let y = []
    for (const [key, value] of Object.entries(yearMonthsMaxValues)) {
        x.push(key)
        y.push(value)
    }

    return {
        x: x,
        y: y
    }
}


module.exports = formInputDataForBreaksInConvPlot;