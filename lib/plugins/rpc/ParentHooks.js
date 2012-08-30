var Duplex = require("../../rpc/Duplex");
var DuplexStream = require("../../DuplexStream");
var NamespaceWrapper = require("../../rpc/NamespaceWrapper");
var util = require("util");
var BaseParentHooks = require("../_base/ParentHooks");

var ParentHooks = module.exports = function(sandbox, options){
    BaseParentHooks.apply(this, arguments);
    this.rpc = null;
    this.isRunning = false;

    this.startData = {
        call_timeout: options.call_timeout
    }
}

util.inherits(ParentHooks, BaseParentHooks);

ParentHooks.prototype.onSpawn = function(){
    //create the RPC class
    var cprocess = this._sandbox._process
    var rpc = this.rpc = new Duplex(new DuplexStream(cprocess.stdin, cprocess.stdout), {
        call_timeout: this._options.call_timeout
    });
    
    //expose a 'rpc.ready' method that the sandbox can call when it's initialized
    var self = this;
    rpc.expose("rpc.ready", function(){
        self.isRunning = true;
        //clear the startup timeout (see below)
        clearTimeout(self._startupTimer);
        self._sandbox.emit("ready");
    });

    //expose the RPC class for general use (wrap it so it uses it's own namespace)
    this._sandbox.rpc = new NamespaceWrapper(rpc, "sandbox");

}
