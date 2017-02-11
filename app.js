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
  let isMenuOpen = false

  //The Clocks Blocks
  let clocksBox = document.getElementById("clocksBox");
  let clocksTemplate = document.getElementById("template");
  let addClockElement = document.getElementById("addClockElement");

  //Menu & Settings
  let amPMSetting = document.getElementById("amPmSetting");
  let menu = document.getElementById("menu");
  let menuButton = document.getElementById("menu-button");

// ===================================
// TEMPLATE OBJECT, CLASSES, AND DATA-INDEX
// ===================================

  //Clocks Template Event Listeneres
  function addEventListeners(index) {
    clocksTemplate.removeBtn.item(index).addEventListener('click', removeClock);
    clocksTemplate.rawOffset.item(index).addEventListener('input', editGmt);
    clocksTemplate.time.item(index).addEventListener('mousedown', timeTravel);
    clocksTemplate.local.item(index).addEventListener('click', function() { this.select() });
    clocksTemplate.timeTravelMeta.item(index).addEventListener('click', timeTravelMeta);
    clocksTemplate.dstMeta.item(index).addEventListener('click', dstMeta);
    clocksTemplate.amPmMeta.item(index).addEventListener('click', amPmMeta);
  }

  //Defines template object and recursivly applys classes to Template
  function readTemplate(current) {
    let children = current.children
    for(let i = 0, l = children.length; i < l; i++) {
      if(current.children[i].classList.length != 0) {
        let className = current.children[i].classList[0];
        clocksTemplate[className] = clocksBox.getElementsByClassName(className);
      }
      readTemplate(children[i]);
    }
  }
  readTemplate(clocksTemplate);

  //Adds data-index to template elements that need it.
  function setIndex() {
    for(let i=0,len=clocksBox.children.length;i<len;i++) {
      clocksTemplate.removeBtn[i].setAttribute('data-index', i);
      clocksTemplate.rawOffset[i].setAttribute('data-index', i);
      clocksTemplate.time[i].setAttribute('data-index', i);
      clocksTemplate.timeInput[i].setAttribute('data-index', i)
      clocksTemplate.timeTravelMeta[i].setAttribute('data-index', i);
      clocksTemplate.dstMeta[i].setAttribute('data-index', i);
      clocksTemplate.amPmMeta[i].setAttribute('data-index', i);
    }
    //check if their are too many clocks
    ZONES.length >= 8 ? addClockElement.classList.add("hidden") : addClockElement.classList.remove("hidden");
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
    if(SETTINGS.amPm) { // 12 Hour
      amPm();
      time.hours = time.hours % 12;
      dateTime.push('<span>'+time.hours+'</span>'+'<span>:</span>'+'<span>'+time.minutes+'</span>');
    } else dateTime.push('<span>'+time.hours+'</span>'+'<span>:</span>'+'<span>'+time.minutes+'</span>'); // 24 Hour
    function amPm() { // 12 Hour
      let amPm = "";
      time.hours < 12 ? amPm = "AM" : amPm = "PM";
      clocksTemplate.amPmMeta.item(index).innerHTML = amPm;
    }

    return dateTime;
  }

  //Initilize the Zone Objects from local Storage
  function initialize() {
      if(localStorage.SAVE) {
        let SAVE = JSON.parse(localStorage.SAVE)
        SAVE.forEach( function(e) {
          ZONES.push( new LocalizeZones(e.local, e.timeZoneId, e.rawOffset, e.dstOffset) );
          drawClock();
        })
      } else {
        addClock();
      }
      updateMeta();
      if(SETTINGS.firstTimeSearch) initTutorial();
    }

// ===================================
// SETTINGS AND MENU
// ===================================

  //Homepage buttons
  addClockElement.addEventListener('click', addClock);
  menuButton.addEventListener('click', openCloseMenu);

  //Settings Menu
  amPMSetting.addEventListener('click', () => { toggleSetting(SETTINGS.amPm) } );

  function toggleSetting(setting) {
    setting = !setting;
  }

  function openCloseMenu() {
    isMenuOpen ? isMenuOpen = false : isMenuOpen = true;
    isMenuOpen ? menu.classList.add("open") : menu.classList.remove("open");
  }

  function searchToolTip() {
    toolTipSpan = document.createElement('span');
    toolTipSpan.classList.add("tool-tip");
    event.target.insertAdjacentElement('beforebegin', toolTipSpan);
    toolTipSpan.innerHTML = event.target.getAttribute("data-tip");

    clocksTemplate.local.item(0).removeEventListener('click', searchToolTip);
    SETTINGS.firstTimeSearch = false;
    toolTipSpan.addEventListener('click', function() {
      toolTipSpan.parentNode.removeChild(toolTipSpan);
    });
  }

  function timeTravelToolTip() {
    toolTipSpan = document.createElement('span');
    toolTipSpan.classList.add("tool-tip");
    clocksTemplate.time.item(1).insertAdjacentElement('beforebegin', toolTipSpan);
    toolTipSpan.innerHTML = clocksTemplate.time.item(1).getAttribute("data-tip");

    addClockElement.removeEventListener('click', timeTravelToolTip);
    SETTINGS.firstTimeTravel = false;
    toolTipSpan.addEventListener('click', function() {
      toolTipSpan.parentNode.removeChild(toolTipSpan);
    });
  }

