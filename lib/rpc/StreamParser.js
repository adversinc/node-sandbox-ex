var StreamParser = module.exports = function(stream){
    this._stream = stream;

    var self = this;
    stream.on("data", function(/*Buffer*/data){
        self._handleData(data);
    });
}

StreamParser.prototype.COMMAND_SEPARATOR = "\n";

StreamParser.prototype._handleData = function(/*Buffer*/data){
    var self = this;
    //this is way faster than slicing the buffer, since
    //strings are built into v8 and are made for unicode,
    //where buffers are meant for binary data.
    data.toString().split("\n").forEach(function(item){
        if(item == "") return;
        item = JSON.parse(item); //TODO: use a faster JSON parsing lib?
        self._onPacket(item);
    });
}

StreamParser.prototype._onPacket(/*Object*/ data){
    throw new Error("_onPacket is meant to be implemented in a subclass");
}
