const expect = require('chai').expect;
const wordCount = require('../stringWordCount');


describe('Counting words in a', function () {
    const validString = "this is a test string;";
    it('normal string should return number of words', function () {
        expect(wordCount(validString)).to.equal(5);
    })
    const emptyString = "";
    it('n empty string should return 0', function () {
        expect(wordCount(emptyString)).to.equal(0);
    })
    const whiteSpaceString = " \t ";
    it('string with only whitespaces should return 0', function () {
        expect(wordCount(whiteSpaceString)).to.equal(0);
    })
    const stringWithEndingWhitespace = "this  \t";
    it('string with ending whitespace should return 1', function () {
        expect(wordCount(stringWithEndingWhitespace)).to.equal(1);
    })
})