function ZScoreCalcPolarPlot(data, zScoreLimitArg) {

    // the input data here are the monthly sent and received word counts per conversation
    // so the flattened data is all data from all conversations in one array
    let flattened = data.flat();

    // then the zscores are calculated over all those data objects adding the zscore property to the object
    // when adding the zscore property to the object, the input data is also changed because of references !
    // (this could be confusing!)

    // sums of sentCount and receivedCount
    const sums = flattened.map((obj) => obj.sentCount + obj.receivedCount)

    const mean = Plotly.d3.mean(sums)
    const stdDeviation = Plotly.d3.deviation(sums)

    let zScore
    for (let i = 0; i < sums.length; i++) {
        zScore = (sums[i] - mean) / stdDeviation
        // colorscale needs a specific range -> zScores bigger than zScoreLimit and -zScoreLimit will be set to zScoreLimit or -zScoreLimit accordingly
        if (zScore > zScoreLimitArg) {
            zScore = zScoreLimitArg;
        } else if (zScore < -zScoreLimitArg) {
            zScore = -zScoreLimitArg
        }

        flattened[i]["zScore"] = zScore
    }
}


module.exports = ZScoreCalcPolarPlot;