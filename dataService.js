
var gmaps = (function() {

  var global = {};

  /// Utility Function for getting XML Requests
  global.getURL = function(url) {
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
    try {
		var defaultBounds = new google.maps.LatLngBounds(
	      new google.maps.LatLng(-90, -180),
	      new google.maps.LatLng(90, 180)
	    );
		options = {
			bounds: defaultBounds,
			types: ['(regions)']
		};
	} catch (e) {
		console.log(e);
	}
  }
  gmapOption();

  // Update Dst and GMT
  global.getZone = function(latLng, index) {
	  var timestamp = Math.floor(Date.now()/1000)
	  var zoneRequestURL = "https://maps.googleapis.com/maps/api/timezone/json?location="+latLng+"&timestamp="+timestamp+"&key=AIzaSyDIepuNMvaVLhkR7ezNCTR_eZuYKuLtG9U"
	  var timeZone = global.getURL(zoneRequestURL);
	  return timeZone;
  }

  global.addAutoCompletes = function(index) {
    nthChild = index+1;
    var input = document.querySelector('.clock:nth-child('+nthChild+') .local');
    /// Init of New Autocomplete attached to the last added clock
    var autocomplete = new google.maps.places.Autocomplete(input, options);

    /// Attaches an event listener to get and apply the search results.
    if(autocomplete) {
		autocomplete.addListener('place_changed', function() {
			/// Request new Google TimezoneId
			var place = autocomplete.getPlace();
			if(place.geometry) {
				var latLng = place.geometry.location.lat() + "," + place.geometry.location.lng();
				clockulous.editLatLngGmaps(latLng, index);
				clockulous.updateZoneData(index);
			}
	        // Save Name
	        clockulous.editLocal(place.name, index);
    	});
    } else {
    	// we were not able to init an autocomplete object.
		console.log("orelse!")
    };
    return autocomplete;
  };

  return global;

})();
