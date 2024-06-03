function setupClick() {
    $("#consent-to-cookies-btn").click(function() {
        document.cookie = "accepted_cookies=true;"
        $(".cookiealert").fadeOut();
    })
}

function showAcceptanceFormIfNeeded() {
    var decodedCookie = decodeURIComponent(document.cookie);
    hasNotAccepted = document.cookie.search("accepted_cookies=true") == -1;
    if (hasNotAccepted) {
        $(".cookiealert").show();
    }
}

function onLoad() {
    setupClick();
    showAcceptanceFormIfNeeded();
}

module.exports = onLoad;