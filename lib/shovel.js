(function(){
    var Duplex = require("./rpc/Duplex")
      , DuplexStream = require("./DuplexStream")
      , requireFactory = require("./requireFactory")
      , Promise = require("node-promise/promise").Promise
      , fs = require("fs")
      , vm = require("vm");

    //stdin is paused by default, resume it so the RPC class can make use of it
    process.stdin.resume();


    //DEBUG CODE
    /*
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", function(data){
        console.log("DATA TO SANDBOX: "+data);
    });
    //*/

    //make a new rpc server/client and expose it globally
    var rpc = new Duplex(new DuplexStream(process.stdin, process.stdout));
    global.rpc = rpc;
    //expose promise, because it's needed for exposed methods, so why not.
    global.Promise = Promise;

    //decode our start information
    var startData = JSON.parse(process.argv[2]);

    
    //seal off require() before loading any code
    global.require = requireFactory(global.require, startData.permissions);

    
    //now we actually load the code we need to run
    fs.readFile(startData.path, function(err, data){
        if(err){
            //write error to stderr if we can't load the file
            process.stderr.write(err.toString());
            //then die
            process.exit(1);
        }else{
            //run the code
            var script = vm.createScript(data, startData.path);
            //according to node's docs, runInThisContext doesn't
            //run it in the local scope, but rather our global scope.
            //so just calling this here should be cool.
            //see http://nodejs.org/api/vm.html#vm_script_runinthiscontext
            script.runInThisContext();
            
            //now just notify the parent process that everything is cool.
            rpc.notify("rpc.ready");
        }
    });
})();
