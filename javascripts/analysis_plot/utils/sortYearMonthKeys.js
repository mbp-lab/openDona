function sortYearMonthKeys(keys) {

    return keys.sort((a, b) => {
        let aSplitted = a.split("-")
        let bSplitted = b.split("-")
        let aYear = parseInt(aSplitted[0])
        let aMonth = parseInt(aSplitted[1])
        let bYear = parseInt(bSplitted[0])
        let bMonth = parseInt(bSplitted[1])

        if (aYear > bYear) {
            return 1;
        } else if (aYear < bYear) {
            return -1;
        } else if (aMonth > bMonth) {
            return 1;
        } else if (aMonth < bMonth) {
            return -1;
        } else {
            return 0;
        }
    })
}


module.exports = sortYearMonthKeys;