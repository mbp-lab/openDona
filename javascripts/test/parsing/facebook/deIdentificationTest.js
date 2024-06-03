const expect = require('chai').expect;
//const handleFile = require('../../../parsing/facebook/facebookZipFileHandler');
const fs = require('fs');
const jsdom = require('jsdom');

const { JSDOM } = jsdom;
const { document } = (new JSDOM('')).window;
global.document = document;
const window = document.defaultView;
global.window = window;
global.$ = require('jquery');

// this test is not working anymore with the zipjs library - because it uses client specific modules
/*
describe('DeIdentifying a zip file', function () {
    let zipFile = fs.readFileSync("javascripts/test/resources/validZip.zip");
    zipFile = new Blob([zipFile])
    it('should return messages with number of words rather than content', function () {
        return handleFile([zipFile]).then(deIdentifiedJson => {
            deIdentifiedJson["deIdentifiedJsonContents"][0].messages.forEach((message) => {
                expect(message['word_count']).to.equal(6);
            })
        })
    })
    it('should return messages with random IDs instead of sender_name', function () {
        return handleFile([zipFile]).then(deIdentifiedJson => {
        //console.log(deIdentifiedJson[0].participants);
            deIdentifiedJson["deIdentifiedJsonContents"][0].messages.forEach((message) => {
                expect(message.sender_name).to.not.equal('Blah Blah');
                expect(message.sender_name).to.not.equal('Some Person');
            })
        })    
    })
});

 */