const formInputDataForBreaksInConvPlot = require("./utils/formInputDataForBreaksInConvPlot");


function breaksInConvPlot(wordsPerConv, listOfConversations, plotId) {

    const plotContainer = $(`#${plotId}`)
    plotContainer.removeClass('d-none');
    const yAxis = plotContainer.attr("data-y-axis");
    const days = plotContainer.attr("data-days-name");
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
            tickformat: '%m-%Y',
            showgrid: true,
            automargin: true,
        },
        yaxis: {
            title: yAxis,
            showgrid: true,
            fixedrange: true,
        },
        legend: {
            x: -0.1,
            y: 1.25,
        }
    };



    let makeTraces = () => {

        // initialize updatemenus
        layout["updatemenus"] = [
            {
                active: 0,
                buttons: [],
                pad: {'r': 10, 't': 10},
                x: 0,
                xanchor: 'left',
                y: 1.4,
                yanchor: 'top'
            },
            {
                x: 1,
                y: 1.25,
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
        for (let i = 0; i < wordsPerConv.length; i++) {

            //make visibility true/false array for this button option
            let visibilityBooleans = []

            for (let j = 0; j < wordsPerConv.length; j++) {
                if (j === i) {
                    visibilityBooleans.push(true)
                } else {
                    visibilityBooleans.push(false)
                }
            }


            // add menu for this conversation
            layout["updatemenus"][0]["buttons"].push({
                method: 'restyle',
                args: ['visible', visibilityBooleans],
                label: listOfConversations[i]
            })


            let plotInputData = formInputDataForBreaksInConvPlot(wordsPerConv[i])


            traces.push({
                x: plotInputData.x,
                y: plotInputData.y,
                mode: 'lines+markers',
                name: days,
                marker: {size: 12},
                visible: i === 0,
            })

        }

        return traces;
    }


    let resultTraces = makeTraces()

    layout.yaxis.range = [0, 32]

    plotContainer.html("");
    Plotly.newPlot(plotId, resultTraces, layout, config);

}

module.exports = breaksInConvPlot;

