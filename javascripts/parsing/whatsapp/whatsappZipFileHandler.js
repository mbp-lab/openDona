var JSZip = require('jszip');

function whatsappZipFileHandler(file) {
    return new Promise((resolve, reject) => {
        JSZip.loadAsync(file)
            .then((zip) => {

                let txtFiles = []
                let allPromises = []
                Object.keys(zip.files).forEach((filename) => allPromises.push(
                    zip.files[filename]
                        .async('blob')
                        .then((fileData) => {
                    if (filename.slice(-4) == ".txt") {
                        return new File([fileData], filename)
                    } else {
                        return null
                    }
                })))

                resolve(Promise.all(allPromises))
            })

        })

}


module.exports = whatsappZipFileHandler