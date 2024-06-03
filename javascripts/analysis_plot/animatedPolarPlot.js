const sortGraphDataPoints = require('./utils/sortGraphDataPointsTimeWise');
const _ = require("lodash");
const zScoreCalc = require("./utils/zScoreCalcPolarPlot");
const sortYearMonthKeys = require("./utils/sortYearMonthKeys");
const {isMobile} = require("../utils");

function animatedPolarPlot(dataMonthlyPerConversation, listOfConversations, plotId) {

    let zScoreLimit = 1.96

    zScoreCalc(dataMonthlyPerConversation, zScoreLimit)

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const legendDonor = plotContainer.attr("data-legend-donor");
    const legendOthers = plotContainer.attr("data-legend-others");
    const yearMonth = plotContainer.attr("data-description-yearMonth");
    const resetView = plotContainer.attr("data-reset-view");

    let config = {
        responsive: true,
        modeBarButtonsToRemove: [
            "zoom2d",
            "select2d",
            "lasso2d",
            "toggleHover",
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
        //height: 550,
        hovermode: false,
        showlegend: true,
        legend: {
            bgcolor: "#13223C",
            font: {color: "white"},
            x: 0.9,
            y: 1.2,
        },
        xaxis: {
            fixedrange: true
        },
        yaxis: {
            fixedrange: true
        },
        polar: {
            bgcolor: "rgba(255, 255, 255, 0)",
            radialaxis: {
                color: "#C3C3C3",
                showline: false,
                showgrid: false,
                showticklabels: false,
                ticks: "",
            },
            angularaxis: {
                rotation: 15,
                color: "white",
                layer: "below traces",
                showgrid: false,
                gridcolor: "#f5f5f5",
                gridwidth: 0.1,
                griddash: 'dash',
            }
        },
        images: [
            {
                source: backGroundImages["polarBackground"],
                xref: "paper",
                yref: "paper",
                x: 0.5,
                y: 0.5,
                sizex: 1.5,
                sizey: 1.5,
                xanchor: "center",
                yanchor: "middle",
                sizing: "fill",
                opacity: 1,
                layer: "below"
            }
        ],
        updatemenus: [
            {
                x: 0.1,
                y: 1.2,
                showactive: false,
                direction: 'left',
                type: 'buttons',
                pad: {t: 0, r: 10},
                buttons: [
                    {
                        method: "relayout",
                        args: [
                            {
                                'polar.radialaxis.range': [zScoreLimit + zScoreLimit * 0.5, -zScoreLimit]
                            }
                        ],
                        label: resetView
                    }
                ]
            },
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
                                frame: {duration: 300, redraw: true}
                            }
                        ],
                        label: "Start"
                    },
                    {
                        method: 'animate',
                        args: [[null], {
                            mode: 'immediate',
                            transition: {duration: 0},
                            frame: {duration: 0, redraw: true}
                        }],
                        label: 'Pause'
                    }
                ]
            }
        ]
    }

    if (!isMobile()) {
        layout["height"] = 550
    }

    // only needed to start the animation when the plot is loaded
    let startAnimation = (groupOrFrames, mode) => {

        Plotly.animate(plotId, groupOrFrames, {
            transition: {
                duration: 300,
                easing: 'linear'
            },
            frame: {
                duration: 300,
                redraw: true,
            },
            mode: mode
        });

    }


    // things needed for animation:
    let frames = []
    let sliderSteps = []
    let initialR = []
    let name;



    sortGraphDataPoints(dataMonthlyPerConversation, false, false)
        .then(sortedData => {

            // add conversation property to each object, so that later all data can be handled flattened
            for (let i = 0; i < sortedData.length; i++) {
                sortedData[i].forEach(obj => {
                    obj["conversation"] = listOfConversations[i]
                })
            }

            // group by year and month for animation over that time
            let groupedData = _.groupBy(sortedData.flat(), (obj) => {
                return obj.year + "-" + obj.month
            })

            //let traceOfRReceived = []
            //let traceOfThetaReceived = []
            let traceOfRTotal = []
            let traceOfThetaTotal = []

            let zeroBools = {}
            listOfConversations.forEach((conv) => zeroBools[conv.toString()] = false)

            // get keys, sort them and then loop over the sorted keys to create all frames and sliderSteps
            let keys = Object.keys(groupedData)
            let sortedKeys = sortYearMonthKeys(keys)

            // create a frame and slideStep for each year-month
            let value = []
            sortedKeys.forEach((key) => {


                value = groupedData[key]
                // key is year-month -> that is what will be displayed on the timeline
                name = key;


                //let rValuesSent = []
                let rValuesTotal = []
                let thetaValues = []

                //let rValuesReceivedCount = []

                // get the data for each conversation in value -> value are all the data objects for this year-month
                let helper;

                listOfConversations.forEach((conv) => {
                    helper = value.find(obj => obj.conversation === conv)
                    if (helper !== undefined) {
                        //rValuesSent.push(Math.sqrt(helper.sentCount))
                        //rValuesReceivedCount.push(Math.sqrt(helper.receivedCount))
                        //rValuesTotal.push(Math.log(helper.receivedCount + helper.sentCount))
                        rValuesTotal.push(helper.zScore)


                        // only add to trace if it wasnt undefined
                        //traceOfRReceived.push(Math.sqrt(helper.receivedCount))
                        //traceOfThetaReceived.push(conv)
                        //traceOfRTotal.push(Math.log(helper.receivedCount + helper.sentCount))
                        traceOfRTotal.push(helper.zScore)
                        traceOfThetaTotal.push(conv)
                    } else {
                        //rValuesSent.push(0)
                        //rValuesReceivedCount.push(0)
                        //rValuesTotal.push(0)
                        rValuesTotal.push(-zScoreLimit)

                        if (!zeroBools[conv.toString()]) {
                            traceOfRTotal.push(-zScoreLimit)
                            traceOfThetaTotal.push(conv)
                            zeroBools[conv.toString()] = true;
                        }
                    }
                    thetaValues.push(conv)
                })


                frames.push({
                    name: name,
                    data: [
                        /*
                        {
                            name: "Sent",
                            r: rValues,
                            theta: thetaValues,
                        },

                         */
                        {
                            name: legendOthers,
                            //r: rValuesReceivedCount,
                            r: rValuesTotal,
                            theta: thetaValues,
                        },
                        {},
                        {
                            name: "traces of " + legendOthers,
                            //r: [...traceOfRReceived],
                            //theta: [...traceOfThetaReceived]
                            r: [...traceOfRTotal],
                            theta: [...traceOfThetaTotal]
                        }
                    ],
                })

                sliderSteps.push({
                    method: 'animate',
                    label: name,
                    args: [[name], {
                        mode: "immediate",
                        transition: {duration: 300},
                        frame: {duration: 300, redraw: true}
                    }]
                })

            })


            listOfConversations.forEach(() => initialR.push(0))

            /*
            const traceSentInitial = {
                name: "Sent",
                type: "scatterpolar",
                mode: "markers",
                r: initialR,
                theta: listOfConversations,
                marker: {
                    color: 'white',
                    size: 18,
                },
                line: {
                    color: 'white',
                }
            }

            const traceReceivedInitial = {
                name: "Chat Closeness",
                type: "scatterpolar",
                mode: "markers",
                r: initialR,
                theta: listOfConversations,
                marker: {
                    color: 'white',
                    size: 18,
                },
                line: {
                    color: 'white',
                },
                //visible: "legendonly"
            }

             */

            const traceTotalInitial = {
                name: legendOthers,
                type: "scatterpolar",
                mode: "markers",
                r: initialR,
                theta: listOfConversations,
                marker: {
                    color: 'white',
                    size: 18,
                },
                line: {
                    color: 'white',
                },
                //visible: "legendonly"
            }



            //let traces = [traceSentInitial, traceReceivedInitial]
            //let traces = [traceReceivedInitial]
            let traces = [traceTotalInitial]

            traces.push({
                name: legendDonor,
                type: "scatterpolar",
                mode: "markers",
                r: [zScoreLimit + zScoreLimit * 0.5],
                theta: [listOfConversations[0]],
                marker: {
                    color: 'yellow',
                    size: 32,
                    opacity: 0.9
                },
            })

            traces.push(
                {
                    name: "traces of " + legendOthers,
                    type: "scatterpolar",
                    mode: "markers",
                    r: initialR,
                    theta: listOfConversations,
                    marker: {
                        color: 'white',
                        size: 10,
                        opacity: 0.1
                    },
                    showlegend: false
                }
            )

            layout.polar.radialaxis.range = [zScoreLimit + zScoreLimit * 0.5, -zScoreLimit]


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
            Plotly.newPlot(plotId, {data: traces, layout: layout, frames: frames, config: config},).then(() => {
                startAnimation(null, 'afterall')
            });

        })

}

module.exports = animatedPolarPlot;

