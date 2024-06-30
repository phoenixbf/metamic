/*
	Main js entry for MetaMic front-end

===============================================*/
//import XX from "./XX.js";

let APP = ATON.App.realize();
window.APP = APP;

APP.pathConfigFile   = APP.basePath + "config.json";
APP.confdata = undefined;

// Setup
//========================================================
APP.setup = ()=>{

    ATON.FE.realize(); // Realize the base front-end
	ATON.FE.addBasicLoaderEvents(); // Add basic events handling
};

// Config
APP.loadConfig = ()=>{
    return $.getJSON( APP.pathConfigFile, ( data )=>{
        //console.log(data);
        console.log("Loaded config");

        APP.confdata = data;

        ATON.fireEvent("APP_ConfigLoaded");
    });
};

// Events
//========================================================
ATON.on("APP_ConfigLoaded", ()=>{

});



// Update
//========================================================
APP.update = ()=>{
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
