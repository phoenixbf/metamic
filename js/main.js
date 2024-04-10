/*
	Main js entry for MetaMic front-end

===============================================*/
//import XX from "./XX.js";

let APP = ATON.App.realize();
window.APP = APP;

// APP.setup() is required for web-app initialization
// You can place here UI setup (HTML), events handling, etc.
APP.setup = ()=>{

    ATON.FE.realize(); // Realize the base front-end
	ATON.FE.addBasicLoaderEvents(); // Add basic events handling
};

// Update
//========================================================
APP.update = ()=>{
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
