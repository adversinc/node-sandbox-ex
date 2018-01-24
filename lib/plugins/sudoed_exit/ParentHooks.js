var Duplex = require("../../rpc/Duplex");
var DuplexStream = require("../../DuplexStream");
var NamespaceWrapper = require("../../rpc/NamespaceWrapper");
var Promise = require("node-promise/promise").Promise
var util = require("util");
var BaseParentHooks = require("../_base/ParentHooks");

var ParentHooks = module.exports = function(){
    BaseParentHooks.apply(this, arguments);
}

util.inherits(ParentHooks, BaseParentHooks);

ParentHooks.prototype.onExit = function(){
	var rpc = this._manager.plugins.rpc.rpc;

	console.log("parent sending sudoed_die");
	rpc.call("rpc.sudoed_die");
}
