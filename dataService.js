var gmaps = (function() {

  var global = {};

  /// Utility Function for getting XML Requests
  function get(url){
    return new Promise(function(resolve, reject){
      var xhttp = new XMLHttpRequest();
      xhttp.open("GET", url, true);
      xhttp.onload = function(){
        if(xhttp.status == 200) {
          resolve(xhttp.response)
        } else{
          reject(xhttp.statusText)
        }
      };
      xhttp.onerror = function(){
        reject(xhttp.statusText);
      };
      xhttp.send();
    });
  }

  /// Generate google Autocomplete for Timezone Search Box
  var options = {};

  function gmapOption() {
    var defaultBounds = new google.maps.LatLngBounds(
      new google.maps.LatLng(-90, -180),
      new google.maps.LatLng(90, 180)
    );

    options = {
      bounds: defaultBounds,
      types: ['(regions)']
    };
  }
  gmapOption();


  global.addAutoCompletes = function(index) {
    nthChild = index+1;
    var input = document.querySelector('.clock:nth-child('+nthChild+') .local');

    /// On Init of New clock
    var autocomplete = new google.maps.places.Autocomplete(input, options);

    /// On User Search
    if(autocomplete) {
      autocomplete.addListener('place_changed', function() {
        /// Request new Google TimezoneId
        var place = autocomplete.getPlace();

        if(place.geometry) {
          // Request TimeZone
          var latLng = place.geometry.location.lat() + "," + place.geometry.location.lng();
          var timestamp = Math.floor(Date.now()/1000)
          var zoneRequestURL = "https://maps.googleapis.com/maps/api/timezone/json?location="+latLng+"&timestamp="+timestamp+"&key=AIzaSyBSKOzSS4QIenGIAeMpYMecNUn9pyDUb54"
          var timeZone = get(zoneRequestURL);

          timeZone.then(function(zoneString){
            zoneObject = JSON.parse(zoneString);
            if(zoneObject.status ="OK") {
              clockulous.editGmtGmaps(zoneObject.rawOffset, zoneObject.dstOffset, index)
            }
            else clockulous.editGmtGmaps(index);
          }).catch(function(error){
            clockulous.editGmtGmaps(index);
            console.log(error)
          })
        }

        // Save Name
        clockulous.editLocal(place.name, index);
        
      });
    } else {
      clockulous.editGmtGmaps(index);
    };
    return autocomplete;
  };

  return global;

})();
