function responseTime(data, plotId) {

    function millisecondsToDateTime(totalMilliseconds) {
        const totalSeconds = totalMilliseconds / 1000.0;
        const MIN = 60
        const HOUR = 60 * 60

        const hours = Math.floor(totalSeconds / HOUR)
        const minutes = Math.floor((totalSeconds - (hours * HOUR)) / MIN)
        const seconds = Math.floor(totalSeconds - (hours * HOUR) - (minutes * MIN))

        // you have to provide YYYY-MM-DD
        // for plotly to understand it as a date
        return `2017-01-01 ${hours}:${pad(minutes)}:${pad(seconds)}`
    }

    function pad(v) {
        return v < 10 ? '0' + v : String(v)
    }

    function getUpperBound(func) {
        return millisecondsToDateTime(Math.max(func(donorPoints), func(friendPoints)));
    }

    const donorPoints = data.filter(x => x.isDonor).map(x => x.timeInMs).sort((a, b) => a - b);
    const friendPoints = data.filter(x => !x.isDonor).map(x => x.timeInMs).sort((a, b) => a - b);
    const barRange = [`2017-01-01 00:00:00`, getUpperBound(data => Plotly.d3.median(data) * 1.1)];
    const boxRange = [`2017-01-01 00:00:00`, getUpperBound(data => Plotly.d3.quantile(data, 0.85))]

    const traces = [{
        x: [i18n['you'], i18n['friends']],
        y: [donorPoints, friendPoints].map(x => Plotly.d3.median(x)).map(millisecondsToDateTime),
        type: 'bar',
        name: i18n['medianResponseTime']
    },
    {
        y: donorPoints.map(millisecondsToDateTime),
        type: 'box',
        name: i18n['you'],
        boxpoints: 'all',
        boxmean: true,
        visible: false
    },
    {
        y: friendPoints.map(millisecondsToDateTime),
        type: 'box',
        name: i18n['friends'],
        boxpoints: 'all',
        boxmean: true,
        visible: false
    }
    ]
    const updateMenu = [
        {
            buttons: [
                {
                    args: [
                        {
                            visible: [
                                true,
                                false,
                                false
                            ]
                        },
                        {
                            "yaxis.autorange": false,
                            "yaxis.range": barRange,
                            "yaxis.title": i18n['medianResponseTime']
                        }
                    ],
                    label: i18n['overview'],
                    method: "update"
                },
                {
                    args: [
                        {
                            visible: [
                                false,
                                true,
                                true
                            ]
                        },
                        {
                            "yaxis.autorange": false,
                            "yaxis.range": boxRange,
                            "yaxis.title": i18n['responseTime']
                        }
                    ],
                    label: i18n['detail'],
                    method: "update"
                }
            ],
            y: 10,
            yanchor: 'top',
            x: 0.15,
            xanchor: 'right',
            showactive: true,
            pad: { 'r': 10, 't': -10 }
        }
    ]

    Plotly.newPlot(plotId, traces, {
        yaxis: {
            title: i18n['medianResponseTime'],
            tickformat: '%H:%M:%S',
            range: barRange
        },
        updatemenus: updateMenu
    })
}

module.exports = responseTime;