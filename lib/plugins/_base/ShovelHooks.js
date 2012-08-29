var ShovelHooks = module.exports = function(){
    throw new Error("This function should be implemented in the child class!");
}

ShovelHooks.prototype.onInit = function(){
    //called just after the child process is started
}

ShovelHooks.prototype.onAfterLoad = function(){
    //called after the shovel loads the code, and before the
    //code is executed
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
