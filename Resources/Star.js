var US = require('helpers/underscore')._;
var Utils = require('helpers/utils');

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
			//createChildren();
		});
	};

	//-------------------------------------
	this.onClose = function()
	{
		_active = false;
		
		_item.ui.removeEventListener('singletap', onClick);
		_item.ui.opacity = 1;
	//	if (_childrenContainer)
	//		_galaxyLayer.removeEventListener('GalaxyLayer.move', onGalaxyMove);

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
			width: Ti.UI.FILL,//containerWidth,
			height: Ti.UI.FILL,//containerHeight,
			left: _self.x - containerWidth*0.5 + _viewParams.center.x,
			top: _self.y - containerHeight*0.5 + _viewParams.center.y,
			//transform: Ti.UI.create2DMatrix().scale(_viewParams.scale, _viewParams.scale),
			//opacity: 0,
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
		
	//	_galaxyLayer.addEventListener('GalaxyLayer.move', onGalaxyMove);
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
		/*
		_childrenContainer.animate({
			opacity: _focus ? 1 : 0,
			duration: 1000
		});
				
		_item.ui.animate({
			opacity: _focus ? 0 : 1,
			duration: 1000
		});
		*/

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
		//_galaxyLayer.fireEvent('GalaxyLayer.starClicked', {item: _item});
		_focus = true;
		focusChildren();
	}
};

module.exports = Star;
