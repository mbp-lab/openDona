function isMobile() {

    var userAgent = navigator.userAgent.toLowerCase(),
        width = screen.availWidth,
        height = screen.availHeight,
        userIsOnMobileDevice = checkIfUserIsOnMobileDevice(userAgent);

    if(userIsOnMobileDevice) {
        //alert("@messages("landing.mobileAlert")")
        return true
    } else {
        return false
    }

    function checkIfUserIsOnMobileDevice($userAgent) {
        if($userAgent.includes('mobi') || $userAgent.includes('tablet')){
            return true;
        }
        if($userAgent.includes('android')) {
            if(height > width && width < 800) {
                // Screen is higher than it’s wide, so we have portrait mode
                return true;
            }
            if(width > height && height < 800) {
                // Screen is wider than it’s high, so we have landscape mode
                return true;
            }
        }
        return false;
    }

}

module.exports = {
    isMobile
}