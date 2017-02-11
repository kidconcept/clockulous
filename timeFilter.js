var timeFilter = (function() {

  let global = {};
  global.submitInput = function(ele, clockType) {
    let minutes, hours;
    if (!ele.value) {
      clockulous.noTimeTravel();
      return;
    }
    if (!ele.value.match(/[:]/)) { // in the event they typed 3 numbers and left out the ":"
      hours = parseInt(ele.value.slice(0, -2));
      minutes = parseInt(ele.value.slice(-2));
    } else if(ele.value.match(/:/)) {  // in the event they got a ":"
      splitStr = ele.value.split(":");
      hours = parseInt(splitStr[0]);
      minutes = parseInt(splitStr[1]);
    }
    if ( clockType ) {

    } else {
      return hours*60*60+minutes*60
    }

  }

  global.filter = function(evt, ele, clockType) {

    let key; key = evt.key;
    index = ele.getAttribute('data-index');
    if (key === "Enter") { clockulous.submitTimeFilter(ele, index) }
    if (key === "Escape") { clockulous.noTimeTravel(ele) }

    /////// Exclude non number characteres. I avoided a [^] match to leave operational keys enabled. //////
    if (key.length === 1) {
      if(key.match(/[A-Za-z\s\.\\\+\*\?\^\$\[\]\{\}\(\)\|\/\-&~!@#%`="><_',;]|Decimal|Multiply|Add|Divide|Subtract|Seperator/)) evt.preventDefault();
    }

    /////// Prevents users from typing ":" twice, or from typing 3 digits of minutes ///////
    if (ele.value.match(/:/)) {
      if(key.match(/:/)) evt.preventDefault();
      if(ele.value.match(/[0-9]:[0-9]{2}/)) {
        if (key.match(/[0-9]/)) {
          evt.preventDefault();
          ele.value = ele.value.match(/[0-9]/g).join("") + key;
        }
      }
    }

    /////// First Number and Second Number Conditions ////////
    if (ele.value.length === 0) { // First Keypress
      if ( clockType ? key.match(/[2-9]/) : key.match(/[3-9]/) ) { // transfer 2-9 or 3-9 to 1 hour place
        evt.preventDefault();
        ele.value = "0" + key + ":";
      } else if (key.match(/:/)) { // 00:XX
        evt.preventDefault();
        ele.value = "00" + key;
      }
    } else if (ele.value.length === 1) { // Second Keypress
      if ( clockType ) { // 12 hour clock
        if (key.match(/[3-5]/)) { // 1:X transfer 3-5 to 10 minute place
          evt.preventDefault();
          ele.value += ":" + key;
        } else if (key.match(/[6-9]/)) { // 1:X transfer 6-9 to 1 minute place
          evt.preventDefault();
          ele.value += ":0" + key;
        }
      } else if ( !clockType && ele.value === "2" ) { // 24 hour clock
      if (key.match(/5/)) { // 2:X transfer 5 to 10 minute place
        evt.preventDefault();
        ele.value += ":" + key;
      } else if (key.match(/[6-9]/)) {
        evt.preventDefault();
        ele.value += ":0" + key;
      }
    }
  }
  /////// Prevents a Number greating than 5 following a ":" /////
  else if (ele.value.match(/:$/)) {
    if (key.match(/[6-9]/)) {
      evt.preventDefault();
      ele.value += "0" + key;
    }
  }

  ////// If a user types 4 numbers without a ":" then adds ":" for them
  if (ele.value.match(/[0-9]{3}/)) {
    if (key.match(/[0-9]/)) {
      evt.preventDefault();
      ele.value = ele.value.slice(0,2) + ":" + ele.value.slice(2,3) + key
    }
  }
}

return global;

})();
