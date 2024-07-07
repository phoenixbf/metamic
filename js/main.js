/*
	Main js entry for MetaMic front-end

===============================================*/
import Portal from "./portal.js";

let APP = ATON.App.realize();
window.APP = APP;

APP.pathConfigFile   = APP.basePath + "config.json";
APP.confdata = undefined;

// Setup
//========================================================
APP.setup = ()=>{

    ATON.FE.realize(); // Realize the base front-end
	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

    APP.setupEvents();

    APP.loadConfig();
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
APP.setupEvents = ()=>{
    ATON.on("APP_ConfigLoaded", ()=>{
        let space = APP.params.get("s");
        if (space) APP.loadSpace(space);
    });
    
    ATON.on("APP_SpaceLoaded", (spaceid)=>{
        console.log("Space: '"+spaceid+"' loaded.");
    
        //ATON.Photon.connect();
    });

    ATON.on("APP_portalRequest", d => {
        APP.loadSpace(d.space);
    });
};


// Spaces
//========================================================
APP.loadSpace = (spaceid, portalid)=>{
    let S = APP.confdata.spaces[spaceid];
    if (!S) return;

    ATON.SceneHub.clear();

    let sid = S.sid;
    if (!sid) return;

    ATON.FE.loadSceneID( sid, ()=>{
        ATON.fireEvent("APP_SpaceLoaded",spaceid);
    });

    let portals = S.portals;
    
    // realize Portals
    for (let p in portals){
        let dd = portals[p];

        let P = new Portal(p);
        P.setDestinationSpace(dd.dst);
        P.realize();
        P.getNode().setPosition(dd.pos[0],dd.pos[1],dd.pos[2]);
        console.log(dd);
    }
};


// Update
//========================================================
APP.update = ()=>{
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
