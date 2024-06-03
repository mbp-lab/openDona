function sortGraphDataPointsTimeWise(graphDataPoints, hasDate, hasHourAndMinute) {

    let sortDataPoints = (data) => {
        return data.sort(function (current, next) {
            if (hasHourAndMinute) {
                return new Date(current.year, current.month, current.date, current.hour, current.minute) - new Date(next.year, next.month, next.date, next.hour, next.minute)
            } else if (hasDate) {
                return new Date(current.year, current.month, current.date) - new Date(next.year, next.month, next.date)
            } else {
                return new Date(current.year, current.month, 1) - new Date(next.year, next.month, 1)
            }
        });
    }

    if (graphDataPoints[0][0] !== undefined) {
        return new Promise((resolve) => {
            let results = []
            for (let i = 0; i < graphDataPoints.length; i++) {
                let sorted = sortDataPoints(graphDataPoints[i])
                results.push(sorted)
            }
            resolve(results);
        });
    } else {
        return new Promise((resolve) => {
            const sorted = sortDataPoints(graphDataPoints)
            resolve(sorted);
        })
    }

}


module.exports = sortGraphDataPointsTimeWise;