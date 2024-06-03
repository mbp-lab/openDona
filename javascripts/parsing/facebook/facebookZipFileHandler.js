var JSZip = require('jszip');
var deIdentify = require('../shared/deIdentify');
const zip = require("@zip.js/zip.js");

async function facebookZipFileHandler(fileList) {

    const i18n = $("#i18n-support");


    var messagesRelativePath = [];
    var zipFiles = {};

    // first get all entries in the zip file
    let allEntries = []
    for (let i = 0; i < fileList.length; i++) {
        const zipFileReader = new zip.BlobReader(fileList[i]);
        const zipReader = new zip.ZipReader(zipFileReader);

        allEntries = allEntries.concat(await zipReader.getEntries())
        await zipReader.close();
    }


    return new Promise( (resolve, reject) => {

        // then check if profileInfo is there and extract the donor name
        let profileInfoEntry = allEntries.find(entry => entry.filename.includes("profile_information.json"))
        if (profileInfoEntry === undefined) {
            reject(i18n.data('error-no-profile'))
        }

        extractDonorNameFromEntry(profileInfoEntry)
            .then((donorName) => {
                // get all messageEntries
                let messagesEntries = []
                allEntries.forEach((entry) => {
                    if (validateContentEntry("message.json", entry) || validateContentEntry("message_1.json", entry)) {
                        messagesEntries.push(entry);
                    }
                })

                // if there is no messages then reject
                if (messagesEntries.length < 1) reject("error");

                // get the contents of the messageEntries
                let textList = messagesEntries.map((entry) => {
                    const textWriter = new zip.TextWriter();
                    return entry.getData(textWriter)
                })

                resolve([resolve(deIdentify(donorName, Promise.all(textList), allEntries))]);
            })
            .catch(function (e) {
                reject(e);
            })

    });
}

function extractDonorName(zipFiles, profileInfoPath) {
    return zipFiles[profileInfoPath].async('text')
        .then((profileFileText) => {
            return new Promise((resolve, reject) => {
                const profileJson = JSON.parse(profileFileText);
                // find appropriate profile key: it could be "profile" or "profile_v2", or "profile_v3", ...
                let profileKey = Object.keys(profileJson).filter((profile) => /profile/.test(profile));
                if (profileJson[profileKey].name.full_name) resolve(profileJson[profileKey].name.full_name);
                else reject(profileInfoPath);
            });
        });
}


// new - it works!
function extractDonorNameFromEntry(entry) {
    const textWriter = new zip.TextWriter();
    return entry.getData(textWriter).then((profileFileText) => {
        return new Promise((resolve, reject) => {
            const profileJson = JSON.parse(profileFileText);
            // find appropriate profile key: it could be "profile" or "profile_v2", or "profile_v3", ...
            let profileKey = Object.keys(profileJson).filter((profile) => /profile/.test(profile));
            if (profileJson[profileKey].name.full_name) resolve(profileJson[profileKey].name.full_name);
            else reject(profileInfoPath);
        });
    });
}

function validateContent(contentPattern, zipEntry) {
    if (zipEntry.name.trim().indexOf(contentPattern) >= 0) return true;
    return false;
};

function validateContentEntry(contentPattern, entry) {
    if (entry.filename.trim().indexOf(contentPattern) >= 0) return true;
    return false;
};

module.exports = facebookZipFileHandler