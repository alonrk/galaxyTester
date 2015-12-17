var US = require('helpers/underscore')._;
var Utils = require('helpers/utils');

var Star = function(_item, _viewParams, _galaxy)
{
	var _self = this;
	_self.viewParams = _viewParams;
	var _size = _item.ui.width * _self.viewParams.scale;
	var _connections = [];
	var _focus = false;
	var _connectionsPacked = false;
	var _active = true;
	var _dimmFunction = null;
	var _dimmVal = false;
	
	_self.radius = _size * 0.5;
	_self.x = _self.viewParams.x;
	_self.y = _self.viewParams.y;

	_self.ui = Ti.UI.createView({
		width: _item.ui.width,
		height: _item.ui.height,
		transform: Ti.UI.create2DMatrix().scale(_self.viewParams.scale, _self.viewParams.scale),
		left: _self.x - _item.ui.width*0.5 + _self.viewParams.center.x,
		top: _self.y - _item.ui.height*0.5 + _self.viewParams.center.y
	});
	_self.ui.add(_item.ui);
	_item.ui.addEventListener('singletap', onClick);
		
	//-------------------------------------
	this.layout = function(on)
	{
		var x = on ? _self.x : _self.viewParams.x;
		var y = on ? _self.y : _self.viewParams.y; 
		
		_self.ui.animate({
			left: x - _item.ui.width*0.5 + _self.viewParams.center.x,
			top: y - _item.ui.height*0.5 + _self.viewParams.center.y,
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
	//		_galaxy.removeEventListener('Galaxy.move', onGalaxyMove);

		for (var i=0; i<_connections.length; i++)
		{
			var connection = _connections[i];
			connection.onClose();
		}
		_connections = null;
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
	this.addConnections = function(connections)
	{
		var numConnections = connections.length;
		var sortedConnections = US.sortBy(connections, function(connection) {
			return connection.scaleFactor;
		});
		
		for (var i=0; i<numConnections; i++)
		{
			var connection = sortedConnections[i];
			
			var viewParams = {
				scale: _self.viewParams.scale * Math.max(connection.scaleFactor, 0.1),
				x: Math.random()*2 - 1,
				y: Math.random()*2 - 1,
				center: {x: _self.x + _self.viewParams.center.x, y: _self.y + _self.viewParams.center.y}
			};
			
			var connectionStar = new Star(connection, viewParams, _galaxy);
			_galaxy.ui.add(connectionStar.ui);
			_connections.push(connectionStar);
		}

		_focus = true;
		focusConnections();
	};

	//---------------------------------------------------------
	function focusConnections()
	{
		var numConnections = _connections.length;
		if (numConnections == 0)
			return;

		if (_focus && !_connectionsPacked)
		{
			packConnections();
		}
		
		dimmIt();

		animateConnections();
	}

	//--------------------------------------------
	function packConnections()
	{
	//	for (var iter=0; iter<5; iter++)
	//	{
	//		Utils.circlesPacking(_connections, 10);
	//	}
	
		Utils.spreadAround(_connections, _self.radius*1.5);
		_connectionsPacked = true;
	}

	//--------------------------------------------
	function animateConnections()
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

		for (var i=0; i<_connections.length; i++)
		{
			var connection = _connections[i];
			connection.layout(_focus);
		}
	}

	//--------------------------------------------
	function dimmIt()
	{
		if (_dimmFunction == null)
			return;
		
		if (_focus)
		{
			for (var i in _connections)
			{
				var connection = _connections[i];
				connection.dimm(_dimmFunction, _dimmVal);
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
		var dx = e.x / e.zoomScale - (_self.x + _self.viewParams.center.x);
		var dy = e.y / e.zoomScale - (_self.y + _self.viewParams.center.y);
		var d = (dx*dx) + (dy*dy);
		if (d < SQR_DELTA && e.zoomScale*_self.viewParams.scale > 1.3)
		{
			focus = true;
		}
		
		if (!e.force && focus == _focus)
			return;
			
		_focus = focus;
		focusConnections();
	}

	//-------------------------------------
	function onClick(e)
	{
		_galaxy.focus(_self.viewParams.scale, _self.x + _self.viewParams.center.x, _self.y + _self.viewParams.center.y);
		
		//_galaxy.fireEvent('Galaxy.starClicked', {item: _item});
		if (_item.onClick)
			_item.onClick(_self);
			
		// only one time	
		_item.onClick = null;
	}
};

module.exports = Star;
