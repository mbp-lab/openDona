const formInputDataForDailyActivityPlot = require("./utils/formInputDataForDailyActivityPlot");
const zScoreCalc = require("./utils/zScoreCalcDailyActivity");
const {isMobile} = require("../utils");


function dailyActivityTimes(dataSent, dataReceived, listOfConversations, plotId) {


    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const yAxis = plotContainer.attr("data-y-axis");
    const colorscaleMoreThanAverage = plotContainer.attr("data-colorscale-moreThanAverage");
    const colorscaleAverage = plotContainer.attr("data-colorscale-average");
    const colorscaleLessThanAverage = plotContainer.attr("data-colorscale-lessThanAverage");
    const dataOverallName = plotContainer.attr("data-overall")
    const resetView = plotContainer.attr("data-reset-view");

    let config = {
        responsive: true,
        modeBarButtonsToRemove: [
            "select2d",
            "lasso2d",
            "hoverClosestCartesian",
            "hoverCompareCartesian",
            "toggleSpikelines",
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
        hovermode: "closest",
        autosize: true,
        //height: 550,
        legend: {
            x: 1.01,
            y: 1.16,
        },
        xaxis: {
            tickangle: 45,
            tickformat: '%d-%m-%Y',
            showgrid: true,
        },
        yaxis: {
            title: yAxis,
            fixedrange: true,
            // 2022-05-21 is hard coded, because it doesn't work as nicely with just hour:minute
            range: ['2022-05-21 00:00:00', '2022-05-21 23:59:59'],
            tickformat: '%H:%M',
            nticks: 12,
            showgrid: true,
        },
    };

    if (!isMobile()) {
        layout["height"] = 550
    }

    let displayOptions = [dataOverallName]
    displayOptions = displayOptions.concat(listOfConversations)


    let zScoreLimit = 1.39

    let makeTraces = () => {

        let allDataOptionsSent = [dataSent.flat(), ...dataSent]
        //let allDataOptionsReceived = [dataReceived.flat(), ...dataReceived]

        // initialize updatemenus
        layout["updatemenus"] = [
            {
                active: 0,
                buttons: [],
                pad: {'r': 10, 't': 10},
                x: 0.05,
                xanchor: 'left',
                y: 1.25,
                yanchor: 'top'
            },
            {
                x: 1.3,
                y: 1.15,
                direction: 'left',
                type: 'buttons',
                showactive: false,
                pad: {t: 0, r: 10},
                buttons: [
                    {
                        method: "relayout",
                        args: [
                            {
                                'xaxis.autorange': true,
                            }
                        ],
                        label: resetView
                    }
                ]
            },
        ]


        let traces = []
        for (let i = 0; i < allDataOptionsSent.length; i++) {

            //make visibility true/false array for this button option
            let visibilityBooleans = []
            for (let j = 0; j < allDataOptionsSent.length; j++) {
                if (j === i) {
                    visibilityBooleans.push(true)
                } else {
                    visibilityBooleans.push(false)
                }
            }
            /* // this can be used if there are more than one trace per updatemenu - instead of the method above
            let numberTracesEach = 2
            for (let j = 0; j < allDataOptionsSent.length * numberTracesEach; j++) {
                if (j >= numberTracesEach * i && j < numberTracesEach * (i + 1)) {
                    visibilityBooleans.push(true)
                    visibilityBooleans.push("legendonly")
                    j++;
                } else {
                    visibilityBooleans.push(false)
                }
            }

             */

            // add menu for this conversation
            layout["updatemenus"][0]["buttons"].push({
                method: 'restyle',
                args: ['visible', visibilityBooleans],
                label: displayOptions[i]
            })

            let dataToShowSent = allDataOptionsSent[i]
            //let dataToShowReceived = allDataOptionsReceived[i]

            // get correct format
            let plotInputDataSent = formInputDataForDailyActivityPlot(dataToShowSent)
            //let plotInputDataReceived = formInputDataForDailyActivityPlot(sortedDataReceived)

            const traceSent = {
                x: plotInputDataSent.xAxis,
                y: plotInputDataSent.yAxis,
                type: 'scattergl',
                mode: 'markers',
                name: "",
                marker: {
                    size: 18,
                    autocolorscale: false,
                    cmin: -zScoreLimit,
                    cmax: zScoreLimit,
                    color: zScoreCalc(plotInputDataSent.wordCount, zScoreLimit),
                    colorscale: [ // colorscale need to be those ten values.. then they get stretched to cmin, cmax
                        ['0.0', '#f7fbff'],
                        ['0.111111111111', '#deebf7'],
                        ['0.222222222222', '#c6dbef'],
                        ['0.333333333333', '#9ecae1'],
                        ['0.444444444444', '#6baed6'],
                        ['0.555555555556', '#6baed6'],
                        ['0.666666666667', '#4292c6'],
                        ['0.777777777778', '#2171b5'],
                        ['0.888888888889', '#08519c'],
                        ['1.0', '#08306b']
                    ],
                    symbol: "square",
                    colorbar: {
                        tickvals: [-zScoreLimit, 0, zScoreLimit],
                        ticktext: [colorscaleLessThanAverage, colorscaleAverage, colorscaleMoreThanAverage],
                        tickangle: 30
                    }
                },
                visible: i === 0
            };


            // this is all for received traces, not using it right now
            /*
            // determine if received trace should be visible: legendonly or false
            let visibleReceived = () => {
                if (i === 0) {
                    return "legendonly"
                } else {
                    return false
                }
            }

            const traceReceived = {
                x: plotInputDataReceived.xAxis,
                y: plotInputDataReceived.yAxis,
                type: 'scattergl',
                mode: 'markers',
                name: received,
                marker: {
                    size: 14,
                    color: transformToZScores(plotInputDataReceived.wordCount),
                    autocolorscale: false,
                    cmin: -zScoreLimit,
                    cmax: zScoreLimit,
                    colorscale: [ // colorscale need to be those ten values.. then they get stretched to cmin, cmax
                        ['0.0', '#2c7fb8'],
                        ['0.111111111111', '#2db4cd'],
                        ['0.222222222222', '#39d7c8'],
                        ['0.333333333333', '#48ddaa'],
                        ['0.444444444444', '#59e391'],
                        ['0.555555555556', '#69e87d'],
                        ['0.666666666667', '#85ed7a'],
                        ['0.777777777778', '#aff18c'],
                        ['0.888888888889', '#d2f59e'],
                        ['1.0', '#edf8b1']
                    ],
                    symbol: "square",
                    colorbar: {}
                },
                visible: visibleReceived()
            }

            traces.push(traceSent, traceReceived)

             */
            traces.push(traceSent)

        }
        return traces;
    }

    let resultTraces = makeTraces();

    plotContainer.html("");
    Plotly.newPlot(plotId, resultTraces, layout, config);


}

module.exports = dailyActivityTimes;

