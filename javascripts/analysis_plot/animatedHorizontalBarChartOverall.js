const sortGraphDataPoints = require('./utils/sortGraphDataPointsTimeWise');
const _ = require("lodash");
const sortYearMonthKeys = require("./utils/sortYearMonthKeys");
const {isMobile} = require("../utils");

function animatedHorizontalBarChart(sentReceivedPerConversation, listOfConversations, plotId) {

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const xAxis = plotContainer.attr("data-x-axis");
    const yAxisReceived = plotContainer.attr("data-y-axis-received");
    const yAxisSent = plotContainer.attr("data-y-axis-sent");
    const sent = plotContainer.attr("data-sent-trace-name");
    const received = plotContainer.attr("data-received-trace-name");
    const yearMonth = plotContainer.attr("data-description-yearMonth");

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
        updatemenus: [
            {
                x: 0,
                y: 0,
                yanchor: 'top',
                xanchor: 'left',
                showactive: false,
                direction: 'left',
                type: 'buttons',
                pad: {t: 127, r: 10},
                buttons: [
                    {
                        method: "animate",
                        args: [
                            null,
                            {
                                mode: 'immediate',
                                fromcurrent: true,
                                transition: {duration: 300, easing: 'linear'},
                                frame: {duration: 300, redraw: false}
                            }
                        ],
                        label: "Start"
                    },
                    {
                        method: 'animate',
                        args: [[null], {
                            mode: 'immediate',
                            transition: {duration: 0},
                            frame: {duration: 0, redraw: false}
                        }],
                        label: 'Pause'
                    }
                ]
            }
        ]
    }
    if (!isMobile()) {
        layout["height"] = 600
    }


    let startAnimation = (groupOrFrames, mode) => {
        Plotly.animate(plotId, groupOrFrames, {
            transition: {
                duration: 300,
                easing: 'linear'
            },
            frame: {
                duration: 300,
                redraw: false,
            },
            mode: mode
        });
    }


    let frames = []
    let sliderSteps = []
    let name;
    let sentCount = 0
    let receivedCount = 0


    let flattenedSentReceived = sentReceivedPerConversation.map((array, i) => {
        array.forEach(obj => {
            obj["conversation"] = listOfConversations[i]
            return obj;
        })
        return array;
    })


    sortGraphDataPoints(flattenedSentReceived.flat(), false, false)
        .then(sortedData => {
            return _.groupBy(sortedData, (obj) => {
                return obj.year + "-" + obj.month
            })
        })
        .then(groupedData => {
            // get keys, sort them and then loop over the sorted keys to create all frames and sliderSteps
            let keys = Object.keys(groupedData)
            let sortedKeys = sortYearMonthKeys(keys)

            // create a frame and slideStep for each year-month
            sortedKeys.forEach((key) => {

                groupedData[key].forEach((sentReceivedObj) => {
                    sentCount += sentReceivedObj.sentCount
                    receivedCount += sentReceivedObj.receivedCount
                })

                name = key

                frames.push({
                    name: name,
                    data: [
                        {
                            name: sent,
                            x: [sentCount],
                            y: [yAxisSent],
                            marker: {
                                //color: "#60BDFF"
                            },
                        },
                        {
                            name: received,
                            x: [receivedCount],
                            y: [yAxisReceived],
                            marker: {
                                //color: "#FF8800",
                            },
                        }
                    ],
                })

                sliderSteps.push({
                    method: 'animate',
                    label: name,
                    args: [[name], {
                        mode: "immediate",
                        transition: {duration: 300},
                        frame: {duration: 300, redraw: false}
                    }]
                })
            })


            // find max for range, so that bars dont get cut off
            let maxForRange = sentCount

            if (maxForRange < receivedCount) {
                maxForRange = receivedCount
            }


            layout["xaxis"] = {
                range: [0, maxForRange],
                color: "black",
                title: {
                    text: xAxis
                },
                fixedrange: true,
                tickformat: 'r',
            }

            layout["sliders"] = [{
                pad: {l: 130, t: 95},
                currentvalue: {
                    visible: true,
                    prefix: yearMonth,
                    xanchor: 'right',
                    font: {size: 20, color: 'black'}
                },
                steps: sliderSteps
            }]

            plotContainer.html("");
            Plotly.newPlot(plotId, [
                {
                    name: sent,
                    x: [0],
                    y: [yAxisSent],
                    type: "bar",
                    orientation: 'h',
                },
                {
                    name: received,
                    x: [0],
                    y: [yAxisReceived],
                    type: "bar",
                    orientation: 'h',
                }
            ], layout, config).then(() => {
                Plotly.addFrames(plotId, frames)

                startAnimation(null, 'afterall')
            });

        })

}

module.exports = animatedHorizontalBarChart;

