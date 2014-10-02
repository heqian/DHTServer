var DEBUG = false;

var http = require('http');
var fs  = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

var NeDB = require('nedb');
var nedb = new NeDB({
    filename: __dirname + '/database.db',
    autoload: true
});
var exec = require('child_process').exec;


// Sensor polling
function readSensorData() {
    exec(__dirname + '/dht 22 4', function(error, stdout, stderr) {
        var regex = /^Temp =  (-?[0-9]+\.[0-9]) \*C, Hum = ([0-9]+\.[0-9]) \%$/mi;
        if (stdout) {
            if (regex.test(stdout)) {
                var result = stdout.match(regex);
                saveLog(parseFloat(result[1]), parseFloat(result[2]));
            } else {
                readSensorData();
            }
        }

        if (stderr) {
            if (DEBUG) console.log('stderr: ' + stderr);
        }

        if (error) {
            if (DEBUG) console.log('error: ' + error);
        }
    });
}

function saveLog(temperature, humidity) {
    var log = {
        "temperature": temperature,
        "humidity": humidity,
        "timestamp": new Date()
    };

	nedb.insert(log, function(error, newLog) {
		if (error) {
			if (DEBUG) console.log("NeDB error: " + error);
		}
	});
}

setInterval(readSensorData, 60000);


// Server behaviors
function send404(response) {
    response.writeHead(404, {'Content-Type': 'text/plain'});
    response.write('Error 404: resource not found.');
    response.end();
}

function sendFile(response, filePath, fileContent) {
    response.writeHead(
        200,
        {'Content-Type': mime.lookup(path.basename(filePath))}
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
    if (request.url === '/today') {
        var startDate = new Date();
        var endDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        nedb.find({"timestamp": {$gte: startDate, $lte: endDate}}).sort({"timestamp": 1}).exec(function(error, logs) {
            response.writeHead(200, {"Content-Type": "application/json"});
            response.end(JSON.stringify({"logs": logs}));
        });
    } else {
        var filePath = false;

        if (request.url === '/') {
            filePath = 'public/index.html';
        } else {
            filePath = 'public' + request.url;
        }

        var absolutePath = __dirname + '/' + filePath;
        serveStatic(response, cache, absolutePath);
    }
});


// Here we go!
server.listen(80, function() {
    console.log("Server listening on port 80.");
});
