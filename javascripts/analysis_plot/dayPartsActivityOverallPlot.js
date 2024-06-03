const _ = require("lodash");
const {isMobile} = require("../utils");


function dayPartsActivityOverallPlot(dataSent, dataReceived, plotId) {

    const FIRST = "00:00-05:59"
    const SECOND = "06:00-11:59"
    const THIRD = "12:00-17:59"
    const FOURTH = "18:00-23:59"

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const xAxis = plotContainer.attr("data-x-axis");
    const yAxis = plotContainer.attr("data-y-axis");
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
            title: yAxis,
            fixedrange: true
        },
        xaxis: {
            title: xAxis,
            fixedrange: true
        },
        hovermode: 'x',
    }

    if (!isMobile()) {
        layout["height"] = 600
    }



    let dataSentOverall = dataSent.flat()
    let dataReceivedOverall = dataReceived.flat()



    // mean here is misleading - its just getting the percentages!
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
            dayPartsMeans.push(dayParts[key])
            totalOfMeans += dayParts[key]
        })

        for (let i = 0; i < dayPartsMeans.length; i++) {
            dayPartsMeansInPercent.push(dayPartsMeans[i] / totalOfMeans)
        }

        return dayPartsMeansInPercent
    }


    let yValuesSent = meansForDayParts(dataSentOverall)
    let yValuesReceived = meansForDayParts(dataReceivedOverall)
    // find globalMax on the way, so that range can be set accordingly later
    let globalMax = Math.max(...yValuesReceived.concat(yValuesSent))

    layout["yaxis"] = {
        range: [0, globalMax],
        color: "black",
        tickformat: "p",
        hoverformat: ".2%",
        title: yAxis,
        fixedrange: true,
    }


    let x = [FIRST, SECOND, THIRD, FOURTH]


    plotContainer.html("");
    Plotly.newPlot(plotId, [
        {
            name: sent,
            x: x,
            y: yValuesSent,
            type: "bar",
            width: _.fill(Array(4), 0.8)
        },
        {
            name: received,
            x: x,
            y: yValuesReceived,
            type: "bar",
            width: _.fill(Array(4), 0.5)
        }
    ], layout, config)







}

module.exports = dayPartsActivityOverallPlot;

