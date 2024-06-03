const sentReceived = require('./analysis_plot/sentReceived');
const sentReceivedDailyPerConversation = require('./analysis_plot/sentReceivedDailyPerConversation')
const dailyActivityTimes = require('./analysis_plot/dailyActivityTimes')
const animatedPolarPlot = require('./analysis_plot/animatedPolarPlot')
const animatedHorizontalBarChart = require('./analysis_plot/animatedHorizontalBarChart')
const animatedHorizontalBarChartOverall = require('./analysis_plot/animatedHorizontalBarChartOverall')
const animatedDayPartsActivityPlot = require("./analysis_plot/animatedDayPartsActivityPlot");
const dayPartsActivityOverallPlot = require("./analysis_plot/dayPartsActivityOverallPlot");
const responseTimeBarChart = require('./analysis_plot/responseTimeBarChart');
const animatedResponseTimeBarChart = require('./analysis_plot/animatedResponseTimeBarChart')
const breaksInConvPlot = require("./analysis_plot/breaksInConvPlot");
const createListOfConversations = require("./analysis_plot/utils/createListOfConversations");
const horizontalBarChartOverall = require("./analysis_plot/horizontalBarChartOverall");
const {isMobile} = require("./utils");


$(document).ready(function () {

    alertIfMobile()

    Object.keys(allData).forEach(function (dataSourceType) {
        const graphData = allData[dataSourceType];
        //console.log(graphData)

        // get some messages necessary for the plats
        const systemName = i18n.systemName
        const chatWith = i18n.chatWith
        const friendsInitial = i18n.friendInitial
        const startLabel = i18n.startLabel
        const pauseLabel = i18n.pauseLabel
        const chatLabel = i18n.chat
        let chatInitial;
        if (dataSourceType === "WhatsApp") {
            chatInitial = i18n.chatInitialW
        } else if (dataSourceType === "Facebook") {
            chatInitial = i18n.chatInitialF
        } else {
            chatInitial = i18n.chatInitialI
        }

        // remove friend "System" from friends of conversations
        let conversationsWithoutSystem = []
        graphData.conversationsFriends.forEach((conversation) => {
            conversationsWithoutSystem.push(conversation.filter((friend) => friend !== systemName))
        })
        // create the list of conversations
        const listOfConversations = createListOfConversations(
            conversationsWithoutSystem,
            chatLabel,
            chatInitial,
            chatWith,
            friendsInitial,
            systemName
        )

        animatedPolarPlot(
            graphData.sentReceivedPerMonthPerConversation,
            listOfConversations,
            `${dataSourceType}AnimatedPolarPlot`,
            startLabel,
            pauseLabel
        );

        animatedHorizontalBarChart(
            graphData.sentReceivedPerMonthPerConversation,
            listOfConversations,
            `${dataSourceType}AnimatedHorizontalBarChart`,
            startLabel,
            pauseLabel
        );

        dailyActivityTimes(
            graphData.dailySentHoursPerConversation,
            graphData.dailyReceivedHoursPerConversation,
            listOfConversations,
            `${dataSourceType}DailyActivityTimes`
        );


        responseTimeBarChart(
            graphData.responseTimes,
            `${dataSourceType}ResponseTimeBarChart`,
            (graphData.conversationsFriends.length <= 1)
        );


        // when modal is opened the first time, render plots...
        // if this is done before the modal is opened, the width of the plots is not correct


        let sentReceivedModal = $(`#${dataSourceType}sentReceivedModal`)
        const dailyActivityModal = $(`#${dataSourceType}dailyActivityModal`)
        const responseTimeModal = $(`#${dataSourceType}responseTimeModal`)

        sentReceivedModal.on('shown.bs.modal', () => {

            horizontalBarChartOverall(
                graphData.basicStatistics.sentWordsTotal,
                graphData.basicStatistics.receivedWordsTotal,
                `${dataSourceType}AnimatedHorizontalBarChartOverall`,
                startLabel,
                pauseLabel
            )

            sentReceivedDailyPerConversation(
                graphData.slidingWindowMeanPerConv,
                `${dataSourceType}SentReceivedSlidingWindowMean`,
                listOfConversations,
                true
            )

        })

        dailyActivityModal.on('shown.bs.modal', () => {
            dayPartsActivityOverallPlot(
                graphData.dailySentHoursPerConversation,
                graphData.dailyReceivedHoursPerConversation,
                `${dataSourceType}DayPartsActivityOverallPlot`
            )

            animatedDayPartsActivityPlot(
                graphData.dailySentHoursPerConversation,
                graphData.dailyReceivedHoursPerConversation,
                `${dataSourceType}DayPartsActivityPlot`,
                startLabel,
                pauseLabel
            )
        })

        responseTimeModal.on('shown.bs.modal', () => {
            animatedResponseTimeBarChart(
                graphData.responseTimes,
                `${dataSourceType}AnimatedResponseTimeBarChart`,
                startLabel,
                pauseLabel
            );

            /*
            breaksInConvPlot(
                graphData.dailySentReceivedPerConversation,
                listOfConversations,
                `${dataSourceType}BreaksInConvPlot`
            );

             */
        })


        // without this an explanation modal opened within another modal isn't scrollable for some reason
        $('body').on('shown.bs.modal', function () {
            $('body').addClass('modal-open');
        });


    })

});

function alertIfMobile() {
    if(isMobile()) {
        $('#mobileAlertModal').modal("show")
    }
}


function closeModals() {
    if ($('.modal').is(':visible')) {
        $('.modal').modal('hide');
    }
}