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

    APP.gPortals = ATON.createUINode();
    APP.gPortals.attachToRoot();
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
        let space  = APP.params.get("s");
        let portal = APP.params.get("p");

        if (space) APP.loadSpace(space, portal);
    });
    
    ATON.on("APP_EnterSpace", (spaceid)=>{
        console.log("Entered Space: '"+spaceid+"'");
    
        //ATON.Photon.connect();
    });

    ATON.on("APP_EnterPortalRequest", d => {
        APP.loadSpace(d.space, d.portal);
    });
};


// Spaces
//========================================================
APP.loadSpace = (spaceid, portalid)=>{
    let S = APP.confdata.spaces[spaceid];
    if (!S) return;

    ATON.SceneHub.clear();
    APP.clearPortals();

    let sid = S.sid;
    if (!sid) return;

    ATON.FE.loadSceneID( sid, ()=>{
        if (portalid && S.portals[portalid]){
            let P = S.portals[portalid];
    
            ATON.Nav.setHomePOV(
                new ATON.POV()
                    .setPosition(new THREE.Vector3(P.pos[0], P.pos[1], P.pos[2]))
                    .setTarget(new THREE.Vector3(P.pos[0]+P.dir[0], P.pos[1]+P.dir[1], P.pos[2]+P.dir[2]))
            );
    
            console.log(portalid);
        }

        ATON.fireEvent("APP_EnterSpace",spaceid);
    });
    
    // realize Portals
    for (let p in S.portals){
        let dd = S.portals[p];

        let P = new Portal(p);
        P.setDestinationSpace(dd.dst);
        P.realize();
        P.setPosition(dd.pos[0],dd.pos[1],dd.pos[2]).attachTo(APP.gPortals);

        APP._portals[p] = P;

        console.log(dd);
    }
};

APP.clearPortals = ()=>{
    APP.gPortals.removeChildren();
    APP._portals = {};
};


// Update
//========================================================
APP.update = ()=>{
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
