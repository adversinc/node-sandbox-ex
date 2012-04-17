var StreamParser = require("./StreamParser");
    Server = require("./Server"),
    Client = require("./Client"),
    util = require("util");

var Duplex = module.exports = function(/*Stream*/stream){
    StreamParser.call(this);
}

util.inherits(Duplex, Server);
util.inherits(Duplex, Client);

Server.prototype._onPacket = function(/*Object*/data){
    if(is_response) //TODO
        this._handleResponse(data);
    else if(is_request) //TODO
        this._handleRequest(data);
}
