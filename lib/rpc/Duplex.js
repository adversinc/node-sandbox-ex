var StreamParser = require("./StreamParser");
    Server = require("./Server"),
    Client = require("./Client"),
    util = require("util");

var Duplex = module.exports = function(/*Stream*/stream, /*Object*/options){
    StreamParser.apply(this, arguments);

    //TODO: better way of doing this?
    this._responsePromises = {};
    this._exposedObject = {};
}

util.inherits(Duplex, Server);
util.inherits(Duplex, Client);

Server.prototype._onPacket = function(/*Object*/data){
    if(data.result) //response
        this._handleResponse(data);
    else if(data.params) //request
        this._handleRequest(data);
}
