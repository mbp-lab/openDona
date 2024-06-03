const formInputDataForWordsPlotSync = require("./utils/formInputDataForWordsPlotSync");
const _ = require('lodash');
const {isMobile} = require("../utils");


function sentReceivedDailyPerConversation(dataSlidingWindow, plotId, listOfConversations, slidingWindowMean) {

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const yAxis = plotContainer.attr("data-y-axis");
    const sent = plotContainer.attr("data-sent-trace-name");
    const received = plotContainer.attr("data-received-trace-name");
    const notShownReceived = plotContainer.attr("data-received-notShown-name");
    const dataOverallName = plotContainer.attr("data-overall")
    const resetView = plotContainer.attr("data-reset-view");

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
        hovermode: "x",
        xaxis: {
            tickangle: 45,
            tickformat: '%d-%m-%Y',
            showgrid: true,
            automargin: true,
        },
        yaxis: {
            title: yAxis,
            showgrid: true,
            tickformat: '.0f',
        },
        legend: {
            x: 0.03,
            y: 1.3,
        }
    };



    let displayOptions = [dataOverallName]
    displayOptions = displayOptions.concat(listOfConversations)


    // the dataSlidingWindow provides the sliding window means per conversation
    let dataPerConversation = dataSlidingWindow

    // generate the overall data with holes where the mean is only created by one conversation

    // create a list of mean values per day
    let aggregationValuesSent = dataSlidingWindow[0].map(obj => [obj.sentCount])
    let aggregationValuesReceived = dataSlidingWindow[0].map(obj => [obj.receivedCount])

    for (let i = 1; i < dataSlidingWindow.length; i++) {
        for (let j = 0; j < dataSlidingWindow[i].length; j++) {
            aggregationValuesSent[j].push(dataSlidingWindow[i][j].sentCount)
            aggregationValuesReceived[j].push(dataSlidingWindow[i][j].receivedCount)
        }
    }

    // filter out all zeros
    let filteredAggregatedReceived = []
    aggregationValuesReceived.forEach((values) => {
        filteredAggregatedReceived.push(values.filter(x => x !== 0))
    })

    let filteredAggregatedSent = []
    aggregationValuesSent.forEach((values) => {
        filteredAggregatedSent.push(values.filter(x => x !== 0))
    })

    // calculate overall means and keep track of values that are to be excluded
    let excludedTracker = []

    let meansOverallReceived = []
    let meansOverallSent = []

    filteredAggregatedReceived.forEach(values => {
        if (values.length === 1) {
            excludedTracker.push(true)
            meansOverallReceived.push(0)
        } else {
            meansOverallReceived.push(_.mean(values))
            excludedTracker.push(false)
        }
    })

    filteredAggregatedSent.forEach(values => {
        meansOverallSent.push(_.mean(values))
    })

    // deep clone for object structure - then set the sentCount and receivedCount to the overall mean values
    let dataOverall = _.cloneDeep(dataSlidingWindow[0])
    for (let i = 0; i < dataOverall.length; i++) {
        dataOverall[i].sentCount = meansOverallSent[i]
        dataOverall[i].receivedCount = meansOverallReceived[i]
    }


    // create traces from the data
    let makeTraces = () => {

        // combine all options (overall data and every single conversation)
        let allDataOptions = [dataOverall, ...dataPerConversation]


        // initialize updatemenus
        layout["updatemenus"] = [
            {
                active: 0,
                buttons: [],
                pad: {'r': 10, 't': 10},
                x: 0.03,
                xanchor: 'left',
                y: 1.60,
                yanchor: 'top'
            },
            {
                x: 1,
                y: 1.2,
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
        for (let i = 0; i < allDataOptions.length; i++) {

            //make visibility true/false array for this button option
            let visibilityBooleans = []


            let numberTracesEach = 2
            for (let j = 0; j < allDataOptions.length * numberTracesEach; j++) {
                if (j >= numberTracesEach * i && j < numberTracesEach * (i + 1)) {
                    visibilityBooleans.push(true)
                } else {
                    visibilityBooleans.push(false)
                }
            }



            // add menu for this conversation
            layout["updatemenus"][0]["buttons"].push({
                method: 'restyle',
                args: ['visible', visibilityBooleans],
                label: displayOptions[i]
            })

            let dataToShow = allDataOptions[i]



            // format data to needed format
            let plotInputData = formInputDataForWordsPlotSync(dataToShow, true)




            const sentMessagesTrace = {
                x: plotInputData.xAxisSent,
                y: plotInputData.yAxisSentMessages,
                mode: 'lines+markers',
                name: sent,
                marker: {size: 4}, //, color: "white"},
                visible: i === 0,
                showlegend: true,
            };


            const receivedMessagesTrace = {
                x: plotInputData.xAxisReceived,
                y: plotInputData.yAxisReceivedMessages,
                mode: 'lines+markers',
                name: received,
                marker: {size: 4}, //, color: "orange"},
                visible: i === 0,
                showlegend: true,
            };


            // if this is for the overall trace, then received should be added but without the excluded days
            // else dont really show the received trace, but still add it without any visible point for legend entry
            if (i === 0) {
                receivedMessagesTrace.x = receivedMessagesTrace.x.filter((elem, index) => !excludedTracker[index])
                receivedMessagesTrace.y = receivedMessagesTrace.y.filter((elem, index) => !excludedTracker[index])
                traces.push(sentMessagesTrace, receivedMessagesTrace)
            } else {
                receivedMessagesTrace.x = [receivedMessagesTrace.x[0]]
                receivedMessagesTrace.y = [0]
                receivedMessagesTrace.marker = {
                    size: 4,
                    opacity: 0
                }
                // receivedMessagesTrace.connectgaps = false // this probably only works with newer plotly version
                receivedMessagesTrace.name = notShownReceived
                traces.push(sentMessagesTrace, receivedMessagesTrace)
            }

        }
        return traces

    }


    let resultTraces = makeTraces()

    layout.xaxis.range = [resultTraces[0].x[0], resultTraces[0].x[resultTraces[0].x.length - 1]]

    layout.xaxis.rangeslider = {}
    //layout.height = 700
    if (!isMobile()) {
        layout["height"] = 700
    }

    plotContainer.html("");
    Plotly.newPlot(plotId, resultTraces, layout, config);


}

module.exports = sentReceivedDailyPerConversation;

