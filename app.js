var fs = require("fs");
var https = require('https');

var AVAILABILITY_PATH = "availability.txt";
gather();
//printViable();

function allNames() {
  return fs.readFileSync("names.txt", "utf8").split(/\s/);
};

function candidateNames() {
  return allNames()
    .map(function(n) { return n.toLowerCase(); })
    .filter(function(n) { return n.match(/\W/) === null; })
    .filter(function(name) { return name.length > 1 && name.length < 8; });
};

function gather() {
  console.log("Working.  Stop program any time - results are saved.");

  var availability = readAvailability(AVAILABILITY_PATH);
  candidateNames().forEach(function(name) {
    if (!(name in availability)) {
      getAvailability(name, function(availabilityDatum) {
        availability[name] = availabilityDatum;
        writeAvailability(AVAILABILITY_PATH, availability);
      });
    }
  });
};

function printViable() {
  var availability = readAvailability(AVAILABILITY_PATH);
  var viable = getViable(availability);
  console.log(viable.join("\n"));
  console.log();
  console.log("Viable domain count:", viable.length);
  console.log("Names for which data has been gathered", Object.keys(availability).length)
  console.log("Candidate name count:", candidateNames().length);
  console.log("All name count:", allNames().length);
};

function getViable(availability) {
  return Object.keys(availability)
    .filter(function(name) {
      return availability[name].isRegistered === false || availability[name].price > 0
    })
    .filter(function(name) { return availability[name].price > 1000; })
    .sort(function(name1, name2) {
      return availability[name1].price - availability[name2].price;
    })
    .map(function(name) { return name + " " + availability[name].price });
};

function readAvailability(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return {};
  }
};

function writeAvailability(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data));
};

function getAvailability(name, cb) {
  var url = "https://instantdomainsearch.com/all/" + name + "?tldTags=com&limit=1";
  https.get(url, function(response) {
    var body = '';
    response.on('data', function(d) {
      body += d;
    });

    response.on('end', function() {
      if (body.length > 0) {
        try {
          var registrationData = JSON.parse(body.split("\n")[0]);
          cb({
            isRegistered: registrationData.isRegistered,
            price: registrationData.price
          });
        } catch (e) {
          cb({ invalid: true });
        }
      }
    });
  });
};
