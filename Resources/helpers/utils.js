
var YEARS_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000;
var MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;
var DAY_IN_MS = 24 * 60 * 60 * 1000;
var HOUR_IN_MS = 60 * 60 * 1000;
var MIN_IN_MS = 60 * 1000;
var SEC_IN_MS = 1000;

var TIMES = [{msTime: YEARS_IN_MS, text: "Year"}, {msTime: MONTH_IN_MS, text: "Month"}, {msTime: DAY_IN_MS, text: "Day"}, {msTime: HOUR_IN_MS, text: "Hour"}, {msTime: MIN_IN_MS, text: "Minute"}, {msTime: SEC_IN_MS, text: "Second"}];

exports.isiOS7Plus = function()
{
    // iOS-specific test
    if (Titanium.Platform.name == 'iPhone OS')
    {
        var version = Titanium.Platform.version.split(".");
        var major = parseInt(version[0],10);

        // Can only test this support on a 3.2+ device
        if (major >= 7)
        {
            return true;
        }
    }
    return false;
};

exports.parseUrl = function(url)
{
	var split = url.split("?");
	if (split.length <= 1)
		return {};
	
	var paramsStr = split[1];
	var paramsSplit = paramsStr.split("&");
	var keyValSplit = null;
	var params = {};
	for (var i=0; i<paramsSplit.length; ++i)
	{
		keyValSplit = paramsSplit[i].split("=");
		params[keyValSplit[0]] = keyValSplit[1];
	}
	
	return params;
};

exports.calcDistance = function(lat1, lon1, lat2, lon2)
{
	var R = 6371000;
    var dLat = (lat2-lat1) * Math.PI / 180;
    var dLon = (lon2-lon1) * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180 ) * Math.cos(lat2 * Math.PI / 180 ) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return Math.round(d);
};

exports.parseDate = function(date)
{
	var str = "";
	if (!date)
		return str;
		
	if (date.month)
		str += date.month + '/';
	if (date.day)
		str += date.day + '/';
	if (date.year)
		str += date.year;
		
	return str;
};

exports.loadJsonFile = function(path)
{
	// load json file
	var file = Ti.Filesystem.getFile(path);
	if (!file)
	{
		Ti.API.info("loadJsonFile: Failed to load: " + path);
		return null;
	}
	
	var json = file.read();
	
	return JSON.parse(json);
};

exports.loadHtmlFile = function(path)
{
	// load json file
	var file = Ti.Filesystem.getFile(path);
	if (!file)
	{
		Ti.API.info("loadHtmlFile: Failed to load: " + path);
		return null;
	}
	
	var data = file.read();
	
	return data;
};

exports.loadRemoteImage = function(url, successCallback)
{
	if (url == null)
		return;
		
	// check cache
	var md5url = Ti.Utils.md5HexDigest(url) + "." + this.getExtension(url);
	var file = Titanium.Filesystem.getFile(Titanium.Filesystem.applicationDataDirectory, md5url);
	if(file.exists())
	{
		var blob = file.read();
		successCallback(blob);
		return;
	}
	
	var xhr = Titanium.Network.createHTTPClient();
			 
    xhr.onload = function(e) {
    	// caching
    	file.write(e.source.responseData);
    	successCallback(e.source.responseData);
    };
    xhr.onerror = function(e) {
    	successCallback(null);
    };
    xhr.cache = true;
    xhr.setTimeout(30000);
    xhr.open('GET', url, true);
    xhr.send();
};

exports.isPhotoUrl = function(url)
{
	var urlExt = this.getExtension(url);
	return ((urlExt == "png") || (urlExt == "jpg") || (urlExt == "jpeg") || (urlExt == "gif"));
};

exports.getExtension = function(fn) 
{
    var re = /(?:\.([^.]+))?$/;
    var tmpext = re.exec(fn)[1];
    return (tmpext) ? tmpext : '';
};

exports.fbTimeToMS = function(fbTime)
{
	var b = fbTime.split(/[-t:+]/ig);
	return Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5]);
};

exports.getTimeDiffString = function(time)
{
	var currentDate = new Date();
	var itemDate = new Date(time);
	var diffInMs = currentDate - itemDate;
	
	var s = itemDate.toISOString();
	
	var text = "";
	var index = 0;
	var diff = 0;
	while (index < TIMES.length)
	{
		time = TIMES[index];
		diff = Math.floor(diffInMs / time.msTime);
		if (diff > 0)
		{
			text = diff.toString() + " " + time.text;
			if (diff > 1)
				text += "s";
			
			text += " ago";
			break;
		}
		
		++index;
	}
	
	if ((text.length == 0) && (diff == 0))
		text = "few seconds ago";
		
	return text;
};

exports.capitalizeFirstLetter = function(str)
{
	if (!str || !str.length)
		return "";
		
	return str.charAt(0).toUpperCase() + str.slice(1, str.length);
};

