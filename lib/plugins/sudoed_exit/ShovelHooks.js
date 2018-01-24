var ShovelHooks = module.exports = function() {
	//get the RPC class from the RPC plugin
	var rpc = this.rpc = this._manager.plugins.rpc.rpc;

	//expose a 'rpc.ping' method so the host knows we're still alive
	rpc.expose("rpc.sudoed_die", function () {
		process.exit();
	});
}

util.inherits(ShovelHooks, BaseShovelHooks);
