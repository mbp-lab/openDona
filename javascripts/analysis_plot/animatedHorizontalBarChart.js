const sortGraphDataPoints = require('./utils/sortGraphDataPointsTimeWise');
const _ = require("lodash");
const sortYearMonthKeys = require("./utils/sortYearMonthKeys");
const {isMobile} = require("../utils");

function animatedHorizontalBarChart(sentReceivedPerConversation, listOfConversations, plotId) {

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const xAxis = plotContainer.attr("data-x-axis");
    const sent = plotContainer.attr("data-sent-trace-name");
    const yearMonth = plotContainer.attr("data-description-yearMonth");

    let config = {
        responsive: true,
        modeBarButtonsToRemove: [
            "zoom2d",
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
            fixedrange: true,
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
    let xSent = []
    let ySent = []
    //let xReceived = []
    //let yReceived = []
    let initialX = []

    let conversationSentObj = {}
    //let conversationReceivedObj = {}


    listOfConversations.forEach((conv) => {
        conversationSentObj[conv] = 0
        //conversationReceivedObj[conv] = 0
        initialX.push(0)
    })

    // create one array with all data from all conversations and add the conversations name to the data objects on the way
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
                    conversationSentObj[sentReceivedObj.conversation] = conversationSentObj[sentReceivedObj.conversation] + sentReceivedObj.sentCount
                    //conversationReceivedObj[sentReceivedObj.conversation] = conversationReceivedObj[sentReceivedObj.conversation] + sentReceivedObj.receivedCount
                })

                name = key

                xSent = []
                ySent = []
                for (const [key, value] of Object.entries(conversationSentObj)) {
                    xSent.push(value)
                    ySent.push(key)
                }

                /*
                xReceived = []
                yReceived = []
                for (const [key, value] of Object.entries(conversationReceivedObj)) {
                    xReceived.push(value)
                    yReceived.push(key)
                }

                 */

                frames.push({
                    name: name,
                    data: [
                        {
                            name: sent,
                            x: xSent,
                            y: ySent,
                            marker: {
                                //color: "#60BDFF"
                            },
                            width: _.fill(Array(listOfConversations.length), 0.8)
                        },
                        /*
                        {
                            name: "Received words",
                            x: xReceived,
                            y: yReceived,
                            marker: {
                                //color: "#FF8800",
                            },
                            width: _.fill(Array(listOfConversations.length), 0.3)
                        }

                         */
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
            let maxForRange = Math.max(...Object.values(conversationSentObj))
            /*
            let maxReceived = Math.max(...Object.values(conversationReceivedObj))
            if (maxForRange < maxReceived) {
                maxForRange = maxReceived
            }
             */

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
                    x: initialX,
                    y: listOfConversations,
                    type: "bar",
                    orientation: 'h',
                    marker: {
                        //color: "#60BDFF",
                    },
                    width: _.fill(Array(listOfConversations.length), 0.8)
                },
                /*
                {
                    name: "Received words",
                    x: initialX,
                    y: listOfConversations,
                    type: "bar",
                    orientation: 'h',
                    marker: {
                        //color: "#FF8800",
                    },
                    width: _.fill(Array(listOfConversations.length), 0.3)
                }

                 */
            ], layout, config).then(() => {
                Plotly.addFrames(plotId, frames)

                startAnimation(null, 'afterall')
            });

        })



}

module.exports = animatedHorizontalBarChart;

