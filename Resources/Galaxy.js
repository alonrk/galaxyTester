var US = require('helpers/underscore')._;
var Utils = require('helpers/utils');
var Star = require('Star');

var SQR_DELTA = 50*50;

var Galaxy = function(_data, _width, _height)
{
	var _self = this;
	var _eventProxy = Ti.createBuffer({value: "proxy"});
	var _empty = true;
	var _stars = [];
	var _lastOffset = {x: _width*0.5, y: _height*0.5};
	var _active = true;
	
	_self.ui = Ti.UI.createScrollView({
		width: _width,
		height: _height,
		contentWidth: _width*2,
		contentHeight: _height*2,
		minZoomScale: 1,
		maxZoomScale: 1,
		zoomScale: 1
	});
	//_self.ui.addEventListener('scrollend', onMove);
	//_self.ui.addEventListener('dragend', onMove);
	
	_self.ui.contentOffset = _lastOffset;
	
	layout();
	
	//--------------------------------------
	this.onClose = function()
	{
		_active = false;
		
		for (var i=0; i<_stars; i++)
		{
			var star = _stars[i];
			star.onClose();
		}
		_stars = null;
		
		_self.ui.removeEventListener('scrollend', onMove);
		_self.ui.removeEventListener('dragend', onMove);
		_self.ui = null;
		_self = null;
	};

	//--------------------------------------
	this.onFocus = function()
	{
		if (!_active)
			return;
			
		//_self.ui.opacity = 1;
		//_self.ui.contentOffset = _lastOffset;
		//_eventProxy.fireEvent('Galaxy.move', {zoomScale: _self.ui.zoomScale, x: _lastOffset.x + _width*0.5, y: _lastOffset.y + _height*0.5, force: true});
	};

	//--------------------------------------
	this.fireEvent = function(name, params)
	{
		_eventProxy.fireEvent(name, params);
	};

	//--------------------------------------
	this.addEventListener = function(name, callback)
	{
		_eventProxy.addEventListener(name, callback);
	};

	//--------------------------------------
	this.removeEventListener = function(name, callback)
	{
		_eventProxy.removeEventListener(name, callback);
	};

	//------------------------------------------------
	this.resetLocation = function()
	{
		_self.ui.zoomScale = 1;
		_self.ui.setContentOffset({x: _width*0.5, y: _height*0.5});
	};

	//------------------------------------------------
	this.clear = function()
	{
		if (!_active)
			return;
		
		_self.ui.removeAllChildren();
		_self.ui.zoomScale = 1;
		_self.ui.opacity = 0;
		
		for (var i=0; i<_stars.length; i++)
		{
			var star = _stars[i];
			star.onClose();
		}
		_stars = [];
	};
	
	//------------------------------------------------
	this.setData = function(data)
	{
		if (!_active)
			return;
		
		_self.clear();
		
		if (data)
			_data = data;
		
		layout();
	};

	//------------------------------------------------
	this.focus = function(scale, x, y)
	{
		_self.ui.setContentOffset({x: (x - _width*0.5), y: (y - _height*0.5)});
		
		var zoom = 1/scale;
		
		_self.ui.animate({
			transform: Ti.UI.create2DMatrix().scale(zoom, zoom),
			duration: 500
		});

		onMove();
	};

	//------------------------------------------------
	this.dimm = function(dimmFunction, val)
	{
		for (var i in _stars)
		{
			var star = _stars[i];
			star.dimm(dimmFunction, val);
		}
	};
	
	//------------------------------------------------
	function layout()
	{	
		if (!_active || !_data)
			return;
		
		var num_items = _data.length;
		
		var sortedData = US.sortBy(_data, function(item) {
			return item.scaleFactor;
		});
 	
 		for (var i=0; i<num_items; i++)
 		{
			var item = sortedData[i];

			var params = {
				scale: Math.max(item.scaleFactor, 0.3),
				x: Math.random()*2 - 1,
				y: Math.random()*2 - 1,
				center: {x: _width, y: _height}
			};

			var star = new Star(item, params, _self);
			_self.ui.add(star.ui);
			
			_stars.push(star);
		}
		
		// calc positions
		for (var iter=0; iter<4; iter++)
		{
			//var iterCounter = 1 + Math.floor(iter * 0.3);
			Utils.circlesPacking(_stars, 30);
		}

		_self.ui.animate({
			opacity: 1,
			duration: 1000
		});

		// layout stars
		for (var i=0; i<num_items; i++)
		{
			var star = _stars[i];
			star.layout(true);
		}
	}
	
	//-------------------------------------
	function onMove(e)
	{
		//_self.ui.transform = Ti.UI.create2DMatrix().scale(1,1);
		//_lastOffset = _self.ui.contentOffset;
		//_eventProxy.fireEvent('Galaxy.move', {zoomScale: _self.ui.zoomScale, x: _lastOffset.x + _width*0.5, y: _lastOffset.y + _height*0.5});
	}
};

module.exports = Galaxy;