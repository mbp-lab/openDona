const sortGraphDataPoints = require('./utils/sortGraphDataPointsTimeWise');
const formInputDataForMessagesPlot = require('./utils/formInputDataForMessagesPlot');

function sentReceived(data, plotId) {

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const xAxis = plotContainer.attr("data-x-axis");
    const yAxis = plotContainer.attr("data-y-axis");
    const sent = plotContainer.attr("data-sent-trace-name");
    const received = plotContainer.attr("data-received-trace-name");

    let config = {
        responsive: true,
        modeBarButtonsToRemove: [
            "select2d",
            "lasso2d",
            "hoverClosestCartesian",
            "hoverCompareCartesian",
            "toImage"
        ],
        modeBarButtonsToAdd: [{
            name: "Download (.svg)",
            icon: Plotly.Icons.camera,
            click: (im) => {
                Plotly.downloadImage(im, {format: "svg"})
            }
        },
            {
                name: "Download (.png)",
                icon: Plotly.Icons.camera,
                click: (im) => {
                    Plotly.downloadImage(im, {format: "png"})
                }
            }],
        displaylogo: false
    }


    const layout = {
        autosize: true,
        legend: {
            x: -.1,
            y: 1.2
        },
        xaxis: {
            title: xAxis,
            tickangle: 45,
        },
        yaxis: {
            title: yAxis
        },
    };

    sortGraphDataPoints(data, false, false)
        .then((sortedDataPoints) => {
            return formInputDataForMessagesPlot(sortedDataPoints, false);
        })
        .then((plotInputData) => {
            const sentMessagesTrace = {
                x: plotInputData.xAxis,
                y: plotInputData.yAxisSentMessages,
                mode: 'lines+markers',
                name: sent,
                marker: {size: 12}
            };

            const receivedMessagesTrace = {
                x: plotInputData.xAxis,
                y: plotInputData.yAxisReceivedMessages,
                mode: 'lines+markers',
                name: received,
                marker: {size: 12}
            };

            const data = [sentMessagesTrace, receivedMessagesTrace];
            plotContainer.html("");
            Plotly.newPlot(plotId, data, layout, config);

        })
        .catch((err) => console.log(err));
}

module.exports = sentReceived;