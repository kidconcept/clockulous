var clockulous = (function() {

  var global = {}

  //synchronous.global.site, clock.party, circadian, rhythm, clockulous, rotation,

    // ===================================
    // INITIALIZE VARIABLES AND OBJECTS
    // ===================================

    //Variable Instantation
    let userTime = new Date();
    let ZONES = [];
    let clocksBox = document.getElementById("clocksBox");
    let addButton = document.getElementById("addWrapper");

    //Event Listeners
    this.addButton.addEventListener('click', addClock);

    //template
    let clockTemplateHtml = document.getElementById("template").innerHTML;
    global.clocksTemplate = [];

   // ===================================
   // TIME ZONE OBJECTS
   // ===================================

    // A class to create new Zone Objects
    function LocalizeZones(gmt, local) {
      this.gmt = gmt;
      this.local = local;
    }
    displayTime = function(gmt) {
      let zoneTime = new Date();
      let dateTime = [];
      zoneTime.setUTCSeconds( userTime.getUTCSeconds() + gmt );
      let time = {
        hours: zoneTime.getUTCHours(),
        minutes: String( "0" + zoneTime.getUTCMinutes() ).slice(-2)
      };
      dateTime.push(zoneTime.getDate()+'/'+zoneTime.getMonth()+1);
      dateTime.push(time.hours+':'+time.minutes);
      return dateTime;
    }

    // Initilize the Zone Objects from local Storage
    function initialize() {
      if(localStorage.SAVE) {
        let SAVE = JSON.parse(localStorage.SAVE)
        SAVE.forEach( function(element) {
            ZONES.push( new LocalizeZones(element.gmt, element.local) )
        })
      } else {
        ZONES.push(new LocalizeZones(userTime.getTimezoneOffset()*60, "Your Time Zone"))
      }
      editTemplates();
      updateMeta();
    }

    // ===================================
    // DRAW & FILL TEMPLATES
    // ===================================

    //Draw the templates to the DOM
    function editTemplates() {
      clocksBox.innerHTML = '';
      clocksBox.appendChild(addButton);
      for(let i=0; i < ZONES.length; i++) {
        clocksBox.insertAdjacentHTML('afterbegin', clockTemplateHtml);
      }
      global.clocksTemplate.time = clocksBox.getElementsByClassName('time');
      global.clocksTemplate.gmtDisplay = clocksBox.getElementsByClassName('gmt-display');
      global.clocksTemplate.local = clocksBox.getElementsByClassName('local');
      global.clocksTemplate.clock = clocksBox.getElementsByClassName('clock');
      global.clocksTemplate.date = clocksBox.getElementsByClassName('date');
      global.clocksTemplate.remove = clocksBox.getElementsByClassName('remove');

      //draw the clock immediatly
      stoppedClock();

      //add data indexes to each clock
      for(let i=0; i < ZONES.length; i++) {
        global.clocksTemplate.clock[i].setAttribute('data-index', i);
        global.clocksTemplate.local[i].setAttribute('data-index', i);
        global.clocksTemplate.remove[i].setAttribute('data-index', i);
        global.clocksTemplate.gmtDisplay[i].setAttribute('data-index', i);
      }

      //add event listeners to the template actions
      for(let i=0; i < ZONES.length; i++) {
        global.clocksTemplate.remove[i].addEventListener('click', removeClock);
        global.clocksTemplate.gmtDisplay[i].addEventListener('input', editGmt);
        //global.clocksTemplate.local[i].addEventListener('input', editLocal);
      }
    }

    //Clock Objects
    function newClock(gmtOffset, name) {
      //Create Node
      
    }

    //Fill metadata to the templates
    function updateMeta() {
      for(let i=0; i < ZONES.length; i++) {
        global.clocksTemplate.local[i].value = ZONES[i].local; //update clock name
        global.clocksTemplate.gmtDisplay[i].value = ZONES[i].gmt/60/60; //update GMT value
      }
    }

    // ===================================
    // Add, edit, remove data
    // ===================================

    function addClock() {
      ZONES.push( new LocalizeZones(userTime.getTimezoneOffset()*60, 'Select Time Zone') );
      if(ZONES.length >= 8) {
        addButton.style.display = "none";
      }
      editTemplates();
      updateMeta();
      stoppedClock();
      save()
    }

    function removeClock() {
      let i = this.getAttribute('data-index');
      ZONES.splice( i, 1 );
      editTemplates();
      updateMeta();
      addButton.style.display = "block";
      save()
    }

    function editGmt(e) {
      let i = e.target.getAttribute('data-index');
      ZONES[i].gmt = e.target.value*60*60;
      stoppedClock();
      save();
    }

    function editLocal(e) {
      let i = e.target.getAttribute('data-index');
      ZONES[i].local = e.target.value;
      updateMeta();
      save()
    }

    function save() {
      localStorage.SAVE = JSON.stringify(ZONES);
    }

    //==================================
    // Run the clocksBox TIME COUNT THE TIME
    //==================================

    //Heart Beat updates all Dates
    function heartBeat() {
      stoppedClock();
      setTimeout(heartBeat, 1000);
    }

    // Update the Times and Dates to the beat;
    stoppedClock = function() {
      for(let i=0; i < ZONES.length; i++){
        let dateTime = displayTime(ZONES[i].gmt);
        global.clocksTemplate.time[i].innerHTML = dateTime[1];
        global.clocksTemplate.date[i].innerHTML = dateTime[0]
      };
    }

    initialize();
    heartBeat();

    return global;

})();
