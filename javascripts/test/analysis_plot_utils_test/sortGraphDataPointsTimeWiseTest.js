const expect = require('chai').expect;
const sortGraphDataPoints = require('../../analysis_plot/utils/sortGraphDataPointsTimeWise');


describe('Sorting graph data points', function () {
    const unsortedGraphDataPoints = [
        {
            month: 3,
            year: 2018,
            sentCount: 10,
            receivedCount:1
        },
        {
            month: 3,
            year: 2019,
            sentCount: 12,
            receivedCount:1
        },
        {
            month: 3,
            year: 2015,
            sentCount: 12,
            receivedCount:1
        }
    ];

    it('should sort by year then month', function () {
        return sortGraphDataPoints(unsortedGraphDataPoints, false, false).then(output => {
            expect(output).to.deep.equal([
                {
                    month: 3,
                    year: 2015,
                    sentCount: 12,
                    receivedCount:1
                },
                {
                    month: 3,
                    year: 2018,
                    sentCount: 10,
                    receivedCount:1
                },
                {
                    month: 3,
                    year: 2019,
                    sentCount: 12,
                    receivedCount:1
                }
            ]);
        });
    });
});