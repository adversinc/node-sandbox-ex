node-sandbox
============

About
-----
node-sandbox is a safe way of running untrusted code outside of your application's node process. You can interface with code running in the sandbox via RPC (or any library that works over the node `Stream` API).

You can specify which modules the sandbox can `require()`, or you can disable `require()` altogether. Just be sure something like `net.Socket` isn't accessible via the modules you import!

NOTE: this library is still unfinished! It will be functional very soon!

License
-------
This library is Licensed under the Academic Free License version 2.1

Documentation
=============
NOTE: this library is still unfinished! It will be functional very soon!

Using node-sandbox is pretty straightforward. The source code is fairly well documented, so if you have any questions, feel free to dive in!

Basic Usage
-----------

```javascript
//create a new sandbox instance that allows you to require()
//crypto or ./someModule (relative to the .js file being run)
var sb = new Sandbox("./path/to/code.js", {
    permissions: ["crypto", "./someModule"]
});

//expose a method for the sandbox to call
sb.rpc.expose("someMethod", function(arg){
    console.log(arg);
});

//run the sandbox
sb.run();

//Wait for the sandbox to initialize.
//We can't call methods until the sandbox is ready,
//otherwise we'll get an error!
sb.on("ready", function(){
    //call a method exposed by the sandbox
    sb.rpc.call("someMethod", ["someArg"]).then(function(result){
        console.log(result);
    });
});
```

Basic options
-------------

There are some basic options you should know about for fringe cases.

If your node command isn't in your `PATH`, you need to specify it manually. By default, it just uses `node`.

If for some reason `Sandbox` isn't detecting the path to `shovel.js`, you can specify the path manually (it's in `node-sandbox/lib/shovel.js`)

```javascript
var sb = new Sandbox("path/to/code.js", {
    
    //the node command used to spawn the child process
    node_command: "node"

    //the path to the shovel (what bootstraps the child process)
    shovel: path.join(__dirname, "shovel.js"),

});
```

Other options are discussed in the relevant sections!

Specifying allowed node modules
-------------------------------

Docs for this will come when the feature is complete!

Exposing RPC Methods
--------------------
node-sandbox comes with a stock RPC library that uses JSON-RPC in a bi-directional way, so that both ends can expose methods for the other to call. We can access it through `Sandbox.rpc`.

Exposing methods in the main process is easy:

```javascript
var sb = new Sandbox(/* options etc */);
sb.run();

//we can expose individual methods, eg:
sb.rpc.expose("addOne", function(arg){
    return arg+1;
});

//we can create namespaces by including a '.'
sb.rpc.expose("myNamespace.someMethod", function(){
    return true;
});

//we can unexpose methods like this!
sb.rpc.unexpose("myNamespace.someMethod");

//alternatively, we can opt to expose an entire object.
//This deletes anything that was already exposed previously.
sb.rpc.exposeObject({
    addOne: function(arg){
        return arg+1;
    },
    myNamespace: {
        someMethod: function(){ return true; }
    }
});

//unexposing still works the same way when
//using exposeObject
sb.rpc.unexpose("myNamespace.someMethod");
```

