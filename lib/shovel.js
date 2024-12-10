(function() {
	var PluginManager = require("./PluginManager");
	var Promise = require("node-promise/promise").Promise;
	var fs = require("fs");
	var vm = require("vm");

	//stdin is paused by default, resume it so the RPC class can make use of it
	process.stdin.resume();


	//DEBUG CODE
	/*
	process.stdin.setEncoding("utf8");
	process.stdin.on("data", function(data){
			console.log("DATA TO SANDBOX: "+data);
	});
	//*/

	//decode our start information
	var startData = JSON.parse(process.argv[2]);

	// The future global context
	var processExit = function (code) {
		process.exit(code);
	}

	var context = {
		console: console,
		setTimeout: setTimeout,
		clearTimeout: clearTimeout,
		setInterval: setInterval,
		clearInterval: clearInterval,
		process: {
			exit: function (code) {
				processExit(code);
			}
		},
	};

	//init plugins
	var pluginManager = new PluginManager(startData.plugins, "ShovelHooks", startData.plugins_dir, context);

	process.title = "Sandbox Shovel";
	if (typeof (startData.processName) != "undefined") {
		process.title = startData.processName;
	}

	//now we actually load the code we need to run
	fs.readFile(startData.path, function (err, data) {
		if (err) {
			pluginManager.call("loadError", err);
			//write error to stderr if we can't load the file
			process.stderr.write(err.toString());
			//then die
			process.exit(-1);
		} else {
			pluginManager.call("afterLoad", data);

			//run the code
			var script = vm.createScript(data, startData.path);
			//according to node's docs, runInThisContext doesn't
			//run it in the local scope, but rather our global scope.
			//so just calling this here should be cool.
			//see http://nodejs.org/api/vm.html#vm_script_runinthiscontext

			// Try to protect the shovel code
			Function.prototype.constructor = null;
			Function.prototype.toString = null;
			Object.freeze(Function.prototype);

			//script.runInThisContext();
			script.runInNewContext(context);

			pluginManager.call("execute", script);
		}
	});
})();
