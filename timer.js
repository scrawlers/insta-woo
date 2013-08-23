exports.Timer =  function(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
    	clearInterval(timerId);
        remaining -= new Date() - start;
    };
    this.resume = function() {
        start = new Date();
        timerId = setInterval(callback, remaining);
    };
    this.resume();
}