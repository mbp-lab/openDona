const deidentifyNamesWithStars = require("./deidentifyNamesWithStars");

function showUserIdMapping(chatsToShowMapping, userIdMapping, idsPerConv, systemName, donor, friendInitial, chatInitialFOrW, onlyYouInConv, andMoreContacts, chat, dataSource) {

    clearPreviousRenderedMappings(dataSource)
        .then(() => {

            let resultMappingsPerChat = deidentifyNamesWithStars(userIdMapping, chatsToShowMapping, friendInitial, systemName, donor, dataSource)

            // get the donors name
            let donorName = ""
            Object.entries(userIdMapping).forEach(entry => {
                if (entry[1] === donor) {
                    donorName = entry[0]
                }
            })

            // html stuff:

            // outer div for friendsmapping
            $("#display-userIDMapping-" + dataSource).append(`<div id='display-userIDMapping-${dataSource}-donor' class='mapping-item flex-row d-flex justify-content-center align-items-center mt-1 bg-light rounded-lg shadow-md px-5 py-2'></div>`)

            // display donor mapping
            // create div structure
            $("#display-userIDMapping-" + dataSource + "-donor").append(`<div id='display-userIDMapping-${dataSource}-donorLeftSide' class='mapping-item justify-content-center'></div>`)
            $("#display-userIDMapping-" + dataSource + "-donor").append(`<div id='display-userIDMapping-${dataSource}-donorRightSide' class='mapping-item pl-4'></div>`)
            $("#display-userIDMapping-" + dataSource + "-donorLeftSide").append("" +
                "<p class='mapping-item' style='font-weight: bold'>"
                + donorName
                + "</p>" )
            $("#display-userIDMapping-" + dataSource + "-donorRightSide").append("<p class='mapping-item' style='font-weight: bold;'>&rarr; " + donor + "</p>")

            // display grouped other mappings
            for (let i = 0; i < resultMappingsPerChat.length; i++) {
                $("#display-userIDMapping-" + dataSource).append(`<div id='display-userIDMapping-${dataSource + i}' class='mapping-item flex-row d-flex justify-content-center align-items-center mt-1 bg-light rounded-lg shadow-md px-5 py-2'></div>`)

                //$("#display-userIDMapping-" + dataSource + i).append("<p class='mapping-item name-pseudonym-mapping pr-4 align-self-start' style='font-weight: bold; font-size: 24px'><u>" + "Chat mit" + "</u></p>")
                $("#display-userIDMapping-" + dataSource + i).append(`<div id='display-userIDMapping-${dataSource + i}-leftSide' class='w-50 mapping-item'></div>`)
                $("#display-userIDMapping-" + dataSource + i).append(`<div id='display-userIDMapping-${dataSource + i}-rightSide' class='pl-4 w-50 mapping-item'></div>`)

                // if there is nobody else in this chat
                if (resultMappingsPerChat[i].length === 0) {
                    $("#display-userIDMapping-" + dataSource + i + "-leftSide").append("" +
                        "<p class='mapping-item' style='font-weight: bold'>"
                        + onlyYouInConv
                        + "</p>" )
                }
                for (let j = 0; j < resultMappingsPerChat[i].length; j++) {
                    if (j >= 4) {
                        $("#display-userIDMapping-" + dataSource + i + "-leftSide").append("<p class='mapping-item text-right' style='font-weight: bold'>..." + andMoreContacts.replace("{0}", (resultMappingsPerChat[i].length-j)) + "</p>")
                        break;
                    }
                    $("#display-userIDMapping-" + dataSource + i + "-leftSide").append("" +
                        "<p class='mapping-item text-right' style='font-weight: bold'>"
                        + resultMappingsPerChat[i][j].name
                        + "</p>" )
                }
                $("#display-userIDMapping-" + dataSource + i + "-rightSide").append("<p class='mapping-item text-left' style='font-weight: bold;'>&rarr; " + chat + " " + chatInitialFOrW + (i+1) + "</p>")

            }

        })
}

function clearPreviousRenderedMappings(dataSource) {
    return new Promise((resolve) => {
        $("#display-userIDMapping-" + dataSource + " .mapping-item").remove();
        resolve();
    });
}

module.exports = showUserIdMapping;