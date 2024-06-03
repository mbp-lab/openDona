const expect = require('chai').expect;
const formInputDataForMessagesPlot = require('../../analysis_plot/utils/formInputDataForMessagesPlot');


describe('Forming input data for message numbers plot', function() {
    const validSortedGraphDataPoints = [
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
    ];
    it('should provide a JSON with x and y data', function () {
        return formInputDataForMessagesPlot(validSortedGraphDataPoints, false).then((output) => {
            expect(output).to.deep.equal({
                xAxis: ["3-2018", "3-2019"],
                yAxisSentMessages: [10, 12],
                yAxisReceivedMessages: [1, 1]
            });
        });
    });

});