function formInputDataForMessagesPlot(sortedGraphDataPoints, hasDate) {
    let x;
    if (hasDate) {
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
    } else {
        x = sortedGraphDataPoints.map(point => {
            return point.month + "-" + point.year;
        });
    }
    const ySentMessages = sortedGraphDataPoints.map(point => point.sentCount);
    const yReceivedMessages = sortedGraphDataPoints.map(point => point.receivedCount);
    return new Promise((resolve) => {
       const plotInputData = {
        xAxis: x,
        yAxisSentMessages: ySentMessages,
        yAxisReceivedMessages: yReceivedMessages
       }
       resolve(plotInputData);
    });
}


module.exports = formInputDataForMessagesPlot;