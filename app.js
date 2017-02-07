var clockulous = (function() {

  var global = {}

  //synchronous.global.site, clock.party, circadian, rhythm, clockulous, rotation,

    // ===================================
    // INITIALIZE VARIABLES AND OBJECTS AND TEMPLATES
    // ===================================

    //Variable Instantation
    let userTime = new Date();
    let ZONES = [];
    global.clocksBox = document.getElementById("clocksBox");
    let addClockElement = document.getElementById("addClockElement");

    //Event Listeners
    addClockElement.addEventListener('click', addClock);

    //Template object and recursivly applys classes to Template
    let clocksTemplate = document.getElementById("template");
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

    function addEventListeners(index) {
      clocksTemplate.removeBtn.item(index).addEventListener('click', removeClock);
      clocksTemplate.rawOffset.item(index).addEventListener('input', editGmt);
      clocksTemplate.dstOffset.item(index).addEventListener('click', editDst);
      clocksTemplate.local.item(index).addEventListener('click', function() {
        this.select();
      })
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

    displayTime = function(rawOffset, dstOffset) {
      let zoneTime = new Date();
      let dateTime = [];
      zoneTime.setUTCSeconds( userTime.getUTCSeconds() + rawOffset + dstOffset);
      let time = {
        hours: zoneTime.getUTCHours(),
        minutes: String( "0" + zoneTime.getUTCMinutes() ).slice(-2)
      };
      dateTime.push(zoneTime.getDate()+'/'+zoneTime.getMonth()+1);
      dateTime.push(time.hours+':'+time.minutes);
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
    }

    // ===================================
    // Add, edit, remove data
    // ===================================

    function addClock() {
      ZONES.push( new LocalizeZones('Select Time Zone', 'XX', userTime.getTimezoneOffset()*60, 0) );
      drawClock();
      stoppedClock();
      save()
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
      save()
    }

    function setIndex() {
      for(let i=0,len=clocksBox.children.length;i<len;i++) {
        clocksTemplate.removeBtn[i].setAttribute('data-index', i);
        clocksTemplate.rawOffset[i].setAttribute('data-index', i);
        clocksTemplate.dstOffset[i].setAttribute('data-index', i) }
      //check if their are too many clocks
      ZONES.length >= 8 ? addClockElement.classList.add("disabled") : addClockElement.classList.remove("disabled");
    }

    global.editGmtGmaps = function(rawOffset, dstOffset, index) {
      if(arguments.length == 3) {
        // gmaps autocomplete came through
        ZONES[index].rawOffset = rawOffset;
        ZONES[index].dstOffset = dstOffset;
      } else if(arguments.length == 1){
        // gmaps autocomplete shit itself along the way
        console.log(arguments)
        ZONES[arguments[0]].local = "oops! Choose UTC";
      }
      stoppedClock();
      updateMeta();
      save();
    }

    function editGmt() {
      let index = this.getAttribute('data-index');
      ZONES[index].rawOffset = this.value*60*60;
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
      console.log(index, ZONES[index])
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
      for(let i=0; i < ZONES.length; i++){
        let dateTime = displayTime(ZONES[i].rawOffset, ZONES[i].dstOffset);
        clocksTemplate.time[i].innerHTML = dateTime[1];
        clocksTemplate.date[i].innerHTML = dateTime[0]
      };
    }

    //Fill metadata to the templates
    function updateMeta(clock) {
      for(let i=0;i<clocksBox.children.length;i++) {
        clocksTemplate.local[i].value = ZONES[i].local; //update clock name
        clocksTemplate.rawOffset[i].value = ZONES[i].rawOffset/60/60; //update GMT value
        if(ZONES[i].dstOffset != 0) clocksTemplate.dstOffset[i].checked = true;
      }
    }

    initialize();
    heartBeat();

    return global;

})();
