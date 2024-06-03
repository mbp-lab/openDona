const fs = require('fs');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const jsdom = require('jsdom');
//const handleFile = require('../../../parsing/facebook/facebookZipFileHandler');

chai.use(chaiAsPromised);
const expect = require('chai').expect;
const assert = require('chai').assert;

const { JSDOM } = jsdom;
const { document } = (new JSDOM('')).window;
global.document = document;
const window = document.defaultView;
global.window = window;
global.$ = require('jquery');

// this test is not working anymore with the zipjs library - because it uses client specific modules
/*
describe('Unzip file', function () {
    let validInputZip = fs.readFileSync("javascripts/test/resources/validZip.zip");
    let invalidInputZip = fs.readFileSync("javascripts/test/resources/invalidZip.zip");
    validInputZip = new Blob([validInputZip])
    invalidInputZip = new Blob([invalidInputZip])
    it('should not throw processing a valid zip file', function () {
        expect(handleFile([validInputZip])).not.to.throw;
    });

    it('should reject processing an invalid zip file containing no message.zip', function () {
        const promise = handleFile([invalidInputZip]);
        return assert.isRejected(promise);
    })
});

 */