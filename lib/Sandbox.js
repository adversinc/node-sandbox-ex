var Duplex = require("./rpc/Duplex");
var DuplexStream = require("./DuplexStream");
var EventEmitter = require('events').EventEmitter;
var util = require("util");
var _ = require('underscore/underscore');
var Promise = require("node-promise/promise").Promise;

var path = require('path');
var child_process = require('child_process');

//the default options for the sandbox.
var default_options = {
    //the path to the shovel (what bootstraps the child process)
    shovel: path.join(__dirname, "shovel.js"),
    //the node command used to spawn the child process
    node_command: "node",
    //how long we should wait for a reply
    //before emitting a 'lockup' event.
    lockup_timeout: 10000,
    //how long we should wait after killing the process
    //to kill -9 it.
    kill_with_fire_timeout: 10000,
    //the interval we should use to send pings.
    ping_interval: 10000,
    //how long we should wait before assuming
    //the sandbox failed to start (locked up)
    startup_timeout: 10000,
    //method call timeout (passed to RPC)
    call_timeout: -1,
    //which modules we're allowed to import inside the sandbox
    permissions: []
}

var Sandbox = module.exports = function(/*String*/path, /*Object*/options){
    EventEmitter.call(this);
    
    //store arguments
    this._path = path;
    if(!options) options = {};
    this._options = _.defaults(options, default_options);

    //private variables
    this._rpc = null;
    this.isRunning = false;

    this._pingInterval = null;
    this._startupTimer = null;
}

util.inherits(Sandbox, EventEmitter);


//runs the sandbox.
Sandbox.prototype.run = function(){
    var self = this;

    var startOptions = {
        path: this._path,
        permissions: this._options.permissions
    };

    //start the child node process and pass startOptions via it's arguments
    var cprocess = this._process = child_process.spawn(this._options.node_command, [
        this._options.shovel,
        JSON.stringify(startOptions)
    ]);
    
    //create the RPC class
    var rpc = this._rpc = new Duplex(new DuplexStream(cprocess.stdout, cprocess.stdin), {
        call_timeout: this._options.call_timeout
    });

    //expose a 'rpc.ready' method that the sandbox can call when it's initialized
    rpc.expose("rpc.ready", function(){
        self.isRunning = true;
        //clear the startup timeout (see below)
        clearTimeout(self._startupTimer);
        self.emit("ready");
    });

    //if 'rpc.ready' wasn't called after the startup timeout,
    //emit a lockup event
    this._startupTimer = setTimeout(function(){
        if(!self.isRunning){
            //since the process is probably running,
            //but is locked up, we'll set this to true
            self.isRunning = true;
            self.emit("lockup", new Error("Failed to start sandbox"));
        }
    }, this._options.startup_timeout);

    //expose the RPC class for general use
    //TODO: wrap this in some sort of thing so that it applies things to it's own namespace
    this.rpc = rpc;

    //set up stderr handling on the child process
    this._setupStderrEmit();

    //set up the exit event for when the process dies
    cprocess.on("exit", _.bind(this._onExit, this));

    //set up lockup checking
    if(this._options.ping_interval > 0)
        this._setupPingInterval();
}

//called once the child process ends.
Sandbox.prototype._onExit = function(code, signal){
    this._stopPingInterval();
    this.isRunning = false;
    this._process = null;
    this.emit("exit");
}

//sets up automatic pinging, which will cause the class
//to emit 'ping' and 'lockup' events when the sandbox is
//pinged and when it locks up, respectively.
Sandbox.prototype._setupPingInterval = function(){
    var self = this;

    this._pingInterval = setInterval(function(){
        if(!self.isRunning) return;

        self.ping().then(function(time){
            self.emit("ping", time);
        }, function(){
            if(self.isRunning)
                self.emit("lockup", new Error("Lockup detected"));
        })
        
    }, this._options.ping_interval)
};

Sandbox.prototype._stopPingInterval = function(){
    clearInterval(this._pingInterval);
};

//sets up the process so that when it writes to stderr,
//the Sandbox emits an stderr event.
Sandbox.prototype._setupStderrEmit = function(){
    this._process.stderr.on("data", _.bind(function(data){
        this.emit("stderr", data)
    }, this));
}

//kills the child process spawned by the sandbox.
//If necessary, it kills it with fire.
Sandbox.prototype.kill = function(){
    if(!this.isRunning)
        throw Error("Tried to kill Sandbox while not running!");
    
    this._process.kill();
 
    //if we pass a timeout, kill it with fire (SIGKILL)
    var self = this;
    if(this._options.kill_with_fire_timeout > 0)
        setTimeout(function(){
            if(self._process && !self._process.killed)
                self._process.kill('SIGKILL');
        }, this._options.kill_with_fire_timeout);
}

//ping the sandbox to see if it's still alive.
Sandbox.prototype.ping = function(){
    if(!this.isRunning)
        throw Error("Tried to ping Sandbox while not running!");

    var p = new Promise();
    var start = new Date();
    this.rpc.call("rpc.ping").then(function(){
        var end = new Date();
        var delta = end.getTime() - start.getTime();
        p.callback(delta);
    }, function(e){
        p.errback(e);
    });

    //timeout after the interval specified in _options
    if(this._options.lockup_timeout > 0)
        p.timeout(this._options.lockup_timeout);
    return p;
}