If you need to work with asynchronous libraries in the methods you expose, you can return a `Promise` object instead. You can use any `Promise` library you like, but I use [Kris Zyp's node-promise](https://github.com/kriszyp/node-promise).

```javascript
sb.rpc.expose("asyncMethod", function(){
    var p = new Promise();

    setTimeout(function(){
        p.callback("Success!");
        //or
        p.errback("Failure!");
    }, 2000);

    return p;
});
```

Exposing methods within the sandbox works the same way, except we use the global `rpc` variable instead of `Sandbox.rpc`. Inside the sandbox, `Promise` is accessible globally for convenience.

```javascript
rpc.expose("myMethod", function(){
    var p = new Promise();
    // etc. etc.
    return p;
});
```

Calling RPC Methods
-------------------

To call methods, you can use `Sandbox.rpc.call`, or `Sandbox.rpc.notify`. Both methods will call the remote method, but `call` will give you a return value, while `notify` won't (see the JSON-RPC docs if this is confusing).

It's important to note that you can't call methods until after `Sandbox` has emitted a `ready` event! See the "Basic Usage" code snippet for an example.

`call` will return a `Promise` object to give you the result asynchronously. See the docs for [Kris Zyp's node-promise](https://github.com/kriszyp/node-promise) for all available methods.

```javascript
//this will call the method like so: myMethod(1, 2, 3);
sb.rpc.call("myMethod", [1, 2, 3]).then(
    function(result){
        console.log("Success! "+result);
    },
    function(error){
        console.log("We got an error: "+error.message);
    }
);

//if we pass call() an object as arguments, it'll call the method like this: myMethod(myObj);
var myObj = {foo: "bar"};
sb.rpc.call("myMethod", myObj);


//here's an example using notify(). It's arguments are identical to call()
sb.rpc.notify("myMethod", [1, 2, 3]); //no returned value
```

Again, the API is identical from within the sandbox. Just use the `rpc` global variable instead of `Sandbox.rpc`

```javascript
rpc.call("myMethod", [1, 2, 3]);
```

RPC Call Timeouts
-----------------

Sometimes, we might want to specify a timeout for method calls, just in case. We can do this one of two ways.

The first is to use the `Promise` api:

```javascript
var p = rpc.call("myMethod", [1, 2, 3]);
p.timeout(10000); //timeout after 10 seconds
p.then(/* ... */);
```

The second is to add an additional `call_timeout` option, eg:

```javascript
var sb = new Sandbox("path/to/code.js", {
    call_timeout: 10000 //10 seconds
});
```

By default, `call_timeout` is `-1`, which disables timeouts to method calls. The value specified in `call_timeout` will also be applied to the `rpc` class inside the sandbox.

Detecting when the sandbox exits
--------------------------------

We can detect when the sandbox exits using the `exit` event.

```javascript
sb.on("exit", function(){
    console.log("the sandbox ended!");
});
```

Lockup detection & killing the sandbox
--------------------------------------
node-sandbox has built in lockup detection, so if a stray `while()` loop locks up the sandbox, we can react to it.

To kill the sandbox, we can use `Sandbox.kill()`.

```javascript
var sb = new Sandbox("path/to/code.js", {
    permissions: [/*...*/],
    
    //Here are some relevant options for lockup detection.
    //All time is specified in milliseconds.
    //Set any of these values to -1 to disable them.

    //how long we should wait for a reply
    //before emitting a 'lockup' event. (default: 10 seconds)
    lockup_timeout: 10000,
    
    //how long we should wait after killing the process
    //to kill -9 it. (default: 10 seconds)
    kill_with_fire_timeout: 10000,
    
    //how frequently we should check the sandbox (default: 10 seconds)
    ping_interval: 10000,
    
    //how long we should wait before assuming
    //the sandbox failed to start (locked up immediately)
    //(default: 10 seconds)
    startup_timeout: 10000,

});

sb.run();

sb.on("lockup", function(){
    //restart the sandbox
    sb.kill();
    sb.run();
});
```

Detecting output on STDERR
--------------------------

If something ever goes wrong within the sandbox, by default it doesn't get printed to the main process' `STDOUT`. Instead, you need to listen on the `stderr` event and do it yourself, eg:

```javascript
sb.on("stderr", function(text){
    console.err(text);
});
```

You can also pass this on to any logging library you use.

Using your own RPC/inter-process communication
----------------------------------------------
node-sandbox works with any RPC or communication library that uses node's `Stream` API. The `Stream` node-sandbox gives you is created using the child process' `STDOUT` and `STDIN` for security reasons.

To get a stream to the sandbox from within the main process, use `Sandbox.getStream()`, eg:

```javascript
var sb = new Sandbox(/* options etc */);
sb.run();

//note: 'ready' is sent over the stream, so don't
//listen on it until after the event is emitted!
sb.on("ready", function(){
    var myStream = sb.getStream();
    //pass myStream to your 3rd party lib
});
```

The other end of the stream can be accessed from within the sandbox through the `parentStream` global variable, eg:

```javascript
var myStream = parentStream;
//pass myStream to your 3rd party lib
```

Note that if you use your own library, node-sandbox's built-in lockup detection will still read from and write to the stream! Set the `ping_interval` option to `-1` to disable it. See "Lockup detection & killing the sandbox" for more detail.

Pinging the Sandbox
-------------------

If you want to ping the sandbox to figure out latency, you can use `Sandbox.ping()`, which returns a `Promise` object.

```javascript
sb.ping().then(function(time){
    console.log("Sandbox latency: "+time);
}, function(err){
    console.log("Failed to ping sandbox!");
});
```

