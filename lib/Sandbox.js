var Duplex = require("./rpc/Duplex");
var DuplexStream = require("./DuplexStream");
var EventEmitter = require('events').EventEmitter;
var util = require("util");
var _ = require('underscore/underscore');

var path = require('path');
var child_process = require('child_process');

var default_options = {
    shovel: path.join(__dirname, "shovel.js"),
    node_command: "node",
    kill_timeout: 10000,
    check_interval: 10000,
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
}

util.inherits(Sandbox, EventEmitter);

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
    var rpc = this._rpc = new Duplex(new DuplexStream(cprocess.stdout, cprocess.stdin));

    //expose a 'rpc.ready' method that the sandbox can call when it's initialized
    rpc.expose("rpc.ready", function(){
        self.isRunning = true;
        self.emit("ready");
    });

    //expose the RPC class for general use
    //TODO: wrap this in some sort of thing so that it applies things to it's own namespace
    this.rpc = rpc;

    //set up stderr handling on the child process
    this._setupStderrEmit();
}

//sets up the process so that when it writes to stderr,
//the Sandbox emits an stderr event.
Sandbox.prototype._setupStderrEmit = function(){
    this._process.stderr.on("data", _.bind(function(data){
        this.emit("stderr", data)
    }, this));
}

