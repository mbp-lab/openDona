const messageValidation = require('../../../parsing/shared/validateMessage.js');
const expect = require('chai').expect;

describe('Validating ', function() {
    const validMessage = {
        'sender_name': "Bleh Blah",
        'content': "This is some content",
        'timestamp_ms': "timestamp",
        'some_other_attribute': "some_value"
    };
    const invalidNoSenderMessage = {
        'content': "This is some content",
        'timestamp_ms': "timestamp",
        'some_other_attribute': "some_value"
    };
    const invalidNoContentMessage = {
        'sender_name': "Bleh Blah",
        'timestamp_ms': "timestamp",
        'some_other_attribute': "some_value"
    };
    const invalidNoTimestampMessage = {
        'sender_name': "Bleh Blah",
        'content': "This is some content",
        'some_other_attribute': "some_value"
    };

    it('a valid message should return true', function () {
        expect(messageValidation(validMessage)).to.equal(true);
    });

    it('an invalid message with no sender_name should return false', function () {
        expect(messageValidation(invalidNoSenderMessage)).to.equal(false);
    });

    it('an invalid message with no content should return false', function () {
        expect(messageValidation(invalidNoContentMessage)).to.equal(false);
    });

    it('an invalid message with no timestamp_ms should return false', function () {
        expect(messageValidation(invalidNoTimestampMessage)).to.equal(false);
    });

});