var Galaxy = require('Galaxy');

// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#000');

// create tab group
var tabGroup = Titanium.UI.createTabGroup();


//
// create base UI tab and root window
//
var win1 = Titanium.UI.createWindow({  
    title:'Tab 1',
    backgroundColor:'#fff'
});
var tab1 = Titanium.UI.createTab({  
    icon:'KS_nav_views.png',
    title:'Tab 1',
    window:win1
});

var label1 = Titanium.UI.createLabel({
	color:'#999',
	text:'I am Window 1',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});

// ------------------------ galaxy -----------------------------

function createItemUI(item) {
	var ui = Ti.UI.createView({
		width: 100,
		height: 100,
		opacity: 0.5
	});
	
	var bg = Ti.UI.createMaskedImage({
		mask: "images/white_circle_250_pix.png",
		tint: 'red'
	});
	
	var label = Ti.UI.createLabel({
		top: 60,
		text: item.title,
		color: 'white'
	});
	
	ui.add(bg);
	ui.add(label);
	
	return ui;
}

function onItemClick(star) {
	var connections = [];
	for (var i=0; i<5; i++) {
		var item = {
			title: 'golem',
			type: 'person',
			scaleFactor: Math.random()*0.5 + 0.5
		};
		
		item.ui = createItemUI(item);
		item.onClick = onItemClick;
		
		connections.push(item);
	}
	
	star.addConnections(connections);
}

function generateGalaxyData() {
	var data = [];
	
	var person = {
		title: 'vova',
		type: 'person',
		scaleFactor: 1
	};
	
	person.ui = createItemUI(person);
	person.onClick = onItemClick;
	data.push(person);
	
	return data;
}

var data = generateGalaxyData();

var galaxy = new Galaxy(data, 1000, 1000);

win1.add(galaxy.ui);



// ------------------------ galaxy -----------------------------


//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({  
    title:'Tab 2',
    backgroundColor:'#fff'
});
var tab2 = Titanium.UI.createTab({  
    icon:'KS_nav_ui.png',
    title:'Tab 2',
    window:win2
});

var label2 = Titanium.UI.createLabel({
	color:'#999',
	text:'I am Window 2',
	font:{fontSize:20,fontFamily:'Helvetica Neue'},
	textAlign:'center',
	width:'auto'
});

win2.add(label2);



//
//  add tabs
//
tabGroup.addTab(tab1);  
tabGroup.addTab(tab2);  


// open tab group
tabGroup.open();


// added during app creation. this will automatically login to
// ACS for your application and then fire an event (see below)
// when connected or errored. if you do not use ACS in your
// application as a client, you should remove this block
(function(){
var ACS = require('ti.cloud'),
    env = Ti.App.deployType.toLowerCase() === 'production' ? 'production' : 'development',
    username = Ti.App.Properties.getString('acs-username-'+env),
    password = Ti.App.Properties.getString('acs-password-'+env);

// if not configured, just return
if (!env || !username || !password) { return; }
/**
 * Appcelerator Cloud (ACS) Admin User Login Logic
 *
 * fires login.success with the user as argument on success
 * fires login.failed with the result as argument on error
 */
ACS.Users.login({
	login:username,
	password:password,
}, function(result){
	if (env==='development') {
		Ti.API.info('ACS Login Results for environment `'+env+'`:');
		Ti.API.info(result);
	}
	if (result && result.success && result.users && result.users.length){
		Ti.App.fireEvent('login.success',result.users[0],env);
	} else {
		Ti.App.fireEvent('login.failed',result,env);
	}
});

})();

