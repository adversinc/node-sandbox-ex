var StreamParser = require("./StreamParser"),
    util = require("util"),
    uuid = require("node-uuid/uuid"),
    Promise = require("promise/promise").Promise;

var Client = module.exports = function(/*Stream*/stream){
    StreamParser.call(this);
    this._responsePromises = {};
}

util.inherits(Client, StreamParser);

//TODO: add functions to load SMDs for creating (simulated) callable functions

Client.prototype._default_options = {
    call_timeout: -1
}

Client.prototype._onPacket = function(/*Object*/data){
    this._handleResponse(data);
}

Client.prototype.call = function(/*string*/methodName, /*Object*/params){
    var p = new Promise();
    var id = uuid.v4();
    this._responsePromises[id] = p;
    var out = JSON.stringify({
        id: id,
        method: methodName,
        params: params
    });
    this._stream.write(out+this.COMMAND_SEPARATOR);
    if(this._options.call_timeout > 0){
        p.timeout(this._options.call_timeout);
    }
    return p;
}

Client.prototype._handleResponse = function(/*Object*/data){
    var p = this._responsePromises[data.id];
    if(!data.id){
        //handle as notification
        //TODO: use an event emitter or something?
    }else if(!p){
        throw new Error("Got a response that we don't have a handler for!");
    }else{
        p[data.error ? "emitError" : "emitSuccess"](data.error || data.result);
        delete this._responsePromises[data.id];
    }
}
