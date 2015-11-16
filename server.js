var DEBUG = false;

var http = require("http");
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var dht22 = require("node-dht22");
var cache = {};

var NeDB = require("nedb");
var nedb = new NeDB({
	filename: __dirname + "/database.db",
	autoload: true
});

function readSensorData() {
	var result = dht22.read(4);
	if (-40 < result.temperature && result.temperature < 80 &&
		0 < result.humidity && result.humidity < 100 &&
		Math.round(result.humidity + result.humidity) !== 0) {
		var log = {
			"temperature": result.temperature.toFixed(1),
			"humidity": result.humidity.toFixed(1),
			"timestamp": new Date()
		};

		nedb.insert(log, function(error) {
			if (error) {
				if (DEBUG) console.log("NeDB error: " + error);
			}
		});
	} else {
		readSensorData();
	}
}

setInterval(readSensorData, 60000);

function send404(response) {
	response.writeHead(404, {
		"Content-Type": "text/plain"
	});
	response.write("Error 404: resource not found.");
	response.end();
}

function sendFile(response, filePath, fileContent) {
	response.writeHead(
		200, {
			"Content-Type": mime.lookup(path.basename(filePath))
		}
	);
	response.end(fileContent);
}

function serveStatic(response, cache, absolutePath) {
	if (cache[absolutePath]) {
		sendFile(response, absolutePath, cache[absolutePath]);
	} else {
		fs.exists(absolutePath, function(exists) {
			if (exists) {
				fs.readFile(absolutePath, function(error, data) {
					if (error) {
						send404(response);
					} else {
						cache[absolutePath] = data;
						sendFile(response, absolutePath, data);
					}
				});
			} else {
				send404(response);
			}
		});
	}
}

var server = http.createServer(function(request, response) {
	if (request.url === "/today") {
		var startDate = new Date();
		var endDate = new Date();
		startDate.setHours(0, 0, 0, 0);
		endDate.setHours(23, 59, 59, 999);

		nedb.find({
			"timestamp": {
				$gte: startDate,
				$lte: endDate
			}
		}).sort({
			"timestamp": 1
		}).exec(function(error, logs) {
			response.writeHead(200, {
				"Content-Type": "application/json"
			});
			response.end(JSON.stringify({
				"logs": logs
			}));
		});
	} else {
		var filePath = false;

		if (request.url === "/") {
			filePath = "public/index.html";
		} else {
			filePath = "public" + request.url;
		}

		var absolutePath = __dirname + "/" + filePath;
		serveStatic(response, cache, absolutePath);
	}
});


// Here we go!
server.listen(80, function() {
	console.log("Server listening on port 80...");
});
