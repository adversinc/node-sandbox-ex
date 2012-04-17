var StreamParser = require("./StreamParser"),
    util = require("util");

var Client = module.exports = function(/*Stream*/stream){
    StreamParser.call(this);
}

util.inherits(Client, StreamParser);

//TODO: add functions to load SMDs for creating callable functions

Client.prototype._onPacket = function(/*Object*/data){
    this._handleResponse(data);
}

Client.prototype._handleResponse = function(/*Object*/data){
    //TODO
}
