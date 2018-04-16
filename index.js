var fs = require('fs');

var aeToJSON = require('ae-to-json/after-effects');
var ae = require('after-effects');


ae.execute(aeToJSON)
	.then(function(json) {
		var jsonString = JSON.stringify(json, null, '  ');
		process.stdout.write(jsonString);

		fs.writeFileSync('./output.json',jsonString);
	})
	.catch(function(e) {
		throw e;
	});