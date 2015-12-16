var US = require('helpers/underscore')._;
var Utils = require('helpers/utils');

var SQR_DELTA = 50*50;

var GalaxyLayer = function(_data, _width, _height)
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
		minZoomScale: 0.1,
		maxZoomScale: 100,
		zoomScale: 1,
		opacity: 0
	});
	_self.ui.addEventListener('scrollend', onMove);
	_self.ui.addEventListener('dragend', onMove);
	
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
			
		_self.ui.opacity = 1;
		_self.ui.contentOffset = _lastOffset;
		_eventProxy.fireEvent('GalaxyLayer.move', {zoomScale: _self.ui.zoomScale, x: _lastOffset.x + _width*0.5, y: _lastOffset.y + _height*0.5, force: true});
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
	this.zoomIn = function(val)
	{
		_self.ui.zoomScale += val || 0.4;
		onMove();
	};

	//------------------------------------------------
	this.zoomOut = function(val)
	{
		_self.ui.zoomScale -= val || 0.4;
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
		_lastOffset = _self.ui.contentOffset;
		_eventProxy.fireEvent('GalaxyLayer.move', {zoomScale: _self.ui.zoomScale, x: _lastOffset.x + _width*0.5, y: _lastOffset.y + _height*0.5});
	}
};


//======================================================================================
var Star = function(_item, _viewParams, _galaxyLayer)
{
	var _self = this;
	var _size = _item.ui.width * _viewParams.scale;
	var _children = [];
	var _childrenContainer = null;
	var _focus = false;
	var _childrenPacked = false;
	var _active = true;
	var _dimmFunction = null;
	var _dimmVal = false;
	
	_self.radius = _size * 0.5;
	_self.x = _viewParams.x;
	_self.y = _viewParams.y;
	_self.viewParams = _viewParams;

	_self.ui = Ti.UI.createView({
		width: _item.ui.width,
		height: _item.ui.height,
		transform: Ti.UI.create2DMatrix().scale(_viewParams.scale, _viewParams.scale),
		left: _self.x - _item.ui.width*0.5 + _viewParams.center.x,
		top: _self.y - _item.ui.height*0.5 + _viewParams.center.y
	});
	_self.ui.add(_item.ui);
	_item.ui.addEventListener('singletap', onClick);
		
	//-------------------------------------
	this.layout = function(on)
	{
		var x = on ? _self.x : _viewParams.x;
		var y = on ? _self.y : _viewParams.y; 
		
		_self.ui.animate({
			left: x - _item.ui.width*0.5 + _viewParams.center.x,
			top: y - _item.ui.height*0.5 + _viewParams.center.y,
			duration: 1500
		}, function() {
			createChildren();
		});
	};

	//-------------------------------------
	this.onClose = function()
	{
		_active = false;
		
		_item.ui.removeEventListener('singletap', onClick);
		_item.ui.opacity = 1;
		if (_childrenContainer)
			_galaxyLayer.removeEventListener('GalaxyLayer.move', onGalaxyMove);

		_childrenContainer = null;
		for (var i=0; i<_children.length; i++)
		{
			var child = _children[i];
			child.onClose();
		}
		_children = null;
		_self.ui = null;
		_self = null;
	};

	//-------------------------------------
	this.dimm = function(dimmFunction, val)
	{
		_dimmFunction = dimmFunction;
		_dimmVal = val;
		
		dimmIt();
	};
	
	//-------------------------------------
	function createChildren()
	{
		if (!_active || !_item.children)
			return;
			
		var containerWidth = _item.ui.width*2;
		var containerHeight = _item.ui.height*2;	
			
		_childrenContainer = Ti.UI.createView({
			width: containerWidth,
			height: containerHeight,
			left: _self.x - containerWidth*0.5 + _viewParams.center.x,
			top: _self.y - containerHeight*0.5 + _viewParams.center.y,
			//transform: Ti.UI.create2DMatrix().scale(_viewParams.scale, _viewParams.scale),
			opacity: 0,
			touchEnabled: false
		});
		
		if (_galaxyLayer.ui)
			_galaxyLayer.ui.add(_childrenContainer);

		var numChildren = _item.children.length;
		var sortedChildren = US.sortBy(_item.children, function(child) {
			return child.scaleFactor;
		});
		
		for (var i=0; i<numChildren; i++)
		{
			var child = sortedChildren[i];
			
			var viewParams = {
				scale: Math.max(child.scaleFactor, 0.1),
				x: Math.random()*2 - 1,
				y: Math.random()*2 - 1,
				center: {x: containerWidth*0.5, y: containerHeight*0.5}
			};
			
			var childStar = new Star(child, viewParams, _galaxyLayer);
			_childrenContainer.add(childStar.ui);
			_children.push(childStar);
		}
		
		_galaxyLayer.addEventListener('GalaxyLayer.move', onGalaxyMove);
	}

	//---------------------------------------------------------
	function focusChildren()
	{
		var numChildren = _children.length;
		if (numChildren == 0)
			return;

		_childrenContainer.touchEnabled = _focus;
		
		if (_focus && !_childrenPacked)
		{
			packChildren();
		}
		
		dimmIt();

		animateChildren();
	}

	//--------------------------------------------
	function packChildren()
	{
		for (var iter=0; iter<5; iter++)
		{
			Utils.circlesPacking(_children, 2);
		}
		_childrenPacked = true;
	}

	//--------------------------------------------
	function animateChildren()
	{
		_childrenContainer.animate({
			opacity: _focus ? 1 : 0,
			duration: 1000
		});
				
		_item.ui.animate({
			opacity: _focus ? 0 : 1,
			duration: 1000
		});

		for (var i=0; i<_children.length; i++)
		{
			var child = _children[i];
			child.layout(_focus);
		}
	}

	//--------------------------------------------
	function dimmIt()
	{
		if (_dimmFunction == null)
			return;
		
		if (_focus)
		{
			for (var i in _children)
			{
				var child = _children[i];
				child.dimm(_dimmFunction, _dimmVal);
			}
			return;
		}
		
		if (_dimmFunction(_item))
		{
			_self.ui.animate({
				opacity: _dimmVal ? 0.1 : 1.0,
				duration: 1000
			});
		}
	}
	
	//-----------------------------------------------------------
	function onGalaxyMove(e)
	{
		var focus = false;
		var dx = e.x / e.zoomScale - (_self.x + _viewParams.center.x);
		var dy = e.y / e.zoomScale - (_self.y + _viewParams.center.y);
		var d = (dx*dx) + (dy*dy);
		if (d < SQR_DELTA && e.zoomScale*_viewParams.scale > 1.3)
		{
			focus = true;
		}
		
		if (!e.force && focus == _focus)
			return;
			
		_focus = focus;
		focusChildren();
	}

	//-------------------------------------
	function onClick(e)
	{
		_galaxyLayer.fireEvent('GalaxyLayer.starClicked', {item: _item});
	}
};


module.exports = GalaxyLayer;