var BaseShovelHooks = require("../_base/ShovelHooks");
var Promise = require("node-promise/promise").Promise

var ShovelHooks = module.exports = function(startData, pluginManager){
    BaseShovelHooks.apply(this, arguments);

    //get the RPC class from the RPC plugin
    var rpc = pluginManager.plugins.rpc.rpc;

    //expose a 'rpc.ping' method so the host knows we're still alive
    rpc.expose("rpc.ping", function(){
        return "pong";
    });
}

util.inherits(ShovelHooks, BaseShovelHooks);

ShovelHooks.prototype.onAfterLoad = function(){
    //now just notify the parent process that everything is cool.
    //console.log("ready!");
    rpc.notify("rpc.ready");
}

ShovelHooks.prototype.onExecute = function(){
    //called just after the process runs any untrusted code
}

ShovelHooks.prototype.onKill = function(){
    //called just before the kill signal is sent to the process
}

ShovelHooks.prototype.onError = function(){
    //called when an error is thrown in the child process
}

ShovelHooks.prototype.onExit = function(){
    //called just before the child process exits. If the child
    //process was killed with kill -9, this won't get called
}