// ===================================
// TUTORIAL
// ===================================

  function initTutorial() {
    addClockElement.addEventListener('click', timeTravelToolTip);
    clocksTemplate.local.item(0).addEventListener('click', searchToolTip);
 }

// ===================================
// TIME META BUTTON FUNCTIONS (timeTravel, DST, AM/PM)
// ===================================

function timeTravelMeta() {

}

function dstMeta() {

}

function amPmMeta() {

}

// ===================================
// Add, edit, remove data
// ===================================

  function addClock() {
    ZONES.push( new LocalizeZones('Search for Location', 'XX', userTime.getTimezoneOffset()*60, 0) );
    drawClock();
    stoppedClock();
    save();
  }

  function drawClock() {
    let index = clocksBox.children.length;
    let newClock = clocksTemplate.cloneNode(true);
    newClock.id = '';
    clocksBox.appendChild( newClock );

    gmaps.addAutoCompletes(index);
    addEventListeners(index);
    setIndex();
    updateMeta();
  }

  function removeClock() {
    let index = this.getAttribute('data-index');
    ZONES.splice( index, 1 );
    clocksBox.removeChild(clocksBox.childNodes[index]);
    setIndex();
    updateMeta();
    save();
  }

  global.editGmtGmaps = function(rawOffset, dstOffset, index) {
    if(arguments.length == 3) {
      // gmaps autocomplete came through
      ZONES[index].rawOffset = rawOffset;
      ZONES[index].dstOffset = dstOffset;
    } else if(arguments.length == 1){
      // gmaps autocomplete shit itself along the way
      ZONES[arguments[0]].local = "oops! Choose UTC";
    }
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
    let index = this.getAttribute('data-index');
    if(ZONES[index].dstOffset == "0"){
      ZONES[index].dstOffset = 3600;
    } else {
      ZONES[index].dstOffset = 0;
    }
    stoppedClock();
    // save();
  }

  global.editLocal = function(local, index) {
    ZONES[index].local = local;
    updateMeta();
    save()
  }

  function save() {
    localStorage.SAVE = JSON.stringify(ZONES);
  }

// ===================================
// Time Travel Features
// ===================================

  function timeTravel() {

    index = this.getAttribute('data-index');
    clocksTemplate.time.item(index).addEventListener('mouseup', initInputTime);

    if(SETTINGS.timeTravel === false) {
      toggleSetting(SETTINGS.timeTravel);
      for(let i=0;i<clocksTemplate.time.length;i++) clocksTemplate.time.item(i).classList.add("traveling");
    }
    SETTINGS.timeTravel = true;
    originX = event.clientX;
    originY = event.clientY;
    document.getElementsByTagName("body").item(0).classList.add("noSelect");
    window.addEventListener('mousemove', trackTime);
    function trackTime() {
      dy = event.clientY - originY;
      v = Math.floor(dy*100);
      SETTINGS.timeTravelOffset = -v;
      stoppedClock();
    }
    window.addEventListener('mouseup', function() {
      clocksTemplate.time.item(index).removeEventListener('mouseup', initInputTime);
      window.removeEventListener('mousemove', trackTime);
      document.getElementsByTagName("body").item(0).classList.remove("noSelect");
    });
  }

  function initTimeFilter(e) {
    timeFilter.filter(e, this, SETTINGS.amPm)
  }

  function initInputTime(event) {
    index = event.target.getAttribute('data-index');
    showInputClock(index);
  }

  global.submitTimeFilter = function(ele, index) {
    let offset = ZONES[index].rawOffset - timeFilter.submitInput(ele, SETTINGS.amPm);
    SETTINGS.timeTravelOffset = offset;
    hideInputClock(index);
  }

  function showInputClock(index) {
    let input = clocksTemplate.timeInput.item(index);
    let time = clocksTemplate.time.item(index);
    input.addEventListener('keydown', initTimeFilter);

    //Show Input Hide clock
    input.classList.remove('hidden');
    time.classList.add('hidden');
    input.select();
  }

  function hideInputClock(index) {
    let input = clocksTemplate.timeInput.item(index);
    let time = clocksTemplate.time.item(index);
    input.removeEventListener('keydown', initTimeFilter);

    //Show Input Hide clock
    time.classList.remove('hidden');
    input.classList.add('hidden');
    input.value = "";
  }

  global.noTimeTravel = function(index) {
    showHide("timeTravel", clocksTemplate.timeTravelMeta);
    for(let i=0;i<clocksTemplate.time.length;i++) clocksTemplate.time.item(i).classList.remove("traveling");

    hideInputClock(index)

    SETTINGS.timeTravel = false;
    SETTINGS.timeTravelOffset = 0;
    stoppedClock();
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
      clocksTemplate.time[index].innerHTML = dateTime[1];
      clocksTemplate.date[index].innerHTML = dateTime[0]
    };
  }

  //Fill metadata to the templates
  function updateMeta() {
    for(let i=0;i<clocksBox.children.length;i++) {
      clocksTemplate.local[i].value = ZONES[i].local; //update clock name
      clocksTemplate.rawOffset[i].value = ZONES[i].rawOffset; //update GMT value
      if(ZONES[i].dstOffset != 0) clocksTemplate.dstMeta[i].checked = true;
    }
  }

  initialize();
  heartBeat();

  return global;

})();
