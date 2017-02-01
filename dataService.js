var dataservice = (function() {

  var global = {}

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
      }
      xhttp.onerror = function(){
        reject(xhttp.statusText);
      }
      xhttp.send();
    });
  }

  // assign the returned promise to a variable
  var codesCountries = get('./zonedata/country.csv');
  // use the then mehtod of hte promise to log the resolution.
  codesCountries.then(function(countries){
    global.country = Papa.parse(countries);
    return get('./zonedata/zone.csv')
  }).then(function(zone){
    global.zone = Papa.parse(zone, {dynamicTyping: true} );
    global.autoComplete = [];
    for (i=0;i<global.zone.data.length;i++)
      if (global.zone.data[i] != '')
        global.autoComplete.push( [global.zone.data[i][2], global.zone.data[i][0]] )
    initAutoComplete();
  }).catch(function(error){
    console.log(error);
  });

  //convert the promise to an object.
  global = [];

  return global;
})();
