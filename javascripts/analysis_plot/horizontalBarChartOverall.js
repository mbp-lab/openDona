const {isMobile} = require("../utils");

function horizontalBarChartOverall(sentWordsTotal, receivedWordsTotal, plotId) {

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const xAxis = plotContainer.attr("data-x-axis");
    const yAxisReceived = plotContainer.attr("data-y-axis-received");
    const yAxisSent = plotContainer.attr("data-y-axis-sent");
    const sent = plotContainer.attr("data-sent-trace-name");
    const received = plotContainer.attr("data-received-trace-name");

    let config = {
        responsive: true,
        modeBarButtonsToRemove: [
            "zoomIn2d",
            "zoomOut2d",
            "pan2d",
            "zoom2d",
            "select2d",
            "lasso2d",
            "hoverClosestCartesian",
            "hoverCompareCartesian",
            "toggleSpikelines",
            "autoScale2d",
            "resetScale2d",
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

    let layout = {
        //height: 600,
        showlegend: true,
        barmode: 'overlay',
        legend: {
            x: -.1,
            y: 1.2
        },
        yaxis: {
            automargin: true,
            color: "black",
            fixedrange: true
        },
        hovermode: 'closest',
    }

    if (!isMobile()) {
        layout["height"] = 600
    }


    layout["xaxis"] = {
        //range: [0, maxForRange],
        color: "black",
        title: {
            text: xAxis
        },
        fixedrange: true,
        tickformat: 'r',
    }


    plotContainer.html("");
    Plotly.newPlot(plotId, [
        {
            name: sent,
            x: [sentWordsTotal],
            y: [yAxisSent],
            type: "bar",
            orientation: 'h',
        },
        {
            name: received,
            x: [receivedWordsTotal],
            y: [yAxisReceived],
            type: "bar",
            orientation: 'h',
        }
    ], layout, config)


}

module.exports = horizontalBarChartOverall;

