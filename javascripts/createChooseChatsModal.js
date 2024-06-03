const deidentifyNamesWithStars = require("./deidentifyNamesWithStars");
const showUserIdMapping = require("./showUserIdMapping");

const i18nSupport= $("#i18n-support");

function createChooseChatsModal(allParticipantsNamesToRandomIds, allWordCounts, dataSource) {

    clearPrevious()
        .then(() => {

            let chatSelectionModalBody = $(`#${dataSource}ChatSelectionModalBody`)

            // get all dataSrouce conversations
            let inputJson = JSON.parse($("#inputJson")[0].value)
            let conversations = inputJson.conversations.filter((conv) => conv.donation_data_source_type == dataSource)

            // get deidentified names for all chats
            let mappingsPerChat = deidentifyNamesWithStars(allParticipantsNamesToRandomIds, conversations.map(conv => {
                let result = []
                conv.participants.forEach(p => result.push({name: p}))
                return result
            }), i18nSupport.data('friend-initial'), i18nSupport.data('system'), i18nSupport.data('donor'), dataSource)


            // combine information to keep necessary infos together for sorting
            let combinedConvAndMappingsAndWordCount = []
            conversations.forEach((conv, index) => {
                combinedConvAndMappingsAndWordCount.push({
                    conv: conv,
                    mappings: mappingsPerChat[index],
                    wordCount: allWordCounts[index].wordCount
                })
            })

            // sort by the wordCount
            combinedConvAndMappingsAndWordCount.sort((a,b) => b.wordCount - a.wordCount)

            combinedConvAndMappingsAndWordCount.forEach((obj) => {
                chatSelectionModalBody.append(createCheckBoxElem(obj.conv, obj.mappings))
                $('#checkBox_' + obj.conv.conversation_id).on("click", () => onClickCheckbox(obj.conv.conversation_id, allParticipantsNamesToRandomIds, dataSource))
            })

            // Check if now there is only 1 or 10 selected chats - if so, disable the correct checkboxes
            // if there is only 1 chat selected, disable this ones checkbox
            // if there are already 10 chats selected, disable all not selected checkboxes
            // count now selected chats:
            let selectedCount = conversations.reduce((count, curElem) => {
                if (curElem.selected) {
                    return count + 1
                } else return count
            }, 0)



            conversations.forEach(conv => {
                let checkbox = $('#checkBox_' + conv.conversation_id)
                if (conv.selected && selectedCount === 1) {
                    checkbox.prop("disabled", true)
                } else if (!conv.selected && selectedCount === 10) {
                    checkbox.prop("disabled", true)
                } else {
                    checkbox.prop("disabled", false)
                }
            })
        })
}

function clearPrevious() {
    return new Promise((resolve) => {
        $(".chooseChatsCheckboxElem").remove();
        resolve();
    });
}

const createCheckBoxElem = (conv, names) => {
    //console.log("names:", names.map(n => n.name))

    let checkBoxElemString = ` <div class="chooseChatsCheckboxElem flex-row w-100 d-flex justify-content-center align-items-center mt-1 bg-white rounded-lg shadow-md px-5 py-2">
                    <div class="w-25">
                        <input 
                            type="checkbox" 
                            id=${"checkBox_" + conv.conversation_id} 
                            style="transform: scale(2)" 
                            ${conv.selected ? "checked" : ""} 
                        />
                    </div>
                    <div class="w-75" style='font-weight: bold'>
                        <p>${createNamesElem(names.map(n => n.name))}</p>
                    </div>
                </div>`

    return checkBoxElemString
}

const createNamesElem = (names) => {

   // take care of empty names

   // create <p> elem for names
    let namesString = ""

    names.forEach((n, index) => {
        if (index == names.length-1) {
            namesString += n
        } else {
            namesString += (n + ", &nbsp;")
        }
    })

    let nameElem
    if (names.length < 1) {
        nameElem = `<p style="font-weight: bold">${i18nSupport.data('only-you')}</p>`
    } else {
        nameElem = `<p style="font-weight: bold">${i18nSupport.data("chat-with")} <br> ${namesString}</p>`
    }

    return nameElem

}

const onClickCheckbox = (convId, allParticipantsNamesToRandomIds, dataSource) => {
    let inputJson = $("#inputJson")
    // allAnonymizedData also needs to be adjusted with the selected prop - as that is used when changing the date range
    let allAnonymizedData = $("#allAnonymizedData")

    let inputObj = JSON.parse(inputJson[0].value)
    let inputObjConv = inputObj.conversations

    let allDataObj = JSON.parse(allAnonymizedData[0].value)
    let allDataConv = allDataObj.conversations

    // get all conversations
    let conversations = inputObjConv.filter((conv) => conv.donation_data_source_type === dataSource)
    let allDataDataSourceConversations = allDataConv.filter((conv) => conv.donation_data_source_type === dataSource)


    let convClickedIndex = conversations.findIndex(elem => elem.conversation_id == convId)
    let allDataConvClickedIndex = allDataDataSourceConversations.findIndex(elem => elem.conversation_id == convId)
    conversations[convClickedIndex].selected = !conversations[convClickedIndex].selected
    allDataDataSourceConversations[allDataConvClickedIndex].selected = !allDataDataSourceConversations[allDataConvClickedIndex].selected

    // create the new conversations value and set it in the inputJson
    inputObj.conversations = inputObjConv.filter((conv) => conv["donation_data_source_type"] !== dataSource)
        .concat(conversations)
    inputJson.attr('value', JSON.stringify(inputObj));

    allDataObj.conversations = allDataConv.filter((conv) => conv["donation_data_source_type"] !== dataSource)
        .concat(allDataDataSourceConversations)
    allAnonymizedData.attr('value', JSON.stringify(allDataObj));




    // create arguments needed to re-render the userIdMapping
    let chatsToShowMappingParticipants = []
    let allMappings = conversations.map((conv) => {
        let result = []
        conv.participants.forEach(p => result.push({name: p}))
        if (conv.selected) {
            chatsToShowMappingParticipants.push(result)
        }
        return result
    })

    // re-render userIdMapping
    showUserIdMapping(chatsToShowMappingParticipants, allParticipantsNamesToRandomIds, allMappings, i18nSupport.data('system'), i18nSupport.data('donor'), i18nSupport.data('friend-initial'), i18nSupport.data('chat-initial-f'), i18nSupport.data('only-you'), i18nSupport.data('and-more-contacts'), i18nSupport.data('chat'),  dataSource)

    // Check if now there is only 1 or 10 selected chats - if so, disable the correct checkboxes
    // if there is only 1 chat selected, disable this ones checkbox
    // if there are already 10 chats selected, disable all not selected checkboxes
    // count now selected chats:
    let selectedCount = conversations.reduce((count, curElem) => {
        if (curElem.selected) {
            return count + 1
        } else return count
    }, 0)

    conversations.forEach(conv => {
        let checkbox = $('#checkBox_' + conv.conversation_id)
        if (conv.selected && selectedCount === 1) {
            checkbox.prop("disabled", true)
        } else if (!conv.selected && selectedCount === 10) {
            checkbox.prop("disabled", true)
        } else {
            checkbox.prop("disabled", false)
        }
    })

}


module.exports = createChooseChatsModal;