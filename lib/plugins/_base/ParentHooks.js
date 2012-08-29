var ParentHooks = module.exports = function(){
    throw new Error("This function should be implemented in the child class!");
}

ParentHooks.prototype.onInit = function(){
    //called before the child process is started
}

ParentHooks.prototype.onKill = function(){
    //called just before the kill signal is sent to the process
}

ParentHooks.prototype.onError = function(){
    //called when the child process prints out to stderr
}

ParentHooks.prototype.onExit = function(){
    //called when the child process exits. This can be either after
    //it's killed, or when it finishes executing.
}
