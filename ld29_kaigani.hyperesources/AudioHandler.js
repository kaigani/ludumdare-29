/**
 * @author Kaigani <kai@kaigani.com>
 */


/**
 * An AudioHandler class for HTML5 Audio API 
 *
 * @module CTRL
 *
 */

/*
 * Begin closure
 */

(function(){

    "use strict";
/*
 * Start class function
 */

    var AudioHandler = function(){};

    var p = AudioHandler.prototype;

    // Properties
    p.context = new webkitAudioContext();
    p.buffer = null;

    p.playSoundUrl = function(url) {

        // Load asynchronously

        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        request.onload = function() {
            
            p.buffer = p.context.createBuffer(request.response, false);
            p.playBuffer();
        };

        request.onerror = function() {
            console.log("error loading");
        };

        request.send();
    };

    p.playBuffer = function(){

        var source = p.context.createBufferSource();

        // Set buffer on source
        source.buffer = p.buffer;
        source.loop = false;
        source.connect(p.context.destination);

        // Try to start sources at the same time
        //var time = context.currentTime + 0.020;
        source.start(0);
        
    };

/*
 * End closure
 */

 this.AudioHandler = AudioHandler;

 // Server / Client module definition  seen on http://caolanmcmahon.com/posts/writing_for_node_and_the_browser/
 // Not going to worry about cross compatibility since this is a web library

}).call(this);