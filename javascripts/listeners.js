const facebookZipFileHandler = require('./parsing/facebook/facebookZipFileHandler');
const whatsappTxtFileHandler = require('./parsing/whatsapp/whatsappTxtFileHandler');
const instagramZipFileHandler = require('./parsing/instagram/instagramZipFileHandler');
const createChooseChatsModal = require('./createChooseChatsModal')



const transformJson = require('./transformJson');
const progressBar = require('./progressBar')
const renderTable = require('./showResultsInTable');
const renderUserIDMapping = require('./showUserIdMapping')
const hammerJs = require('hammerjs');
const messageService = require('./messageService');
const deidentifyNamesWithStars = require("./deidentifyNamesWithStars");
const JSZip = require("jszip");
const whatsappZipFileHandler = require("./parsing/whatsapp/whatsappZipFileHandler");


function addListeners() {

    // this is so that when a modal is open, clicking the back button will close the modal
    if (window.history && window.history.pushState) {
        $('.modal').on('show.bs.modal', function (e) {
            window.history.pushState('openModal', null, './more');
        });

        let pushedState = false;

        $(window).on('popstate', function () {
            if (!pushedState) {
                $('.modal:visible').each(function () {
                    if (this.id === 'donorIdInput-dialog') {
                        window.history.pushState('donorIdInput', null, './donorIdInput');
                        pushedState = true;
                    }
                });
                $('.modal:not(#donorIdInput-dialog)').modal('hide');
            } else {
                $('.modal').modal('hide');
                pushedState = false;
            }
        });

        $('.modal').on('hide.bs.modal', function (e) {
            if (window.history.state === "openModal") {
                window.history.back()
            } else if (window.history.state === "donorIdInput") {
                window.history.back()
            }
        });
    }

    $('#openDonorIdInput').click(function (e) {
        e.preventDefault();
        $('#consent-dialog').modal('hide');
        $('#donorIdInput-dialog').modal('show');
    });

    $("#donationIdInput").on("change", (e) => {
        let donorIdInput = e.target.value
        $("#donorIdInputValue").attr('value', donorIdInput);
    })

    $("#btn-fb-download-finished").on("click", function (e) {
        e.preventDefault(); d
        $(".enable-after-fb-download").attr("disabled", false);
        $(".enable-after-fb-download").removeClass("disabled");
    })

    $("#submit-de-identified").on("click", function (e) {
        $(".selectorsAndInputs").addClass('disabled');
        $('.selectorsAndInputs').attr('disabled', 'disabled');

        $(".accordion").addClass('d-none');
        $("#anonymizationTextHeadlines").addClass('d-none');
        $("#backAndForwardButtons").addClass('d-none');
        $("#spinner-submit-div").removeClass('d-none');
        $('.languageSelectButton').addClass('d-none')

        // show message if loading takes longer than 30 seconds - possible reasons for long loadtime
        setTimeout(() => $("#show-if-loading-long").removeClass('d-none'), 30000)

        //$('#submit-de-identified').prop('disabled', true);

    })


    $(".viewRawJson").on("click", function (e) {
        //Open a new tab and dumb the json into it
        e.preventDefault();
        var newTab = window.open();
        newTab.document.open();
        newTab.document.write($("#inputJson").val());
        newTab.document.close();
    });

    if ($("#carousel-deidentified-preview").length) {
        var hammer = new hammerJs(document.querySelector("#carousel-deidentified-preview"));
        hammer.on('swipeleft', function () {
            $("#carousel-deidentified-preview").carousel('next');
        });
        hammer.on('swiperight', function () {
            $("#carousel-deidentified-preview").carousel('prev');
        });

        $("#carousel-deidentified-preview").on("slide.bs.carousel", function (e) {
            var $e = $(e.relatedTarget);
            var idx = $e.index();
            var itemsPerSlide = 3;
            var totalItems = $(".carousel-item").length;

            if (idx >= totalItems - (itemsPerSlide - 1)) {
                var it = itemsPerSlide - (totalItems - idx);
                for (var i = 0; i < it; i++) {
                    // append slides to end
                    if (e.direction == "left") {
                        $(".carousel-item")
                            .eq(i)
                            .appendTo(".carousel-inner");
                    } else {
                        $(".carousel-item")
                            .eq(0)
                            .appendTo($(this).find(".carousel-inner"));
                    }
                }
            }
        });
    }

    $("#offline-consent-donor-id-txt").on("change keyup paste", function () {
        const currentText = $("#offline-consent-donor-id-txt").val();
        if (currentText) {
            $("#submit-donor-id-btn").show();
            $("#use-online-consent-btn").hide();
        }
        else {
            $("#submit-donor-id-btn").hide();
            $("#use-online-consent-btn").show();
        }
    })

    $('.has-animation').each(function (index) {
        $(this).delay($(this).data('delay')).queue(function () {
            $(this).addClass('animate-in');
        });
    });

    setUpFileHandler();

    handleUnsupportedBrowsers();
}

