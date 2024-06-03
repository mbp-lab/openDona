const sortGraphDataPointsSync = require("./utils/sortGraphDataPointsSync");
const _ = require("lodash");
const sortYearMonthKeys = require("./utils/sortYearMonthKeys");
const {isMobile} = require("../utils");


function animatedDayPartsActivityPlot(dataSent, dataReceived, plotId) {

    // dataReceived is not being used - everything using dataReceived is commented out

    const FIRST = "00:00-05:59"
    const SECOND = "06:00-11:59"
    const THIRD = "12:00-17:59"
    const FOURTH = "18:00-23:59"

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const xAxis = plotContainer.attr("data-x-axis");
    const yAxis = plotContainer.attr("data-y-axis");
    const sent = plotContainer.attr("data-sent-trace-name");
    //const received = plotContainer.attr("data-received-trace-name");
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
        //height: 700,
        showlegend: true,
        barmode: 'overlay',
        legend: {
            x: -.1,
            y: 1.2
        },
        yaxis: {
            automargin: true,
            color: "black",
            title: yAxis,
            fixedrange: true,
        },
        xaxis: {
            title: xAxis,
            fixedrange: true
        },
        hovermode: 'x',
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
        layout["height"] = 700
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

    let dataSentOverall = dataSent.flat()
    //let dataReceivedOverall = dataReceived.flat()

    // make sure its sorted (maybe not necessary)
    let sortedDataSent = sortGraphDataPointsSync(dataSentOverall)
    //let sortedDataReceived = sortGraphDataPointsSync(dataReceivedOverall)

    let groupedSentData = _.groupBy(sortedDataSent, (obj) => {
        return obj.year + "-" + obj.month
    })

    /*
    let groupedReceivedData = _.groupBy(sortedDataReceived, (obj) => {
        return obj.year + "-" + obj.month
    })

     */


    // gets mean for each day part of the given data (many days)
    let meansForDayParts = (data) => {
        // maybe make actual objects out of each day part...
        let dayParts = {
            FIRST: 0,
            SECOND: 0,
            THIRD: 0,
            FOURTH: 0,
        }

        let dayCounter = 0
        let dateBefore = 0

        data.forEach((obj) => {
            let dateObj = new Date(obj.epochSeconds * 1000)

            let date = dateObj.getDate()
            if (date !== dateBefore) {
                dayCounter++;
                dateBefore = date;
            }

            let hour = dateObj.getHours()
            if (hour >= 0 && hour <= 5) {
                dayParts.FIRST += obj.wordCount
            } else if (hour >= 6 && hour <= 11) {
                dayParts.SECOND += obj.wordCount
            } else if (hour >= 12 && hour <= 17) {
                dayParts.THIRD += obj.wordCount
            } else if (hour >= 18 && hour <= 23) {
                dayParts.FOURTH += obj.wordCount
            }
        })


        let dayPartsMeans = []
        let dayPartsMeansInPercent = []
        let totalOfMeans = 0
        Object.keys(dayParts).map((key) => {
            dayPartsMeans.push(dayParts[key] / dayCounter)
            totalOfMeans += dayParts[key] / dayCounter
        })

        for (let i = 0; i < dayPartsMeans.length; i++) {
            dayPartsMeansInPercent.push(dayPartsMeans[i] / totalOfMeans)
        }

        return dayPartsMeansInPercent
    }


    // find globalMax on the way, so that range can be set accordingly later
    let globalMax = 0;

    let monthlySentMeans = {}

    // key is year-month, values are the objects for that month, with epoch seconds timestamp and wordcount
    for (const [key, value] of Object.entries(groupedSentData)) {

        if (monthlySentMeans[key] === undefined) {
            monthlySentMeans[key] = []
        }
        let meansPercent = meansForDayParts(value)

        meansPercent.forEach((mean) => {
            if (mean > globalMax) {
                globalMax = mean;
            }
        })
        monthlySentMeans[key] = meansPercent

    }

    /*
    let monthlyReceivedMeans = {}
    for (const [key, value] of Object.entries(groupedReceivedData)) {

        if (monthlyReceivedMeans[key] === undefined) {
            monthlyReceivedMeans[key] = []
        }
        let meansPercent = meansForDayParts(value)
        meansPercent.forEach((mean) => {
            if (mean > globalMax) {
                globalMax = mean;
            }
        })
        monthlyReceivedMeans[key] = meansPercent

    }

     */


    // now create frames and slidersteps
    let frames = []
    let sliderSteps = []

    // get keys, sort them and then loop over the sorted keys to create all frames and sliderSteps
    let keys = Object.keys(monthlySentMeans)
    let sortedKeys = sortYearMonthKeys(keys)

    // create a frame and slideStep for each year-month
    sortedKeys.forEach((key) => {


        let name = key
        let x = [FIRST, SECOND, THIRD, FOURTH]

        let ySent = monthlySentMeans[key]

        /*
        let yReceived = monthlyReceivedMeans[key]
        if (yReceived === undefined) {
            yReceived = [0,0,0,0]
        }

         */

        frames.push({
            name: name,
            data: [
                {
                    name: sent,
                    x: x,
                    y: ySent,
                    marker: {
                        //color: "#60BDFF"
                    },
                    width: _.fill(Array(4), 0.8)
                }
                /*,
                {
                    name: received,
                    x: x,
                    y: yReceived,
                    marker: {
                        //color: "#FF8800",
                    },
                    width: _.fill(Array(4), 0.5)
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

    layout["yaxis"] = {
        range: [0, globalMax],
        color: "black",
        tickformat: "p",
        hoverformat: ".2%",
        title: yAxis,
        fixedrange: true
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


    let x = [FIRST, SECOND, THIRD, FOURTH]
    let initialY = [0,0,0,0]


    plotContainer.html("");
    Plotly.newPlot(plotId, [
        {
            name: sent,
            x: x,
            y: initialY,
            type: "bar",
            marker: {
                //color: "#60BDFF"
            },
            width: _.fill(Array(4), 0.8)
        }
        /*,
        {
            name: received,
            x: x,
            y: initialY,
            type: "bar",
            marker: {
                //color: "#FF8800",
            },
            width: _.fill(Array(4), 0.5)
        }

         */
    ], layout, config).then(() => {
        Plotly.addFrames(plotId, frames)

        startAnimation(null, 'afterall')
    });
    

}

module.exports = animatedDayPartsActivityPlot;

