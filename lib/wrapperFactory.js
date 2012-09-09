var wrapperFactory = module.exports = {
    require: function(/*Function*/originalRequire, /*Array*/allowedModules){
        //Builds a limited require() function that can only import modules based on
        //given rules/permissions
        
        //TODO:
        return originalRequire;
    },
    processBinding: function(/*Function*/originalProcessBinding, /*Array*/allowedModules){
        //TODO
        return originalProcessBinding;
    },
    _transformPermissionsToModules: function(permissions){
        //transforms a set of permissions (anything that gets passed to `process.binding`)
        //into a set of core modules that are allowed to be imported
    }
};
