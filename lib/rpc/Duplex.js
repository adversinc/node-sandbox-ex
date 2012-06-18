var StreamParser = require("./StreamParser");
    Server = require("./Server"),
    Client = require("./Client"),
    util = require("util");
var _ = require("underscore/underscore");

var Duplex = module.exports = function(/*Stream*/stream, /*Object*/options){
    StreamParser.apply(this, arguments);

    //TODO: better way of doing this?
    this._responsePromises = {};
    this._exposedObject = {};
}

//NOTE: this is a somewhat ugly trick to get multiple inheritence working.
_.extend(Duplex.prototype, Server.prototype);
_.extend(Duplex.prototype, Client.prototype);
_.extend(Duplex, Server);
_.extend(Duplex, Client);

//This doesn't work, because util.inherits overrides whatever is already in Duplex.prototype,
//so we only get stuff inherited from Client
//util.inherits(Duplex, Server);
//util.inherits(Duplex, Client);

Duplex.prototype._onPacket = function(/*Object*/data){
    if(data.result) //response
        this._handleResponse(data);
    else if(data.params) //request
        this._handleRequest(data);
}
