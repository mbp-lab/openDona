var handleCookieAcceptance = require('./handleCookieAcceptance');
var addListeners = require('./listeners');
const Gifffer = require('gifffer');

$(document).ready(function () {


  handleCookieAcceptance();
  addListeners();
  Gifffer();

});