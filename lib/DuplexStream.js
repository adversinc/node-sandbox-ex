var util = require("util");
var events = require("events");

var DuplexStream = module.exports = function(streamIn, streamOut){
    //DuplexStream takes an input (readable) stream and an
    //output (writable) stream and combines them into one stream.
    //This is handy for when you're dealing with stdin/stdout and
    //want to use a library that requires use of a duplexed stream
    events.EventEmitter.call(this);
    
    this._in = streamIn;
    this._out = streamOut;
    this.readable = true;
    this.writable = true;

    var self = this;

    //utility function for forwarding events
    //emitted from source to dest
    //events to be forwarded should go in 'events'
    var forwardEvents = function(source, dest, events){
        events.forEach(function(eventName){
            source.on(eventName, function(){
                dest.emit.apply(dest, [eventName].concat(arguments));
            });
        });
    }

    //set up event emitters
    forwardEvents(streamIn, this, ["data", "end", "error", "close"]);
    forwardEvents(streamOut, this, ["drain", "error", "close", "pipe"]);

    //utility function that forwards calls to a function
    //named `method` from `source` to `dest`
    var forwardMethod = function(source, dest, method){
        source[method] = function(){
            return dest[method].apply(dest, arguments);
        }
    }

    //set up readable stream methods
    ["setEncoding", "pause", "resume", "pipe"].forEach(function(method){
        forwardMethod(self, streamIn, method);
    });
    
    //set up writable stream methods
    ["write", "end"].forEach(function(method){
        forwardMethod(self, streamOut, method);
    });
}

util.inherits(DuplexStream, events.EventEmitter);

DuplexStream.prototype.destroy = function(){
    this._in.destroy();
    this._out.destroy();
}

DuplexStream.prototype.destroySoon = function(){
    this._in.destroy();
    this._out.destroySoon();
}
