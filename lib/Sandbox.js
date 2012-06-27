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
    check_interval: 10000
}

var Sandbox = module.exports = function(/*String*/path, /*Object*/options){
    EventEmitter.call(this);
    
    //store arguments
    this._path = path;
    if(!options) options = {};
    this._options = _.defaults(options, default_options);

    //private variables
    this._rpc = null;
}

util.inherits(Sandbox, EventEmitter);
