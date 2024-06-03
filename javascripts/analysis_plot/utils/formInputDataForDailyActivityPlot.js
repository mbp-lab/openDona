function formInputDataForDailyActivityPlot(sortedGraphDataPoints) {
    let x;

    x = sortedGraphDataPoints.map(point => {

        let dateObj = new Date(point.epochSeconds * 1000)
        //return point.date + "-" + point.month + "-" + point.year;
        let year = dateObj.getFullYear()
        let month = dateObj.getMonth() + 1
        let date = dateObj.getDate()

        if (month < 10) {
            month = "0" + month
        }
        if (date < 10) {
            date = "0" + date
        }
        return year + "-" + month + "-" + date
    });


    const yTimes = sortedGraphDataPoints.map(point => {

        let dateObj = new Date(point.epochSeconds * 1000)

        let hour = dateObj.getHours()
        //let minute = point.hour

        if (hour < 10) {
            hour = "0" + hour
        }
        /*
        if (minute < 10) {
            minute = "0" + minute
        }

         */
        // as only one point per hour is being displayed, set default minute 00
        return '2022-05-21 ' + hour + ":" + "00" + ":00"
    });

    const wordCount = sortedGraphDataPoints.map(point => {
        return point.wordCount;
    })


    return {
        xAxis: x,
        yAxis: yTimes,
        wordCount: wordCount
    }

}


module.exports = formInputDataForDailyActivityPlot;