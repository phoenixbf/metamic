/*
	Main js entry for MetaMic front-end

===============================================*/
import Portal from "./portal.js";

let APP = ATON.App.realize();
//APP.requireFlares(["myFlare"]);
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
    APP._layers = [];
    APP._currLayer = 0;

    ATON.FE.realize(); // Realize the base front-end
	ATON.FE.addBasicLoaderEvents(); // Add basic events handling

    APP.setupEvents();

    APP.loadConfig();

    APP.gPortals = ATON.createUINode();
    APP.gPortals.attachToRoot();

    //ATON._mainRoot.background = ATON.MatHub.colors.white;
    //ATON._mainRoot.fog = new THREE.FogExp2( new THREE.Color( 0.9,0.9,0.9 ), 0.01 );
    //ATON._renderer.shadowMap.enabled = true;

    APP._CSM = undefined;

    APP._P = undefined;

    // If our app required ore or more flares (plugins), we can also wait for them to be ready for specific setups
    ATON.on("AllFlaresReady",()=>{
		// Do stuff
		console.log("All flares ready");
	});
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

APP.setupShadows = ()=>{
    let S = ATON._dMainL.shadow;
    if (!S) return;

    S.camera.left   = -50;
    S.camera.right  = 50;
    S.camera.bottom = -50;
    S.camera.top    = 50;

    S.mapSize.width  = 2048;
    S.mapSize.height = 2048;
    
    S.camera.near    = 0.1;
    S.camera.far     = 150;
    S.bias           = 0.0; //-0.0005;
};

APP.resetLayers = ()=>{
    let numlayers = APP._layers.length;

    let M = ATON.getSceneNode("main");

    for (let i=1; i<numlayers; i++){
        let L = ATON.getSceneNode(APP._layers[i]);
        
        //L.hide();
/*
        let axis = i%3;

        if (axis===0) L.scale.x = 0.01;
        if (axis===1) L.scale.y = 0.01;
        if (axis===2) L.scale.z = 0.01;
*/
        L.scale.y = 0.05;
        
        //L.position.y = (((numlayers-i) * 0.1) / M.scale.x);
        L.position.y = ((i * -0.25) / M.scale.x);
    }

    APP._currLayer = 0;
    ATON.updateLightProbes();
};

// Events
//========================================================
APP.setupEvents = ()=>{
    ATON.on("APP_ConfigLoaded", ()=>{
        let space  = APP.params.get("s");
        let portal = APP.params.get("p");

        if (space) APP.loadSpace(space, portal);
    });

    ATON.on("AllNodeRequestsCompleted", ()=>{
        console.log(APP._layers);

        // CSM
/*
        APP._CSM = new THREE.CSM({
            maxFar: 200,
            cascades: 4,
            //mode: params.mode,
            parent: ATON._rootVisible,
            shadowMapSize: 1024,
            lightDirection: ATON._dMainLdir,
            camera: ATON.Nav._camera
        });
*/
        let sc = APP.confdata.spaces[APP._currSpaceID];

        // custom setup shadows
        APP.setupShadows();
/*
        M.traverse( ( o ) => {
            o.castShadow = true;
            o.receiveShadow = true;

            if (o.material){
                APP._CSM.setupMaterial( o.material );
                o.material.needsUpdate = true;
            }
        });
*/
        APP.resetLayers();
    });
    
    ATON.on("APP_SpaceEnter", (spaceid)=>{
        console.log("Entered Space: '"+spaceid+"'");

        APP.realizePortals();
    
        //ATON.Photon.connect();
    });

    ATON.on("APP_PortalEnterRequest", d => {
        APP.loadSpace(d.space, d.portal);
    });

    // Keyb
	ATON.on("KeyPress", k =>{
		if (k==='u'){
            ATON.updateLightProbes();
		}
		if (k==='a'){
            APP.requestNextLayerAnimation();
		}
        if (k==='r'){
            APP.resetLayers();
        }

        if (k==='s'){
            let p = ATON.getSceneQueriedPoint();
            if (!p) return;

            if (!APP._P) APP._P = ATON.addClipPlane( new THREE.Vector3(0,-1,0), p );
            else APP._P.constant = p.y;

            ATON.updateLightProbes();
        }
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

        APP._layers = S.modules;

        if (portalid && S.portals[portalid]){
            let P = S.portals[portalid];
    
            ATON.Nav.setHomePOV(
                new ATON.POV()
                    .setPosition(new THREE.Vector3(P.pos[0], P.pos[1], P.pos[2]))
                    .setTarget(new THREE.Vector3(P.pos[0]+P.dir[0], P.pos[1]+P.dir[1], P.pos[2]+P.dir[2]))
            );
    
            console.log(portalid);
        }

        // Collab
        ATON.Photon.connect("metamic-"+spaceid);

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
APP.requestLayerAnimation = (layerid)=>{
    if (APP._reqLayer !== undefined) return;

    APP._reqLayer = ATON.getSceneNode(layerid);
};

APP.requestNextLayerAnimation = ()=>{
    if (APP._currLayer >= APP._layers.length) return;

    APP._currLayer += 1;

    APP.requestLayerAnimation( APP._layers[APP._currLayer] );
};

APP.handleLayerAnimation = ()=>{
    if (!APP._reqLayer) return;

    APP._reqLayer.scale.y += 0.05;
    APP._reqLayer.position.y *= 0.8;

    if (APP._reqLayer.scale.y > 1.0){
        APP._reqLayer.scale.x = 1.0;
        APP._reqLayer.scale.y = 1.0;
        APP._reqLayer.scale.z = 1.0;

        APP._reqLayer.position.y = 0.0;
        
        APP._reqLayer = undefined;

        ATON.updateLightProbes();
    }
};

APP.update = ()=>{
    APP.handleLayerAnimation();
    if (APP._CSM) APP._CSM.update();
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
