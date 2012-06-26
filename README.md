node-sandbox
============

About
-----
node-sandbox is a safe way of running untrusted code outside of your application's node process. You can interface with code running in the sandbox via RPC (or any library that works over the node `Stream` API).

You can specify which modules the sandbox can `require()`, or you can disable `require()` altogether. Just be sure something like `net.Socket` isn't accessible via the modules you import!

Documentation
-------------
The library is still unfinished, but you can expect the API to be something like this:

```javascript
//create a new sandbox instance that allows you to require()
//crypto or ./someModule (relative to the .js file being run)
//and that times out after being unresponsive for 10 seconds
var s = new Sandbox("./path/to/code.js", {
    allow: ["crypto", "./someModule"],
    timeout: 10000,
});

//once the sandbox is ready, this gets called
s.once("ready", function(){
    //call a method exposed by the sandbox
    s.rpc.call("someMethod", ["someArg"]).then(function(result){
        console.log(result);
    });
    //expose a method for the sandbox to call
    s.rpc.expose("someMethod", function(arg){
        console.log(arg);
    });
});

//this gets called if the sandbox becomes unresponsive.
s.on("timeout", function(){
    //restart the sandbox
    s.kill();
    s.run();
});

//run the sandbox
s.run();
```
License
-------
This library is Licensed under the Academic Free License version 2.1
