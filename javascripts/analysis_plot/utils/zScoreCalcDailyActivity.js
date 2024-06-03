function ZScoreCalcDailyActivity(wordCounts, zScoreLimit) {
    let result = []

    if (wordCounts.length > 0) {
        const mean = Plotly.d3.mean(wordCounts)
        const stdDeviation = Plotly.d3.deviation(wordCounts)

        let zScore
        for (let i = 0; i < wordCounts.length; i++) {
            zScore = (wordCounts[i] - mean) / stdDeviation
            // colorscale needs a specific range -> zScores bigger than 4 and -4 will be set to 4 or -4 accordingly
            if (zScore > zScoreLimit) {
                zScore = zScoreLimit;
            } else if (zScore < -zScoreLimit) {
                zScore = -zScoreLimit
            }
            result.push(zScore)
        }
    }

    return result;
}


module.exports = ZScoreCalcDailyActivity;