function handleUnsupportedBrowsers() {

    var userAgent = navigator.userAgent.toLowerCase()

    // check if user is using IE as we know the site does not look correct
    // code taken from https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie
    if (userAgent.indexOf("MSIE") > -1 || userAgent.match(/Trident.*rv\:11\./)) {
        $("#unsupported-browser-warning").removeClass("d-none");
    }


}

function setUpFileHandler() {
    let earlierSuccess = false
    let currentError = false
    let currentErrorFWI = {
        "Facebook": false,
        "WhatsApp": false,
        "Instagram": false,
    }
    const i18nSupport = $("#i18n-support");
    let donaForMEDonation = {
        "donor_id": i18nSupport.data('donor'),
        "conversations": []
    };
    let possibleEarliestDate = 0
    let possibleLatestDate = 0

    $(".donation-file-selector>input[type='file']").on("click", function (evt) {
        const requiresAlias = false;
        const dataSourceName = evt.currentTarget.id;
        if (requiresAlias && !$(`#${dataSourceName}AliasInput`).val()) {
            messageService.showError(i18nSupport.data('error-no-alias'), dataSourceName);
            evt.preventDefault();
        }
    });

    let onFileInputChange = (dataSource, files) => {

        // variables
        let testFileNames;
        let testFileNameLength;

        if (files.length < 1) {
            messageService.hide(dataSource)
            $(".show-on-anonymisation-success" + "-" + dataSource).addClass('d-none');
            $('#submit-de-identified').prop('disabled', true);
            return;
        }

        const donorId = $("#donor_id").val();

        messageService.hide(dataSource)
        progressBar.start(dataSource);

        $(".show-on-anonymisation-success" + "-" + dataSource).addClass('d-none');
        $('#submit-de-identified').prop('disabled', true);

        let handler;

        if (dataSource == "WhatsApp") {
            let txtFiles = []
            let zipFiles = []

            // there can be zip or txt files
            // collect all txt files and extract txt files from zip files
            for (let i = 0; i < files.length; i++) {
                if (files[i].type == "text/plain") {
                    txtFiles.push(files[i])
                } else {
                    zipFiles.push(whatsappZipFileHandler(files[i]))
                }
            }

            if (zipFiles.length > 0) {
                handler = Promise.all(zipFiles)
                    .then(res => {
                        // filter out null, null would be other files in the zip that are not .txt
                        return whatsappTxtFileHandler(txtFiles.concat(res.flat().filter(file => file != null)))
                    })
            } else {
                handler = whatsappTxtFileHandler(txtFiles);
            }


        } else if (dataSource == "Facebook") {
            handler = facebookZipFileHandler(files);
        } else {
            handler = instagramZipFileHandler(files);
        }


        handler
            .then((deIdentifiedJson) => {

                // check if names are testFileNames - if so then disable (later in the code) the date selection
                const testFilesContactNames = [
                    "Kyle Adkins",
                    "System",
                    "Donna Patterson",
                    "Dr. Heather Hanson",
                    "Jeffery Hill",
                    "Michelle Morris",
                    "Sherry Flores"
                ]
                testFileNames = true
                testFileNameLength = Object.keys(deIdentifiedJson.participantNameToRandomIds).length === testFilesContactNames.length
                Object.keys(deIdentifiedJson.participantNameToRandomIds).forEach((name) => {
                    testFileNames = testFileNames && testFilesContactNames.includes(name)
                })


                const fileList = $("#" + dataSource + "FileList")
                fileList.empty()

                let fileName
                for (let i = 0; i < files.length; i++) {
                    fileName = files[i].name
                    fileList.append('<li class="list-group-item">' + fileName + ' </li>')
                }

                // create data preview and user id mapping
                renderTable(deIdentifiedJson.deIdentifiedJsonContents, dataSource);
                let contactsPerConv = deIdentifiedJson.deIdentifiedJsonContents.map((conv) => conv.participants)

                if (dataSource === "WhatsApp") {
                    renderUserIDMapping(deIdentifiedJson.chatsToShowMapping, deIdentifiedJson.participantNameToRandomIds, contactsPerConv, i18nSupport.data('system'), i18nSupport.data('donor'), i18nSupport.data('friend-initial'), i18nSupport.data('chat-initial-w'), i18nSupport.data('only-you'), i18nSupport.data('and-more-contacts'), i18nSupport.data('chat'), dataSource)
                } else if (dataSource === "Facebook") {
                    renderUserIDMapping(deIdentifiedJson.chatsToShowMappingParticipants, deIdentifiedJson.participantNameToRandomIds, contactsPerConv, i18nSupport.data('system'), i18nSupport.data('donor'), i18nSupport.data('friend-initial'), i18nSupport.data('chat-initial-f'), i18nSupport.data('only-you'), i18nSupport.data('and-more-contacts'), i18nSupport.data('chat'), dataSource)

                    // for facebook also fill information for the chat selection modal
                    $("#openChooseFacebookChatsModalButton").on("click", function () {
                        createChooseChatsModal(deIdentifiedJson.allParticipantsNamesToRandomIds, deIdentifiedJson.allWordCounts, dataSource)
                        $('#chooseFacebookChatsModal').modal('show')
                    })

                } else {
                    // this is Instagram then
                    renderUserIDMapping(deIdentifiedJson.chatsToShowMappingParticipants, deIdentifiedJson.participantNameToRandomIds, contactsPerConv, i18nSupport.data('system'), i18nSupport.data('donor'), i18nSupport.data('friend-initial'), i18nSupport.data('chat-initial-i'), i18nSupport.data('only-you'), i18nSupport.data('and-more-contacts'), i18nSupport.data('chat'), dataSource)
                    $("#openChooseInstagramChatsModalButton").on("click", function () {
                        createChooseChatsModal(deIdentifiedJson.allParticipantsNamesToRandomIds, deIdentifiedJson.allWordCounts, dataSource)
                        $('#chooseInstagramChatsModal').modal('show')
                    })
                }
                return transformJson(deIdentifiedJson.deIdentifiedJsonContents, donorId, dataSource);
            })
            .then((transformedJson) => {

                // if there are already conversations of the chosen dataSource, then first filter the old ones out
                donaForMEDonation.conversations = donaForMEDonation.conversations.filter((conv) => conv["donation_data_source_type"] !== dataSource)

                // get earliest and latest date of all conversations
                let earliestDate = transformedJson.result[0].earliestDate
                let latestDate = transformedJson.result[0].latestDate


                transformedJson.result.forEach((res) => {
                    donaForMEDonation.conversations = donaForMEDonation.conversations.concat(res.conversation);
                    if (res.earliestDate < earliestDate) {
                        earliestDate = res.earliestDate
                    } else if (res.latestDate > latestDate) {
                        latestDate = res.latestDate
                    }
                })

                possibleEarliestDate = earliestDate
                possibleLatestDate = latestDate
                let earliestDateObj = new Date(earliestDate);
                let earliestDateString = earliestDateObj.toISOString().substring(0, 10)
                let latestDateObj = new Date(latestDate)
                let latestDateString = latestDateObj.toISOString().substring(0, 10)

                document.getElementById("startDate-" + dataSource).value = earliestDateString;
                document.getElementById("startDate-" + dataSource).min = earliestDateString;
                document.getElementById("startDate-" + dataSource).max = latestDateString;
                document.getElementById("endDate-" + dataSource).value = latestDateString;
                document.getElementById("endDate-" + dataSource).min = earliestDateString;
                document.getElementById("endDate-" + dataSource).max = latestDateString;

                // all anonymized data is to be kept separate from the data that is actually donated
                // because of dynamic time span selection
                $("#allAnonymizedData").attr('value', JSON.stringify(donaForMEDonation));

                // only set the new conversations of the current dataSource in the inputJson

                // if inputJson is empty then set all the data, but else (if there already is data saved there)
                // then don't overwrite everything, as there is already data filtered for a time span saved there
                let inputJson = $("#inputJson")
                if (inputJson[0].value === "") {
                    inputJson.attr('value', JSON.stringify(donaForMEDonation));

                } else {
                    let inputObjFiltered = JSON.parse(inputJson[0].value)
                    let inputObjConvFiltered = inputObjFiltered.conversations

                    // filter the conversations to only get the dataSource that is concerned
                    let dataSourceConv = donaForMEDonation.conversations.filter((conv) => conv["donation_data_source_type"] === dataSource)
                    // create the new conversations value and set it in the inputJson
                    inputObjFiltered.conversations = inputObjConvFiltered.filter((conv) => conv["donation_data_source_type"] !== dataSource)
                        .concat(dataSourceConv)
                    inputJson.attr('value', JSON.stringify(inputObjFiltered));

                }





                // show success messages
                $(".show-on-anonymisation-success" + "-" + dataSource).removeClass('d-none');
                if (!currentErrorFWI["Facebook"] && !currentErrorFWI["WhatsApp"] && !currentErrorFWI["Instagram"]) {
                    $('#submit-de-identified').prop('disabled', false);
                    $('#stillAnErrorSomewhere').addClass('d-none')
                }

                $("#" + dataSource + "Checkmark").removeClass('d-none');

                messageService.showSuccess(i18nSupport.data("anonymisation-successful") + " " + i18nSupport.data("info-preview-data-body1"), dataSource);

                earlierSuccess = true;
                progressBar.stop(dataSource);


                // disable date selection if files are test files!
                if (testFileNames && testFileNameLength) {
                    document.getElementById("startDate-" + dataSource).disabled = true
                    document.getElementById("endDate-" + dataSource).disabled = true
                }

            })
            .catch(error => {
                console.log(error);

                if (earlierSuccess) {
                    $(".show-on-anonymisation-success" + "-" + dataSource).removeClass('d-none');
                    $('#submit-de-identified').prop('disabled', false);
                    $('#stillAnErrorSomewhere').addClass('d-none')
                }
                messageService.showError(i18nSupport.data("error") + " " + error, dataSource);
                progressBar.stop(dataSource);
            });
    }

    // when new files are selected, handle it
    $(".donation-file-selector>input[type='file']").on("change", (evt) => {
        const dataSource = evt.currentTarget.id;
        const files = evt.target.files
        onFileInputChange(dataSource, files)
    })

    // filtering the selected data according to the dates that the user selects
    $(".date-selection").on("input", (evt) => {
        let dataSource = evt.currentTarget.id.substring(evt.currentTarget.id.indexOf('-') + 1, evt.currentTarget.id.length);

        let startDate = document.getElementById("startDate-" + dataSource).value
        let endDate = document.getElementById("endDate-" + dataSource).value

        // start and end date to ms
        let startDateMs = new Date(startDate).getTime()
        let endDateMs = new Date(endDate).getTime()
        endDateMs = endDateMs + 86340000 // standard is at 00:00, add 23:59h so that the whole day of the end day is regarded

        // remove all current notifications
        messageService.hideErrorShowSuccess(dataSource)

        // in case the date is not selected at all - error
        if (startDate === "" || endDate === "" || isNaN(startDateMs) || isNaN(endDateMs)) {
            messageService.showError(i18nSupport.data("error-dates-no-sense"), dataSource);
            $('#submit-de-identified').prop('disabled', true);
            $('#stillAnErrorSomewhere').removeClass('d-none')
            currentError = true;
            currentErrorFWI[dataSource] = true
            return;
        } // in case the dates don't make sense - error
        else if (startDateMs > possibleLatestDate || endDateMs < possibleEarliestDate || startDateMs >= endDateMs) {
            messageService.showError(i18nSupport.data("error-dates-no-sense"), dataSource);
            $('#submit-de-identified').prop('disabled', true);
            $('#stillAnErrorSomewhere').removeClass('d-none')
            currentError = true;
            currentErrorFWI[dataSource] = true
            return;
        } // in this case at least x months of data have to be selected
        else if (possibleLatestDate - possibleEarliestDate >= 1.577e+10) { // 6 months in ms
            if (Math.abs(possibleEarliestDate - endDateMs) < (1.577e+10 - 8.64e+7)
                || Math.abs(startDateMs - possibleLatestDate) < (1.577e+10 - 8.64e+7)
                || Math.abs(startDateMs - endDateMs) < (1.577e+10 - 8.64e+7)
            ) {
                messageService.showError(i18nSupport.data("error-not-enough-months"), dataSource);
                $('#submit-de-identified').prop('disabled', true);
                $('#stillAnErrorSomewhere').removeClass('d-none')
                currentError = true;
                currentErrorFWI[dataSource] = true
                return;
            }
        }

        // get the selected data that was already anonymized from the inputJson
        let inputObjAllData = JSON.parse($("#allAnonymizedData")[0].value)
        let inputObjConvAllData = inputObjAllData.conversations
        let inputObjFiltered = JSON.parse($("#inputJson")[0].value)
        let inputObjConvFiltered = inputObjFiltered.conversations
        // filter the conversations to only get the dataSource that is concerned
        let dataSourceConv = inputObjConvAllData.filter((conv) => conv["donation_data_source_type"] === dataSource)
        // filter the messages
        dataSourceConv.forEach(conv => {
            // only leave messages that are in the timespan
            conv.messages = conv.messages.filter((message) =>
                message.timestamp_ms >= startDateMs && message.timestamp_ms <= endDateMs)
            // only leave audio messages that are in the timespan
            conv.messages_audio = conv.messages_audio.filter((message) =>
                message.timestamp_ms >= startDateMs && message.timestamp_ms <= endDateMs)
        })
        // create the new conversations object
        inputObjFiltered.conversations = inputObjConvFiltered.filter((conv) => conv["donation_data_source_type"] !== dataSource)
            .concat(dataSourceConv)


        // show success
        messageService.hideErrorShowSuccess(dataSource)
        currentError = false;
        currentErrorFWI[dataSource] = false

        // check if there is at least one message in the timespan that was selected
        let allConvEmpty = true
        inputObjFiltered.conversations.forEach((conv) => {
            if (conv.messages.length !== 0) {
                allConvEmpty = false
                return
            }
        })
        if (allConvEmpty) {
            messageService.showError(i18nSupport.data("error-no-messages-time-period"), dataSource);
            $('#submit-de-identified').prop('disabled', true);
            $('#stillAnErrorSomewhere').removeClass('d-none')
            currentError = true
            currentErrorFWI[dataSource] = true
            return;
        } else {
            // show success
            messageService.hideErrorShowSuccess(dataSource)
            $(".show-on-anonymisation-success").removeClass('d-none');
            if (!currentErrorFWI["Facebook"] && !currentErrorFWI["WhatsApp"] && !currentErrorFWI["Instagram"]) {
                $('#stillAnErrorSomewhere').addClass('d-none')
                $('#submit-de-identified').prop('disabled', false);
            }
            currentError = false
            currentErrorFWI[dataSource] = false
        }

        // assign the filtered data to the inputJson
        $("#inputJson").attr('value', JSON.stringify(inputObjFiltered));
    })

}

module.exports = addListeners