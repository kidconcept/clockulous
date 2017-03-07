var clockulous = (function() {

	var global = {}

// ===================================
// INITIALIZE VARIABLES AND OBJECTS AND TEMPLATES AND EVENTS
// ===================================

	var userTime = new Date(); // For adding new clocks
	var ZONES = []; // Holds Data Model
	var SETTINGS = {};
	SETTINGS.firstTimeSearch = true; // run tutorial popup on search
	SETTINGS.firstTimeTravel = true; // run tutorial popup on timetravel
	SETTINGS.amPm = true; //12 Hour Clock by default
	SETTINGS.timeTravel = false; // Display Time Travel Offset
	SETTINGS.timeTravelOffset = 0;
	SETTINGS.theme = "day";
	var toolTips = {};
	var isMenuOpen = false;
	var modes = {};
	modes.timeTravelAmPm = "AM";
	modes.timeTravelMeta = "off";
	modes.offline = false;
	var daysOfTheWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	//The Clocks Blocks
	var app = document.getElementById("app");
	var clocksBox = document.getElementById("clocksBox");
	var ct = document.getElementById("template");
	var addClockElement = document.getElementById("addClockElement");

	//Key Commands
	window.addEventListener('keydown', keyCommands);
	function keyCommands(event) {
		key = event.key;
		if (key === "Escape" || key === "Esc") {
			global.noTimeTravel();
		}
		//if (key === "c") addClock();
		//if (key === "x") removeClock();
	}

// ===================================
// Utilities
// ===================================

	function removeClasses(array, html) {
		array.forEach( function(element) {
			html.classList.remove(element)
		})
	}

	function addClasses(array, html) {
		array.forEach( function(element) {
			html.classList.add(element)
		})
	}

// ===================================
// TEMPLATE OBJECT, CLASSES, AND DATA-INDEX
// ===================================

	//Clocks Template Event Listeneres
	function addEventListeners(index) {
		ct.removeBtn[index].addEventListener('click', removeClock);
		ct.rawOffset[index].addEventListener('input', editGmt);
		ct.time[index].addEventListener('mousedown', timeTravel);
		ct.local[index].addEventListener('keydown', saveLocal);
		//ct.time[index].addEventListener('mousedown', timeTravelMouse);
		ct.timeTravelMeta[index].addEventListener('click', timeTravelMeta);
		ct.dstMeta[index].addEventListener('click', editDst);
	}

	//Defines template object and recursivly applys classes to Template
	function readTemplate(current) {
		if(current.children) { //check to make sure it's not undefined
			let children = current.children;
			for(let i = 0, l = children.length; i < l; i++) {
				if(current.children[i].classList) {
					let className = children[i].classList[0];
					if(className) ct[className] = clocksBox.getElementsByClassName(className);
				}
			  readTemplate(children[i]);
			}
		}
	}
	readTemplate(ct);

	//Adds data-index to template elements that need it.
	function setIndex() {
		for(let i=0,len=clocksBox.children.length;i<len;i++) {
			ct.inner[i].setAttribute('data-index', i);
			ct.removeBtn[i].setAttribute('data-index', i);
			ct.rawOffset[i].setAttribute('data-index', i);
			ct.time[i].setAttribute('data-index', i);
			ct.timeInput[i].setAttribute('data-index', i)
			ct.timeTravelMeta[i].setAttribute('data-index', i);
			ct.dstMeta[i].setAttribute('data-index', i);
			ct.amPmMeta[i].setAttribute('data-index', i);
			ct.switch[i].setAttribute('data-index', i);
			ct.local[i].setAttribute('data-index', i);
		}
		//check if their are too many clocks
		ZONES.length >= 9 ? addClockElement.classList.add("hidden") : addClockElement.classList.remove("hidden");
	}

// ===================================
// TIME ZONE OBJECTS. Generate and Format Zone Objects
// ===================================

	// A class to create new Zone Objects
	function LocalizeZones(local, timeZoneId, rawOffset, dstOffset, latLng) {
		this.local = local;
		this.timeZoneId = timeZoneId;
		this.rawOffset = rawOffset;
		this.dstOffset = dstOffset;
		this.latLng = latLng;
	}

	//format the clock time, AMPM, and date
	displayTime = function(rawOffset, dstOffset, index) {
		let zoneTime = new Date();
		let dateTime = [];
		// Offset Hours for Time Travel
		if(SETTINGS.timeTravel) {
		  zoneTime.setUTCSeconds( zoneTime.getUTCSeconds() + rawOffset + dstOffset + SETTINGS.timeTravelOffset);
		} else zoneTime.setUTCSeconds( zoneTime.getUTCSeconds() + rawOffset + dstOffset);
		let time = {
		  hours: zoneTime.getUTCHours(),
		  minutes: String( "0" + zoneTime.getUTCMinutes() ).slice(-2)
		};
		// Day and Date
		rd = zoneTime.getUTCDate();
		let fancyDate;
		if (rd === 1 || rd === 21 || rd === 31) {
			fancyDate = rd + "<span class='suffix'>st</span>"}
		else if (rd === 2 || rd === 22) {
			fancyDate = rd + "<span class='suffix'>nd</span>"}
		else if (rd === 3 || rd === 23) {
			fancyDate = rd + "<span class='suffix'>rd</span>"}
		else {
			fancyDate = rd + "<span class='suffix'>th</span>"}
		let day = "<span>"+daysOfTheWeek[zoneTime.getUTCDay()] + ", the </span>";
		dateTime.push(day + fancyDate);
		// Display 12 or 24 Hour format
		let clockAmPm;
		time.hours < 12 ? clockAmPm = "AM" : clockAmPm = "PM";
		if(SETTINGS.amPm) { // 12 Hour
		  time.hours = time.hours % 12;
		  if (time.hours == 0) time.hours = 12;
		}
		dateTime.push('<span>'+time.hours+'</span>'+'<span>:</span>'+'<span>'+time.minutes+'</span>');
		dateTime.push(clockAmPm);
		return dateTime;
	}

	//Initilize the Zone Objects from local Storage
	function initialize() {
		if(localStorage.ZONES.length > 2) {
			let SAVE = JSON.parse(localStorage.ZONES);
			ZONES = [];
			SAVE.forEach( function(e) {
		 		ZONES.push( new LocalizeZones(e.local, e.timeZoneId, e.rawOffset, e.dstOffset, e.latLng) );
		 		drawClock(); })}
		else { addClock(); }
		if(localStorage.SETTINGS) SETTINGS = JSON.parse(localStorage.SETTINGS);
		if(SETTINGS.firstTimeSearch) initTutorial();
		swapTheme();
		showHideAmPmMeta();
		initMenu();
		initScaling();
		checkZoneUpdates();
	}

// ===================================
// SETTINGS AND MENU
// ===================================

	//Elements
	let amPMSetting = document.getElementById("amPmSetting");
	let menu = document.getElementById("menu");
	let menuBg = document.getElementById("menuBg");
	let menuButtonOpen = document.getElementById("menuButtonOpen");
	let menuButtonClose = document.getElementById("menuButtonClose");
	let themeSetting = document.getElementById("themeSetting")

	//Settings
	amPmSetting.addEventListener('click', captureMenu);
	themeSetting.addEventListener('click', captureMenu);

	//Homepage buttons
	addClockElement.addEventListener('click', addClock);
	menuButtonOpen.addEventListener('click', openCloseMenu);
	menuButtonClose.addEventListener('click', openCloseMenu);

	function captureMenu() {
		SETTINGS.amPm = !amPmSetting.checked;
		themeSetting.checked ? SETTINGS.theme = THEMES[1] : SETTINGS.theme = THEMES[0];
		showHideAmPmMeta();
		stoppedClock();
		swapTheme();
		save();
	}

	function initMenu() {
		amPmSetting.checked = !SETTINGS.amPm;
		themeSetting.checked = (SETTINGS.theme === "night");
	}

	function openCloseMenu() {
		let h = menuBg.offsetHeight;
		if (isMenuOpen) {
			isMenuOpen = false;
			Velocity(menu, { top: -h }, 200, function() {
				menu.setAttribute("style", "");
				menu.classList.remove("open");
			});
		} else {
			isMenuOpen = true;
			Velocity(menu, { top: 0 }, 200, function() {
				menu.setAttribute("style", "");
				menu.classList.add("open");
			});
		}
	}

// ===================================
// TUTORIAL
// ===================================

	function initTutorial() {
		addClockElement.addEventListener('click', timeTravelToolTip);
		ct.local.item(0).addEventListener('click', searchToolTip);
	}

	function searchToolTip(event) {
		toolTips.search = document.createElement('span');
		addClasses(["tool-tip", "locations"], toolTips.search);
		event.target.insertAdjacentElement('beforebegin', toolTips.search);
		toolTips.search.innerHTML = event.target.getAttribute("data-tip");
		ct.local.item(0).removeEventListener('click', searchToolTip);
		SETTINGS.firstTimeSearch = false;
		toolTips.search.addEventListener('click', function() {
			toolTips.search.parentNode.removeChild(toolTips.search)});
	}

	function timeTravelToolTip() {
		toolTips.timeTravel = document.createElement('span');
		addClasses(["tool-tip", "time-travel"], toolTips.timeTravel);
		ct.time.item(1).insertAdjacentElement('beforebegin', toolTips.timeTravel);
		toolTips.timeTravel.innerHTML = ct.time.item(1).getAttribute("data-tip");

		addClockElement.removeEventListener('click', timeTravelToolTip);
		SETTINGS.firstTimeTravel = false;
		toolTips.timeTravel.addEventListener('click', function() {
			toolTips.timeTravel.parentNode.removeChild(toolTips.timeTravel)});
	}

// ===================================
// Theme
// ===================================

	let THEMES = ["day", "night"];

	function swapTheme() {
		removeClasses(THEMES, document.body);
		document.body.classList.add(SETTINGS.theme);
	}

// ===================================
// Easter Egg
// ===================================

	var quotes = [
		'“It is often said that before you die your life passes before your eyes. This is in fact true. It\'s called living.” <span>Terry Pratchett</span>',
		'“and so do all who live to see such times. But that is not for them to decide. All we have to decide is what to do with the time that is given us.” <span>J.R.R. Tolkien</span>',
		'“Let the Colorado River erode its bed by 1/100th of an inch each year (about the thickness of one of your fingernails.) Multiply it by six million years, and you’ve carved the Grand Canyon.” <span>Keith Meldahl</span>',
		'“Everything alive today sits on the tip of the billions of years of life that came before us” <span>el lobzo</span>',
		'“It is not enough to be busy. So are the ants. The question is: What are we busy about?” <span>Henry David Thoreau</span>',
		'“In the presence of eternity, the mountains are as transient as the clouds” <span>Ralph Ingersoll</span>',
		'“We are the legacy of 15 billion years of cosmic evolution. We have a choice. We can enhance life and come to know the universe that made us. Or we can squander our 15 billion year heritage in meaningless self destruction.” <span>Carl Sagan</span>'
	]

	eggCase = document.getElementById("egg");

	function printQuote() {
		let date = new Date();
		let today = date.getUTCDay();
		todaysQuote = quotes[today%quotes.length];
		eggCase.innerHTML = todaysQuote;
		eggCase.classList.remove('hidden');
		clocksBox.classList.add('hidden');
	}

	function clearQuote() {
		eggCase.innerHTML = '';
		eggCase.classList.add('hidden');
		clocksBox.classList.remove('hidden');
	}

// ===================================
// SCALING FOR CLOCKS AND AUTOCOMPLETE
// ===================================

	wrapper = document.getElementById('wrapper');
	let pacContainers = document.getElementsByClassName('pac-container');

	function initScaling() {
		window.addEventListener("resize", scaleClocksBox);
		wrapperClasses();
		scaleClocksBox();
	}

	function getScale() {
		let scale = Math.min(
			wrapper.clientWidth / clocksBox.clientWidth,
			wrapper.clientHeight / clocksBox.clientHeight );
		return scale;
	}

	function scaleClocksBox() {
		clocksBox.style.transform = "translate(-50%, -50%)" + "scale(" + getScale() + ")";
		for (let i = 0;i<pacContainers.length;i++) pacContainers[i].style.transform = "scale(" + getScale() + ")";
	}

	function scaleAutoComplete(index) {
	}

	let clockClasses = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

	function wrapperClasses() {
		let n = ct.time.length;
		removeClasses(clockClasses, app);
		app.classList.remove(clockClasses.toString());
		app.classList.add(clockClasses[n]);
	}

	function touchLocal() {
		this.select();
		index = this.getAttribute('data-index');
		scaleAutoComplete(index);
	}

// ===================================
// TIME META BUTTON FUNCTIONS (timeTravel, DST, AM/PM)
// ===================================

	var timeTravelMeta = function(event) {
		index = event.target.getAttribute('data-index');
		ele = ct.timeInput[index];
		if(modes.timeTravelMeta === "off") {
			modes.timeTravelMeta = "submit";
			timeTravel(ele, "element");}
		else if (modes.timeTravelMeta === "submit") {
			success = global.submitTimeFilter(ele, index);
			if(success) modes.timeTravelMeta = "cancel";}
		else if (modes.timeTravelMeta === "cancel") {
			modes.timeTravelMeta = "off";
			global.noTimeTravel();
		}
	}

	timeTravelMeta.updateClasses = function(index, all) {
		theThing = index
		ttMeta = ct.timeTravelMeta[index];
		for(let i=0;i<ct.timeTravelMeta.length;i++) {
			ct.timeTravelMeta[i].classList.remove("cancel","off","submit");
			if(all) ct.timeTravelMeta[i].classList.add(modes.timeTravelMeta);}
		ttMeta.classList.add(modes.timeTravelMeta);
	}

	function dstMeta(index) {
		ZONES[index].dstOffset ? ct.dstMeta[index].classList.add('isDayLightSavings') : ct.dstMeta[index].classList.remove('isDayLightSavings');
	}

	function amPmMeta(index, clockAmPm) {
		clockAmPm === "AM" ? ct.display[index].classList.remove("pm") : ct.display[index].classList.add("pm")
	}

	// For switching between 12 and 24 hour clocks
	function showHideAmPmMeta() {
		for(let i=0;i<ct.amPmMeta.length;i++) {
			SETTINGS.amPm ? ct.amPmMeta[i].classList.remove("hidden") : ct.amPmMeta[i].classList.add("hidden");
		}
	}

	// For amPmTimeTravel
	function amPmTimeTravel(mode, index) {
		if (mode === "start") {
			modes.timeTravelAmPm = "AM";
			ct.switch[index].classList.remove("pm");
			ct.switch[index].addEventListener('click', amPmTimeTravel);
			ct.switch[index].classList.remove('hidden');
			ct.display[index].classList.add('hidden'); }
		else if (mode === "stop") {
			ct.switch[index].removeEventListener('click', amPmTimeTravel);
			ct.switch[index].classList.add('hidden');
			ct.display[index].classList.remove('hidden'); }
		else {
			index = this.getAttribute('data-index');
			modes.timeTravelAmPm === "AM" ? modes.timeTravelAmPm = "PM" : modes.timeTravelAmPm = "AM";
			modes.timeTravelAmPm === "AM" ? ct.switch[index].classList.remove("pm") : ct.switch[index].classList.add("pm")
			ct.timeInput[index].focus();
		}
	}


// ===================================
// Add, edit, remove data
// ===================================

	function addClock() {
		if (ZONES.length < 9) {
			index = ZONES.length;
			ZONES.push( new LocalizeZones('', 'XX', userTime.getTimezoneOffset()*60, 0) );
			drawClock();
			stoppedClock();
			setTimeout( function(){ ct.local[index].focus() }, 1);}
		wrapperClasses();
		scaleClocksBox();
		save();
	}

	function drawClock() {
		let index = clocksBox.children.length;
		let newClock = ct.cloneNode(true);
		newClock.id = '';
		clearQuote();
		clocksBox.appendChild( newClock );
		try { gmaps.addAutoCompletes(index) }
		catch (e) { global.offLine(); console.log(e) };
		setIndex();
		updateMeta(index);
		showHideAmPmMeta();
		addEventListeners(index);
		Velocity(newClock, { scale: [1, .1] }, { duration: 750, easing: [500,25] } )
	}

	global.offLine = function() {
		if(!modes.offline) {
			modes.offline = true;
			offlineErrorMessage();
			loopSupport();
			function loopSupport() {
				canary = gmaps.getURL("http://sweetclocks.party/");
				canary.then(function() {
					console.log("then", canary)
					if(toolTips.offlineError.parentNode) removeOfflineError();
					}).catch(function(e) {
					console.log("catch", e)
					setTimeout(loopSupport, 5000)
				})
			}
		}
		else {
			return;
		}
	}

	function offlineErrorMessage() {
		toolTips.offlineError = document.createElement('span');
		toolTips.offlineError.classList.add("error", "tool-tip", "offline");
		clocksBox.insertAdjacentElement('beforebegin', toolTips.offlineError);
		toolTips.offlineError.innerHTML = "Sweetclocks is working in offline mode. Searching for locations won't work."
		toolTips.offlineError.addEventListener('click', removeOfflineError);
	}

	function removeOfflineError() {
		toolTips.offlineError.parentNode.removeChild(toolTips.offlineError);
	}

	function removeClock() {
		let index = this.getAttribute('data-index');
		ZONES.splice( index, 1 );
		let deletedClock = clocksBox.childNodes[index];
		Velocity(deletedClock, { opacity: 0, scale: .96 })
		.then( function() {
			clocksBox.removeChild(deletedClock);
			setIndex();
			scaleClocksBox();
			wrapperClasses();
			if (clocksBox.childNodes.length === 0) printQuote();
			save();
		} );
		if(pacContainers[index]) document.body.removeChild(pacContainers[index]);
	}

	global.editLatLngGmaps = function(latLng, index) {
		ZONES[index].latLng = latLng;
	}

	function editGmt() {
		let index = this.getAttribute('data-index');
		ZONES[index].rawOffset = parseInt(this.value);
		ZONES[index].latLng = null;
		stoppedClock();
		save();
	}

	function editDst(event) {
		let index = this.getAttribute("data-index");
		ZONES[index].dstOffset ? ZONES[index].dstOffset = 0 : ZONES[index].dstOffset = 3600;
		dstMeta(index);
		stoppedClock();
		save();
	}

	global.updateZoneData = function(index) {
		if (ZONES[index].latLng) {
			timeZone = gmaps.getZone(ZONES[index].latLng, index);
			timeZone.then(function(zoneString){
				zoneObject = JSON.parse(zoneString);
				if(zoneObject.status ="OK") {
					ZONES[index].rawOffset = zoneObject.rawOffset;
					ZONES[index].dstOffset = zoneObject.dstOffset;
					updateMeta(index);
				}
				else clockulous.editGmtGmaps(index);
			}).then(function(){
				animateTimeShift(index);
			}).catch(function(error){
				ZONES[index].local = "oops, somethings wrong!";
				console.log(error)
			});
			save();
		}
	}

	global.editLocal = function(local, index) {
		ZONES[index].local = local;
		updateMeta(index);
		ct.local[index].blur();
		save();
	}

	function saveLocal(event) {
		key = event.key;
		if (key === "Enter") global.editLocal;
	}

	function save() {
		localStorage.ZONES = JSON.stringify(ZONES);
		localStorage.SETTINGS = JSON.stringify(SETTINGS);
	}

// ===================================
// Time Travel Features
// ===================================

	function timeTravel(ele, source) {
		source === "element" ? index = ele.getAttribute('data-index') : index = this.getAttribute('data-index');
		SETTINGS.timeTravel = true;
		modes.timeTravelMeta = "submit";
		timeTravelMeta.updateClasses(index);
		for(let i=0;i<ct.time.length;i++) ct.time.item(i).parentNode.classList.add("traveling");
		showInputClock(index);
	}

	function timeTravelMouse() {
		SETTINGS.timeTravel = true;
		for(let i=0;i<ct.time.length;i++) ct.time.item(i).parentNode.classList.add("traveling");
		originX = event.clientX;
		originY = event.clientY;
		document.getElementsByTagName("body").item(0).classList.add("noSelect");
		window.addEventListener('mousemove', trackTimeMouse);
		window.addEventListener('mouseup', releaseTimeTravelMouse);
	}

	function trackTimeMouse(event) {
		dy = event.clientY - originY;
		v = Math.floor(dy*100);
		SETTINGS.timeTravelOffset = -v;
		stoppedClock();
	}

	function releaseTimeTravelMouse() {
		window.removeEventListener('mousemove', trackTimeMouse);
		document.getElementsByTagName("body").item(0).classList.remove("noSelect");
		modes.timeTravelMeta = "cancel";
		timeTravelMeta.updateClasses(0, true);
	};

	function showInputClock(index) {
		let input = ct.timeInput[index];
		let time = ct.time[index];
		for(let i=0;i<ct.time.length;i++) {
		  ct.time.item(i).removeEventListener('mousedown', timeTravel)}
		input.addEventListener('keydown', initTimeFilter);
		if(SETTINGS.amPm) amPmTimeTravel("start", index)
		input.classList.remove('hidden');
		time.classList.add('hidden');
		window.addEventListener('click', global.clickOffClock);
		global.clickOffClock.index = index;
		setTimeout(function() {
			//uhgly hack to allow time for focus to take hold
			ct.timeInput[index].focus(); }, 1);
	}

	global.clickOffClock = function(event) {
		let index = global.clickOffClock.index;
		let current = event.target
		while (current) {
			try { if(current.getAttribute('data-index') === index) return false; }
			catch (e) { console.log(e) }
			current = current.parentElement;
		}
		global.noTimeTravel(index);
		window.removeEventListener('click', global.clickOffClock);
		return false;
	}

	function initTimeFilter(e) {
		timeFilter.filter(e, this, SETTINGS.amPm)
	}

	global.submitTimeFilter = function(ele, index) {
		if (!ele.value.match(/^(([0-1]?[0-9]|2[0-3]):[0-5][0-9]$)|^$/)) {
			submitTimeFilterError(ele, index); return false; }
		try {
			let date = new Date();
			let gmt = date.getUTCHours()*60*60 + date.getUTCMinutes()*60 + date.getUTCSeconds();
			let zone = ZONES[index].rawOffset;
			let dst = ZONES[index].dstOffset
			let travel = timeFilter.submitInput(ele, SETTINGS.amPm, modes.timeTravelAmPm);
			let offset = travel - (gmt + dst + zone);
			SETTINGS.timeTravelOffset = offset;
			modes.timeTravelMeta = "cancel";
			timeTravelMeta.updateClasses(index, true);
			hideInputClock(index);
			for(let i=0;i<ct.inner.length;i++) animateTimeShift(i);
			if(toolTips.errorOpen) {
				toolTips.submitError.parentNode.removeChild(toolTips.submitError); toolTips.errorOpen = false; }
			return true;}
		catch (e) {
		 	console.log('ERROR: submitTimeFilter', e);
		 	submitTimeFilter(ele, index, e);
		 	return false;
		}
	}

	function submitTimeFilterError(ele, index, e) {
		toolTips.errorOpen = true;
		toolTips.submitError = document.createElement('span');
		toolTips.submitError.classList.add("error", "tool-tip");
		ele.insertAdjacentElement('beforebegin', toolTips.submitError);
		if(e) {toolTips.submitError.innerHTML = "Sorry, something is wrong. <span class='emessage'>"+e+"</span>"}
		else {toolTips.submitError.innerHTML = "Sorry, I didn't recognize that time.<br/>Please use clock-time format: <span class='examples'>1:53 &nbsp; 12:30 &nbsp; 19:25 &nbsp; 05:25</span>"}
		toolTips.submitError.addEventListener('click', function() {
			toolTips.submitError.parentNode.removeChild(toolTips.submitError);
			toolTips.errorOpen = false;
		});
	}

	global.noTimeTravel = function() {
		SETTINGS.timeTravel = false;
		SETTINGS.timeTravelOffset = 0;
		modes.timeTravelMeta = "off";
		timeTravelMeta.updateClasses(0, true);
		hideInputClock();
		stoppedClock();
		for(let i=0;i<ct.time.length;i++) {
			ct.time.item(i).parentNode.classList.remove("traveling");} // don't move to hideInputClock breaks amPm flags.
	}

	function hideInputClock() {
		for(let i=0;i<ct.time.length;i++) {
			let input = ct.timeInput.item(i);
			let time = ct.time.item(i);
			input.removeEventListener('keydown', initTimeFilter);
			window.removeEventListener('click', global.clickOffClock);
			//Show Input Hide clock
			time.classList.remove('hidden');
			input.blur();
			input.classList.add('hidden');
			input.value = "";
			if(SETTINGS.amPm) amPmTimeTravel("stop", i)
			ct.time.item(i).addEventListener('mousedown', timeTravel);
		}
	}

//==================================
// Update Display: Run the clocksBox TIME COUNT THE TIME
//==================================

	//Heart Beat updates all Time and Dates
	function heartBeat() {
		stoppedClock();
		setTimeout(heartBeat, 500);
	}

	// Update the Times and Dates to the beat;
	function stoppedClock() {
		for(let index=0; index < ZONES.length; index++){
			let dateTime = displayTime(ZONES[index].rawOffset, ZONES[index].dstOffset, index);
			ct.time[index].innerHTML = dateTime[1];
			ct.date[index].innerHTML = dateTime[0];
			if(SETTINGS.amPm) amPmMeta(index, dateTime[2]);
		}
	}

	//Fill metadata to the templates
	function updateMeta(index) {
		ct.local[index].value = ZONES[index].local; //display clock name
		ct.rawOffset[index].value = ZONES[index].rawOffset; //display GMT value
		dstMeta(index);
	}

	// Check for updates to DST & GMT
	function checkZoneUpdates() {
		for(let i=0;i<ZONES.length;i++) global.updateZoneData(i);
		setTimeout(checkZoneUpdates, 3600000);
	}

	// Animate time shifts
	function animateTimeShift(index) {
		Velocity(ct.time[index], { rotateX: [450, 720]}, { duration: 200, easing: "linear" } )
		.then(function() {
			stoppedClock();
			Velocity(ct.time[index], { rotateX: [0, 450]}, { duration: 400, easing: [100,20] } );})
	}

//==================================
// ITS ALIVE!!!!!!
//==================================
	window.onload = function() {
		initialize();
		heartBeat();
	}

	return global;

})();