exports.capitalizeInitials = function(str)
{
    if (!str)
        return "";
        
	var split = str.split(/[ -]+/);
	var newStr = "";
	for (var i=0; i<split.length; ++i)
	{
		newStr += split[i].charAt(0).toUpperCase() + split[i].slice(1, split[i].length);
		if (str.length > newStr.length)
			newStr += str.charAt(newStr.length);
	}
		
	return newStr;
};

exports.personFirstName = function(name, capitalizeInitials)
{
	var split = name.split(/[ ]+/);
	if (capitalizeInitials == undefined)
		capitalizeInitials = true;
	return capitalizeInitials ? this.capitalizeInitials(split[0]) : split[0];
};

exports.getParamFromUrl = function(url, paramName)
{
	var result = "";
	paramName = paramName.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + paramName + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(url);
	
	if(results)
	    result =  decodeURIComponent(results[1].replace(/\+/g, " "));;
	    
	    
	return result; 
};

exports.getResizedFBPhoto = function(url, size)
{
	var result = "";
	if (url.search("_s.") >= 0)
	{
		var index = url.lastIndexOf("/");
		if (index > 0)
		{
			var part1 = url.slice(0, index);
			var part2 = url.slice(index, url.length);
			part2 = part2.replace("_s.", "_n.");
			part1 += (String.format("/s%dx%d", size, size)  + part2);
			result = part1;
		}
	}
	
	return result;
};

exports.getYTVideoId = function(ytUrl)
{
	if (!ytUrl)
		return null;
			
	var videoId = null;
	var regExp = /https?:\/\/(?:[a-zA_Z]{2,3}.)?(?:youtube\.com\/watch\?)((?:[\w\d\-\_\=]+&amp;(?:amp;)?)*v(?:&lt;[A-Z]+&gt;)?=([0-9a-zA-Z\-\_]+))/i.exec(ytUrl);
	if (regExp && (regExp.length >= 3))
		videoId = regExp[2];
	
	return videoId;
};

exports.getWebviewThumb = function(webview)
{
	var imagesEval = webview.evalJS('var images = document.images; var result = ""; for(var i=0; i<images.length; i++) {result += images[i].src + "," + images[i].width + "," + images[i].height + ",";}');
	var thumb = null;
	if (imagesEval == null)
		return null;
	
	var imagesSplit = imagesEval.split(",");
	if (!imagesSplit || (imagesSplit.length == 0))
		return null;
		
	var imageIndex = 0;
	var maxSize = -1;
	var size = 0;
	Ti.API.info("getWebviewThumb - url: " + webview.url + " splitLength: " + imagesSplit.length);
	while (imageIndex < imagesSplit.length / 3)
	{
		size = imagesSplit[imageIndex + 1] * imagesSplit[imageIndex + 2];
		if (size > maxSize)
		{
			thumb = imagesSplit[imageIndex];
			maxSize = size;
		}  
		imageIndex += 3;
	}
	
	return thumb;
};
	
//----------------------------------------------------------
// Returns an array of start&end indexes objects of urls
//----------------------------------------------------------
exports.getUrlIndexes = function(text)
{
	var match, indexes = [];
	var regexp = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
	while (match = regexp.exec(text))
		indexes.push({start: match.index, end: match.index + match[0].length});
    	
	return indexes;
};

// -------------------------------------------
exports.circlesPacking = function(circles, delta) 
{
	var Syl = require('helpers/sylvester');

	//fix overlaps
	var ci, cj;
	var v = Syl.Vector.create([0,0,0]);

	for (var i=0; i<circles.length; i++) 
	{
		ci = circles[i];
		for (var j=i+1; j<circles.length; j++) {
			cj = circles[j];
			var dx = cj.x - ci.x;
			var dy = cj.y - ci.y;
			var r = ci.radius + cj.radius + delta;
			var d = (dx*dx) + (dy*dy);
			if (d < (r * r) - 0.01 ) {
				v.setElements([dx,dy,0]);
		
		        v = v.toUnitVector();
		        v = v.multiply((r-Math.sqrt(d))*0.5);
		
				cj.x += v.e(0);
	        	cj.y += v.e(1);
		
		        ci.x -= v.e(0);
		        ci.y -= v.e(1);       
	    	}
		}
	}

  //Contract
 /* var damping = 0.2/iterationCounter;
  for (var i=0; i<circles.length; i++) {
    var c = circles[i];
	v.setElements([c.x-width/2, c.y-height/2, 0]);
	v = v.multiply(damping);
	c.x -= v.e(0);
	c.y -= v.e(1);
  }*/
};

exports.spreadAround = function(circles, radius) 
{
	var angle = 2*Math.PI / circles.length;
	
	for (var i=0; i < circles.length; i++)
	{
		var ci = circles[i];
		ci.x = (radius + ci.radius)*Math.cos(angle*i); 
		ci.y = (radius + ci.radius)*Math.sin(angle*i);
	}		
};
