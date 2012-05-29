var StreamParser = require("./StreamParser"),
    util = require("util")
    Promise = require("node-promise/promise").Promise;

var Server = module.exports = function(/*Stream*/stream){
    StreamParser.call(this);
    this._exposedObject = {};
}

util.inherits(Server, StreamParser);

//TODO: implement hooks for generating SMDs

Server.prototype.exposeObject = function(/*Object*/obj){
    this._exposedObject = obj;
}

Server.prototype.expose = function(/*String*/name, /*Object|Function*/value){
    this._exposedObject[name] = value;
}

Server.prototype._onPacket = function(/*Object*/data){
    this._handleRequest(data);
}

Server.prototype._unescapeRpc = function(/*String*/key){
    var keys = key.split(".");
    //TODO: maybe this is unneeded?
}

Server.prototype._getProperty = function(/*Object*/object, /*String*/key){
    var keys = key.split(".");
    var cursor = object;
    while(keys.length > 0){
        cursor = cursor[keys[0]];
        if(cursor == undefined)
            return undefined;
        keys.shift(1);
    }
    return cursor;
}

Server.prototype._handleRequest = function(/*Object*/data){
    //TODO: if data.method or method is null, we need to return an error to client
    var method = this._getProperty(this._exposedObject, data.method);
    var result;

    //TODO: if there's an error while calling the function, return an error to client
    if(Array.isArray(data.params)){
        result = method.call(method, data.params);
    }else{
        result = method(data.params);
    }

    //if there's no id, we don't give a response
    //and treat it like a notification
    if(data.id){
        if(typeof result == "object"
        && typeof result.then == "function"){
            //handle as promise
            var self = this;
            result.then(function(out){
                self._handleSuccess(out, data.id);
            }, function(err){
                self._handleError(err, data.id);
            });
        }else{
            //pass result to client
            this._handleSuccess(result, data.id);
        }
    }
}

Server.prototype._handleSuccess = function(/*Object*/result, /*String*/id){
    //TODO
}

Server.prototype._handleError = function(/*Error*/error, /*String?*/id){
    //TODO
}
