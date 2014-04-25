//
// Utilities
//

// add radian & degrees conversion
Math.rad = function(degrees) {
  return degrees * Math.PI / 180;
};

Math.deg = function(radians) {
  return radians * 180 / Math.PI;
};

// Convert to & from vector
function vectorToPoint(v){
	return({x:v.e(1),y:v.e(2)});
}
//
// see http://gamedev.stackexchange.com/questions/45412/understanding-math-used-to-determine-if-vector-is-clockwise-counterclockwise-f

// uses vectors defined as {x:N,y:N} - use vectorObject()
function vectorSign(v1,v2){

	var clockwise = 1;
	var anticlockwise = -1;

	if(v1.y*v2.x > v1.x*v2.y){
		return anticlockwise;
	}else{
		return clockwise;
	}
}

// getJSON
var getJSON = function(url, successHandler, errorHandler) {
  var xhr = typeof XMLHttpRequest != 'undefined'
    ? new XMLHttpRequest()
    : new ActiveXObject('Microsoft.XMLHTTP');
  xhr.open('get', url, true);
  xhr.onreadystatechange = function() {
    var status;
    var data;
    // http://xhr.spec.whatwg.org/#dom-xmlhttprequest-readystate
    if (xhr.readyState == 4) { // `DONE`
      status = xhr.status;
      if (status == 200) {
        //data = JSON.parse(xhr.responseText);
        data = xhr.responseText;
        successHandler && successHandler(data);
      } else {
        errorHandler && errorHandler(status);
      }
    }
  };
  xhr.send();
};