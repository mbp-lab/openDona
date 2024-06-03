const _ = require("lodash");
const {isMobile} = require("../utils");


function responseTimeBarChart(responseTimes, plotId, isOnlyOneOrLessConv) {

    const FIRST = "< 1 min"
    const SECOND = "1-2 min"
    const THIRD = "3-5 min"
    const FOURTH = "6-15 min"
    const FIFTH = "16-30 min"
    const SIXTH = "31-60 min"
    const SEVENTH = "> 60 min"

    const ONEMINUTEINMS = 60000;
    const THREEINMS = 3 * ONEMINUTEINMS;
    const SIXINMS = 6 * ONEMINUTEINMS;
    const SIXTEENINMS = 16 * ONEMINUTEINMS;
    const THIRTYONEINMS = 31 * ONEMINUTEINMS;
    const SIXTYINMS = 60 * ONEMINUTEINMS;

    let inRange = (timeInMS) => {

        if (timeInMS < ONEMINUTEINMS)
            return 0
        else if (timeInMS < THREEINMS)
            return 1
        else if (timeInMS < SIXINMS)
            return 2
        else if (timeInMS < SIXTEENINMS)
            return 3
        else if (timeInMS < THIRTYONEINMS)
            return 4
        else if (timeInMS <= SIXTYINMS)
            return 5
        else
            return 6

    }

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const xAxis = plotContainer.attr("data-x-axis");
    const yAxis = plotContainer.attr("data-y-axis");
    const legendDonor = plotContainer.attr("data-legend-donor");
    const legendFriends = plotContainer.attr("data-legend-friends");

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
        hovermode: 'x',
        xaxis:{
            title: xAxis,
            fixedrange: true
        }
    }

    if (!isMobile()) {
        layout["height"] = 600
    }


    let groupedByIsDonor = _.groupBy(responseTimes, (responseTime) => {
        return responseTime.isDonor;
    })


    let countObjectDonor = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
    }

    let countObjectFriends = {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0
    }


    let time;
    groupedByIsDonor.true.forEach((responseTime) => {
        time = responseTime.timeInMs
        countObjectDonor[inRange(time)] += 1;
    })

    groupedByIsDonor.false.forEach((responseTime) => {
        time = responseTime.timeInMs
        countObjectFriends[inRange(time)] += 1;
    })

    let nResponsesDonor = groupedByIsDonor.true.length
    let nResponsesFriends = groupedByIsDonor.false.length

    let yDonor = _.fill(Array(Object.keys(countObjectDonor).length), 0)
    let yFriends = _.fill(Array(Object.keys(countObjectFriends).length), 0)

    for (const [key, value] of Object.entries(countObjectDonor)) {
        yDonor[key] = value / nResponsesDonor
    }

    for (const [key, value] of Object.entries(countObjectFriends)) {
        yFriends[key] = value / nResponsesFriends
    }


    let max = Math.max(...yFriends.concat(yDonor))


    layout["yaxis"] = {
        range: [0, max],
        color: "black",
        tickformat: "p",
        hoverformat: ".2%",
        title: yAxis,
        fixedrange: true
    }


    let x = [FIRST, SECOND, THIRD, FOURTH, FIFTH, SIXTH, SEVENTH]


    plotContainer.html("");

    if (isOnlyOneOrLessConv) {
        Plotly.newPlot(plotId, [
            {
                name: legendDonor,
                x: x,
                y: yDonor,
                type: "bar",
                marker: {
                    //color: "#60BDFF"
                },
                width: _.fill(Array(x.length), 0.8)
            }
        ], layout, config)
    } else {
        Plotly.newPlot(plotId, [
            {
                name: legendDonor,
                x: x,
                y: yDonor,
                type: "bar",
                marker: {
                    //color: "#60BDFF"
                },
                width: _.fill(Array(x.length), 0.8)
            },
            {
                name: legendFriends,
                x: x,
                y: yFriends,
                type: "bar",
                marker: {
                    //color: "#FF8800",
                },
                width: _.fill(Array(x.length), 0.5)
            }
        ], layout, config)
    }


}

module.exports = responseTimeBarChart;

