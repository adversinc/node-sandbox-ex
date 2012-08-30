var BaseShovelHooks = require("../_base/ShovelHooks");
var Promise = require("node-promise/promise").Promise

var ShovelHooks = module.exports = function(startData){
    BaseShovelHooks.apply(this, arguments);

    //make a new rpc server/client and expose it globally
    var rpc = new Duplex(new DuplexStream(process.stdin, process.stdout), {
        call_timeout: startData.call_timeout
    });

    //wrap the RPC class so it works off of it's own namespace
    global.rpc = new NamespaceWrapper(rpc, "sandbox");
    //expose the stream for the parent process to the global scope
    global.parentStream = new DuplexStream(process.stdin, process.stdout);
    //expose promise to the global scope, because it's needed for exposed methods, so why not.
    global.Promise = Promise;
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
