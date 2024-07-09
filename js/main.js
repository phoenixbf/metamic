/*
	Main js entry for MetaMic front-end

===============================================*/
import Portal from "./portal.js";

let APP = ATON.App.realize();
window.APP = APP;

APP.pathConfigFile   = APP.basePath + "config.json";
APP.confdata = undefined;

APP.MODE_INSPECTION = 0;
APP.MODE_PUZZLE     = 1;


// Setup
//========================================================
APP.setup = ()=>{

    APP._mode = APP.MODE_INSPECTION;
    
    APP._currSpaceID = undefined;

    ATON.FE.realize(); // Realize the base front-end
	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

    APP.setupEvents();

    APP.loadConfig();

    APP.gPortals = ATON.createUINode();
    APP.gPortals.attachToRoot();
};

APP.setMode = (m)=>{
    APP._mode = m;
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
    
    ATON.on("APP_SpaceEnter", (spaceid)=>{
        console.log("Entered Space: '"+spaceid+"'");

        APP.realizePortals();
    
        //ATON.Photon.connect();
    });

    ATON.on("APP_PortalEnterRequest", d => {
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
        APP._currSpaceID = spaceid;

        if (portalid && S.portals[portalid]){
            let P = S.portals[portalid];
    
            ATON.Nav.setHomePOV(
                new ATON.POV()
                    .setPosition(new THREE.Vector3(P.pos[0], P.pos[1], P.pos[2]))
                    .setTarget(new THREE.Vector3(P.pos[0]+P.dir[0], P.pos[1]+P.dir[1], P.pos[2]+P.dir[2]))
            );
    
            console.log(portalid);
        }

        ATON.fireEvent("APP_SpaceEnter",spaceid);
    });

};

APP.realizePortals = ()=>{
    let S = APP.confdata.spaces[APP._currSpaceID];
    if (!S) return;

    for (let p in S.portals){
        let dd = S.portals[p];

        let pos = new THREE.Vector3(dd.pos[0],dd.pos[1],dd.pos[2]);
        let dir = new THREE.Vector3(dd.dir[0],dd.dir[1],dd.dir[2]);

        let dsp = APP.confdata.spaces[dd.dst];

        let P = new Portal(p);
        P.realize();

        P.setDestinationSpace(dd.dst);
        P.setTitle(dd.title);
        P.setPosition(pos).attachTo(APP.gPortals);
        P.setEnterDirection(dir);

        P.setView(ATON.PATH_RESTAPI+"cover/" + dsp.sid);

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
