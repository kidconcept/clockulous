var clockulous = (function() {

	var global = {}

	//clockblock.party, clockblock.me, synchronous.global (reg $64 /year), synchronous.site, synchronous.space, clocktempo.com, clockwall.world, timebandet party

// ===================================
// INITIALIZE VARIABLES AND OBJECTS AND TEMPLATES AND EVENTS
// ===================================

	let userTime = new Date(); // For adding new clocks
	let ZONES = []; // Holds Data Model
	let SETTINGS = {};
	SETTINGS.firstTimeSearch = true; // run tutorial popup on search
	SETTINGS.firstTimeTravel = true; // run tutorial popup on timetravel
	SETTINGS.amPm = true; //12 Hour Clock by default
	SETTINGS.timeTravel = false; // Display Time Travel Offset
	SETTINGS.timeTravelOffset = 0;
	SETTINGS.theme = "day";
	let toolTips = {};
	let isMenuOpen = false;
	let modes = {};
	modes.amPmMeta = "display";
	modes.timeTravelAmPm = "AM";
	modes.dstMeta = "display";
	modes.timeTravelMeta = "off";

	//The Clocks Blocks
	let app = document.getElementById("app");
	let clocksBox = document.getElementById("clocksBox");
	let ct = document.getElementById("template");
	let addClockElement = document.getElementById("addClockElement");

	//Key Commands
	window.addEventListener('keydown', keyCommands);
	function keyCommands() {
		key = event.key;
		if (key === "Escape") clockulous.noTimeTravel();
		//if (key === "c") addClock();
		//if (key === "x") removeClock();
	}

// ===================================
// TEMPLATE OBJECT, CLASSES, AND DATA-INDEX
// ===================================

	//Clocks Template Event Listeneres
	function addEventListeners(index) {
		ct.removeBtn.item(index).addEventListener('click', removeClock);
		ct.rawOffset.item(index).addEventListener('input', editGmt);
		ct.time.item(index).addEventListener('mousedown', timeTravel);
		ct.local.item(index).addEventListener('click', function() { this.select(); })
		ct.local.item(index).addEventListener('keydown', saveLocal);
		//ct.time.item(index).addEventListener('mousedown', timeTravelMouse);
		ct.timeTravelMeta.item(index).addEventListener('click', timeTravelMeta);
		ct.dstMeta.item(index).addEventListener('click', dstMeta);
		ct.amPmMeta.item(index).addEventListener('click', amPmMeta);
	}

	//Defines template object and recursivly applys classes to Template
	function readTemplate(current) {
		let children = current.children
		for(let i = 0, l = children.length; i < l; i++) {
	  if(current.children[i].classList.length != 0) {
	    let className = current.children[i].classList[0];
	    ct[className] = clocksBox.getElementsByClassName(className);
	  }
	  readTemplate(children[i]);
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
		}
		//check if their are too many clocks
		ZONES.length >= 9 ? addClockElement.classList.add("hidden") : addClockElement.classList.remove("hidden");
	}

// ===================================
// TIME ZONE OBJECTS. Generate and Format Zone Objects
// ===================================

	// A class to create new Zone Objects
	function LocalizeZones(local, timeZoneId, rawOffset, dstOffset) {
		this.local = local;
		this.timeZoneId = timeZoneId;
		this.rawOffset = rawOffset;
		this.dstOffset = dstOffset;
	}

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
		dateTime.push(zoneTime.getDate()+'/'+zoneTime.getMonth()+1);
		// Display 12 or 24 Hour format
		amPm();
		function amPm() {
		  let amPm = "";
		  time.hours < 12 ? clockAmPm = "AM" : clockAmPm = "PM";
		  amPmMeta(modes.amPmMeta, index, clockAmPm);
		}
		if(SETTINGS.amPm) { // 12 Hour
		  time.hours = time.hours % 12;
		  if (time.hours == 0) time.hours = 12;
		}
		dateTime.push('<span>'+time.hours+'</span>'+'<span>:</span>'+'<span>'+time.minutes+'</span>');
		return dateTime;
	}

	//Initilize the Zone Objects from local Storage
	function initialize() {

		if(localStorage.ZONES) {
			let SAVE = JSON.parse(localStorage.ZONES)
			SAVE.forEach( function(e) {
		 		ZONES.push( new LocalizeZones(e.local, e.timeZoneId, e.rawOffset, e.dstOffset) );
		 		drawClock(); })}
		else { addClock(); }
		if(localStorage.SETTINGS) SETTINGS = JSON.parse(localStorage.SETTINGS);
		swapTheme();
		if(SETTINGS.firstTimeSearch) initTutorial();
		updateMeta();
		initMenu();
		initScaling();
	}

// ===================================
// SETTINGS AND MENU
// ===================================

	//Elements
	let amPMSetting = document.getElementById("amPmSetting");
	let menu = document.getElementById("menu");
	let menuButton = document.getElementById("menu-button");
	let themeSetting = document.getElementById("themeSetting")

	//Settings
	amPmSetting.addEventListener('click', captureMenu);
	themeSetting.addEventListener('click', captureMenu);

	//Homepage buttons
	addClockElement.addEventListener('click', addClock);
	menuButton.addEventListener('click', openCloseMenu);

	function captureMenu() {
		SETTINGS.amPm = !amPmSetting.checked;
		themeSetting.checked ? SETTINGS.theme = THEMES[1] : SETTINGS.theme = THEMES[0];
		stoppedClock();
		swapTheme();
		save();
	}

	function initMenu() {
		amPmSetting.checked = !SETTINGS.amPm;
		themeSetting.checked = (SETTINGS.theme === "night");
	}

	function openCloseMenu() {
		isMenuOpen ? isMenuOpen = false : isMenuOpen = true;
		isMenuOpen ? menu.classList.add("open") : menu.classList.remove("open");
	}

	function searchToolTip() {
		toolTips.search = document.createElement('span');
		toolTips.search.classList.add("tool-tip");
		event.target.insertAdjacentElement('beforebegin', toolTips.search);
		toolTips.search.innerHTML = event.target.getAttribute("data-tip");
		ct.local.item(0).removeEventListener('click', searchToolTip);
		SETTINGS.firstTimeSearch = false;
		toolTips.search.addEventListener('click', function() {
			toolTips.search.parentNode.removeChild(toolTips.search)});
	}

	function timeTravelToolTip() {
		toolTips.timeTravel = document.createElement('span');
		toolTips.timeTravel.classList.add("tip", "tool-tip");
		ct.time.item(1).insertAdjacentElement('beforebegin', toolTips.timeTravel);
		toolTips.timeTravel.innerHTML = ct.time.item(1).getAttribute("data-tip");

		addClockElement.removeEventListener('click', timeTravelToolTip);
		SETTINGS.firstTimeTravel = false;
		toolTips.timeTravel.addEventListener('click', function() {
			toolTips.timeTravel.parentNode.removeChild(toolTips.timeTravel)});
	}

	function removeClasses(array, html) {
		array.forEach( (element) => {
			html.classList.remove(element)
		})
	}

// ===================================
// TUTORIAL
// ===================================

	function initTutorial() {
		addClockElement.addEventListener('click', timeTravelToolTip);
		ct.local.item(0).addEventListener('click', searchToolTip);
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
// SCALING FOR CLOCKS
// ===================================

	wrapper = document.getElementById('wrapper');

	function initScaling() {
		window.addEventListener("resize", scaleClocksBox);
		wrapperClasses();
		scaleClocksBox();
	}

	function scaleClocksBox() {
		let scale = Math.min(
			wrapper.clientWidth / clocksBox.clientWidth,
			wrapper.clientHeight / clocksBox.clientHeight );
		clocksBox.style.transform = "translate(-50%, -50%) " + "scale(" + scale + ")";
	}

	let clockClasses = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

	function wrapperClasses() {
		let n = ct.time.length;
		removeClasses(clockClasses, app);
		app.classList.remove(clockClasses.toString());
		app.classList.add(clockClasses[n]);
	}

// ===================================
// TIME META BUTTON FUNCTIONS (timeTravel, DST, AM/PM)
// ===================================

	var timeTravelMeta = function() {
		index = event.target.getAttribute('data-index');
		ele = ct.timeInput.item(index);
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
		ttMeta = ct.timeTravelMeta.item(index);
		for(let i=0;i<ct.timeTravelMeta.length;i++) {
			ct.timeTravelMeta.item(i).classList.remove("cancel","off","submit");
			if(all) ct.timeTravelMeta.item(i).classList.add(modes.timeTravelMeta);}
		ttMeta.classList.add(modes.timeTravelMeta);
	}

	function dstMeta(mode, index) {
		if(mode.type === 'click') {
			index = event.target.getAttribute('data-index');
			editDst(); }
		else if (mode === "display") { }
		ZONES[index].dstOffset ? ct.dstMeta.item(index).classList.add('isDayLightSavings') : ct.dstMeta.item(index).classList.remove('isDayLightSavings');
	}

	function amPmMeta(mode, index, clockAmPm) {
		if(SETTINGS.amPm) {
			if(mode.type === 'click' && SETTINGS.timeTravel) {
			 	index = event.target.getAttribute('data-index');
			 	modes.timeTravelAmPm === "AM" ? modes.timeTravelAmPm = "PM" : modes.timeTravelAmPm = "AM";
			 	ct.amPmMeta.item(index).innerHTML = modes.timeTravelAmPm;
			 	ct.timeInput.item(index).focus();}
			else if (mode === "display") {
				ct.amPmMeta.item(index).innerHTML = clockAmPm;}
			else if (mode === "timeTravel") {
				modes.amPmMeta = "timeTravel";
				ct.amPmMeta.item(index).classList.add('active');
				ct.amPmMeta.item(index).addEventListener('click', amPmMeta);}
			else if (mode === "remove") {
				modes.amPmMeta = "display";
				ct.amPmMeta.item(index).classList.remove('active');
				ct.amPmMeta.item(index).removeEventListener('click', amPmMeta);}}
		else {
			for(let i=0;i<ct.amPmMeta.length;i++) {
				ct.amPmMeta.item(i).classList.add('military');
				ct.amPmMeta.item(i).innerHTML = "";
			}
		}
	}

// ===================================
// Add, edit, remove data
// ===================================

	function addClock() {
		if (ZONES.length < 9) {
			index = ZONES.length;
			ZONES.push( new LocalizeZones('Search for Location', 'XX', userTime.getTimezoneOffset()*60, 0) );
			drawClock();
			stoppedClock();
			setTimeout( function(){ ct.local.item(index).focus() }, 1);}
		wrapperClasses();
		scaleClocksBox();
		save();
	}

	function drawClock() {
		let index = clocksBox.children.length;
		let newClock = ct.cloneNode(true);
		newClock.id = '';
		clocksBox.appendChild( newClock );
		try { gmaps.addAutoCompletes(index) }
		catch (e) { offLine(); console.log(e) };
		addEventListeners(index);
		setIndex();
	}

	function offLine() {
		console.log('ClockBlock.me is working in offline mode. Searching for locations won\'t work')
	}

	function removeClock() {
		let index = this.getAttribute('data-index');
		ZONES.splice( index, 1 );
		clocksBox.removeChild(clocksBox.childNodes[index]);
		setIndex();
		scaleClocksBox();
		wrapperClasses();
		save();
	}

	global.editGmtGmaps = function(rawOffset, dstOffset, index) {
		if(arguments.length == 3) {
			// gmaps autocomplete came through
			ZONES[index].rawOffset = rawOffset;
			ZONES[index].dstOffset = dstOffset;}
		else if(arguments.length == 1){
			// gmaps autocomplete shit itself along the way
			ZONES[arguments[0]].local = "oops! Choose UTC";}
		stoppedClock();
		updateMeta();
		save();
	}

	function editGmt() {
		let index = this.getAttribute('data-index');
		ZONES[index].rawOffset = parseInt(this.value);
		stoppedClock();
		save();
	}

	function editDst() {
		let index = event.target.getAttribute('data-index');
		if(ZONES[index].dstOffset == "0"){
			ZONES[index].dstOffset = 3600;}
		else {
			ZONES[index].dstOffset = 0;}
		stoppedClock();
		save();
	}

	global.editLocal = function(local, index) {
		ZONES[index].local = local;
		updateMeta();
		ct.local.item(index).blur();
		save();
	}

	function saveLocal() {
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

	function trackTimeMouse() {
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
		let input = ct.timeInput.item(index);
		let time = ct.time.item(index);
		for(let i=0;i<ct.time.length;i++) {
		  ct.time.item(i).removeEventListener('mousedown', timeTravel)}
		input.addEventListener('keydown', initTimeFilter);
		if(SETTINGS.amPm) amPmMeta("timeTravel", index)
		input.classList.remove('hidden');
		time.classList.add('hidden');
		window.addEventListener('click', global.clickOffClock);
		global.clickOffClock.index = index;
		setTimeout(function() {
			//uhgly hack to allow time for focus to take hold
			ct.timeInput.item(index).focus(); }, 1);
	}

	global.clickOffClock = function() {
		index = global.clickOffClock.index;
		for(let i=0;i<event.path.length;i++) {
			try { if(event.path[i].classList.contains('inner')) {
					if(event.path[i].getAttribute('data-index') === index) return false; }}
			catch (e) { }}
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
			let travel = timeFilter.submitInput(ele, SETTINGS.amPm, modes.timeTravelAmPm);
			let offset = travel - (gmt + zone);
			SETTINGS.timeTravelOffset = offset;
			modes.timeTravelMeta = "cancel";
			timeTravelMeta.updateClasses(index, true);
			stoppedClock();
			hideInputClock(index);
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
		else {toolTips.submitError.innerHTML = "Sorry, didn't recognize that time. Please use clock-time format <span class='examples'>1:53 12:30 19:25 05:25</span>"}
		toolTips.submitError.addEventListener('click', function() {
			toolTips.submitError.parentNode.removeChild(toolTips.submitError);
			toolTips.errorOpen = false;
		});
	}

	global.noTimeTravel = function() {
		SETTINGS.timeTravel = false;
		SETTINGS.timeTravelOffset = 0;
		modes.timeTravelMeta = "off";
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
			//Show Input Hide clock
			time.classList.remove('hidden');
			input.classList.add('hidden');
			input.value = "";
			if(SETTINGS.amPm) amPmMeta("remove", i)
			ct.time.item(i).addEventListener('mousedown', timeTravel);
		}
	}

//==================================
// Update Display: Run the clocksBox TIME COUNT THE TIME
//==================================

	//Heart Beat updates all Time and Dates
	function heartBeat() {
		stoppedClock();
		setTimeout(heartBeat, 1000);
	}

	// Update the Times and Dates to the beat;
	function stoppedClock() {
		for(let index=0; index < ZONES.length; index++){
			let dateTime = displayTime(ZONES[index].rawOffset, ZONES[index].dstOffset, index);
			ct.time[index].innerHTML = dateTime[1];
			ct.date[index].innerHTML = dateTime[0];
		}
	}

	//Fill metadata to the templates
	function updateMeta() {
		for(let i=0;i<clocksBox.children.length;i++) {
			ct.local[i].value = ZONES[i].local; //update clock name
			ct.rawOffset[i].value = ZONES[i].rawOffset; //update GMT value
			dstMeta(modes.dstMeta, i);
		}
	}

//==================================
// ITS ALIVE!!!!!!
//==================================

	initialize();
	heartBeat();
	return global;

})();
