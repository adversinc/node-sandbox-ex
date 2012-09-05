var MANIFEST_FILE = "manifest.js";

var PluginManager = module.exports = function(plugins, pluginClassName, pluginDir){

    var plugin_instances = this._plugins = [];
    var plugin_metadata = this._metadata = {};
    if(!pluginDir) pluginDir = "./plugins";
    
    var self = this;

    var conflictTests = [];

    plugins.forEach(function(plugin){
        //load manifest
        var manifest = require(plugindir+"/"+plugin.name+"/"+MANIFEST_FILE);

        //add the plugin and anything it provides to the this._metadata member variable
        //if we're providing something that already exists, throw an error
        plugin_metadata[plugin] = manifest;
        manifest.provides.forEach(function(provide){
            if(plugin_metadata[provide])
                throw new Error("Plugin '"+plugin+"' provides '"+provide+"', but that's already provided by '"+plugin_metadata[provide].name+"'!");
            plugin_metadata[provide] = manifest;
        });

        //test dependencies/conflicts, throw error if there's an issue
        self._testPackages(plugin, manifest.depends, true);
        conflictTests.push([plugin, manifset.conflicts, false]);

        //load the constructor
        var constructor = require(pluginDir+"/"+plugin.name+"/"+pluginClassName);

        //TODO: init plugin
    });

    //Test for conflicts. We can't test while loading plugins since
    //a conflicting plugin might not have been loaded yet, but a
    //dependant plugin needs to be loaded before the depending plugin
    conflictTests.forEach(function(args){
        self._testPackages.apply(self, args);
    });
}

PluginManager.prototype._testPackages = function(name, pluginList, isDependent){
    var self = this;
    pluginList.forEach(function(pluginName){
        //if we're dependent and the package doesn't exist, or 
        //if we're conflicting and the package does exist, throw an exception
        if(!!self.plugin_metadata[pluginName] != isDependent){
            //if we're conflicting, look up the real name of the
            //conflicting package, otherwise just use the depending
            //package name (since there's no way of telling what provides what)
            var realPluginName = pluginName;
            if(!isDependent)
                realPluginName = self.plugin_metadata[packageName].name;
            throw new Error("Plugin '"+name+"' "+(isDependent ? "depends on" : "conflicts with")+" plugin '"+realPluginName+"'!");
        }
    });
}

PluginManager.prototype.call = function(method){
    //TODO
}
