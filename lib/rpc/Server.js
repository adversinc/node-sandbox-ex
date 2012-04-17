var StreamParser = require("./StreamParser"),
    util = require("util");

var Server = module.exports = function(/*Stream*/stream){
    StreamParser.call(this);
}

util.inherits(Server, StreamParser);

//TODO: implement hooks for adding functions/modules, and generating SMDs

Server.prototype._onPacket = function(/*Object*/data){
    this._handleRequest(data);
}

Server.prototype._handleRequest = function(/*Object*/data){
    //TODO
}
