/*
	Main js entry for MetaMic front-end

===============================================*/
import Portal from "./portal.js";
import MATS from "./materials.js";
import Totem from "./totem.js";

let APP = ATON.App.realize();
//APP.requireFlares(["myFlare"]);
window.APP = APP;

APP.MATS  = MATS;
APP.Totem = Totem;

APP.pathConfigFile   = APP.basePath + "config.json";
APP.pathResAssets    = APP.basePath + "assets/";

APP.confdata = undefined;
APP.PATH_DRAWINGS = undefined;

APP.MODE_INSPECTION = 0;
APP.MODE_PUZZLE     = 1;

APP.STD_FOV = 70.0;


// Setup
//========================================================
APP.setup = ()=>{

    APP._mode = APP.MODE_INSPECTION;
    
    APP._currSpaceID = undefined;
    APP._layers = [];
    APP._currLayer = 0;

    // Totems (intro)
    APP._totems = {};
    APP._currTotem = undefined;

    ATON.realize();
    ATON.UI.addBasicEvents();
    APP.setupUI();

    APP.MATS.init();

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

APP.setupUI = ()=>{
    ATON.UI.get("toolbar").append(
        //ATON.UI.createButtonBack(),
        ATON.UI.createButtonVR(),
        ATON.UI.createButtonAR(),
        ATON.UI.createButtonDeviceOrientation()
    );
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

        APP.PATH_DRAWINGS = APP.confdata.drawingspath;

        ATON.fireEvent("APP_ConfigLoaded");
    });
};

APP.setupShadows = ()=>{
    if (!ATON._dMainL) return;

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
    if (!APP._layers) return;

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
        //console.log(APP._layers);

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
        if (APP._currSpaceID === "intro") return;

        let sc = APP.confdata.spaces[APP._currSpaceID];

        // custom setup shadows
        //APP.setupShadows();
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

        if (spaceid === "intro") APP.realizeIntroSpace();
        else APP.realizePortals();
    
        //ATON.Photon.connect();
    });

    ATON.on("APP_PortalEnterRequest", d => {
        let str = APP.basePath + "?s="+d.space;
        if (d.portal) str += "&p="+d.portal;

        //APP.loadSpace(d.space, d.portal);
        window.location.href = str;
    });

    ATON.on("TotemEnterProximity",spaceid => {
        console.log("Enter "+spaceid)
        APP._currTotem = spaceid;

        return;

        for (let t in APP._totems){
            if (t !== spaceid) APP._totems[t].switchOff();
            else APP._totems[t].switchOn();
        }
    });
    ATON.on("TotemLeaveProximity",spaceid => {
        console.log("Leave "+spaceid)
        APP._currTotem = undefined;

        return;

        for (let t in APP._totems) APP._totems[t].switchOn();
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
    APP.clearTotems();


    ATON.SUI.showSelector(false);

    let sid = S.sid;
    if (!sid) return;

    APP.loadScene( sid, ()=>{
        APP._currSpaceID = spaceid;

        APP._layers = S.modules;

        if (portalid && S.portals[portalid]){
            let P = S.portals[portalid];

            let dir = P.dir;
    
            ATON.Nav.setHomePOV(
                new ATON.POV()
                    .setPosition(new THREE.Vector3(
                        P.pos[0] + (dir[0]*2),
                        P.pos[1] + (dir[1]*2),
                        P.pos[2] + (dir[2]*2)
                    ))
                    .setTarget(new THREE.Vector3(
                        P.pos[0] + (dir[0]*10), 
                        P.pos[1] + (dir[1]*10),
                        P.pos[2] + (dir[2]*10)
                    ))
                    .setFOV(APP.STD_FOV)
            );
    
            console.log(portalid);
        }

        // Collab
        ATON.Photon.connect("metamic-"+spaceid);

        ATON.Nav.requestHomePOV();

        ATON.fire("APP_SpaceEnter",spaceid);
    });

};

APP.realizePortals = ()=>{
    let S = APP.confdata.spaces[APP._currSpaceID];
    if (!S) return;

    for (let p in S.portals){
        let dd = S.portals[p];

        let pos = new THREE.Vector3(dd.pos[0],dd.pos[1],dd.pos[2]);
        let dir = new THREE.Vector3(-dd.dir[0],-dd.dir[1],-dd.dir[2]);

        // Check for destination space
        let dsp = APP.confdata.spaces[dd.dstspace];

        if (dsp){
            let P = new Portal(p);
            P.realize();
    
            P.setDestinationSpace(dd.dstspace);
            if (dd.dstportal) P.setDestinationPortal(dd.dstportal);
    
            P.setTitle(dd.title);
            P.setPosition(pos).attachTo(APP.gPortals);
            P.setEnterDirection(dir);
    
            P.setView(ATON.PATH_RESTAPI2+"scenes/"+dsp.sid+"/cover");
    
            APP._portals[p] = P;
    
            console.log(dd);
        }
    }
};

APP.clearPortals = ()=>{
    APP.gPortals.removeChildren();
    APP._portals = {};
};

APP.clearTotems = ()=>{
    for (let s in APP._totems){
        let S = APP._totems[s];

        S.clear();
        
        S.removeChildren();
        delete APP._totems[s];
    }

    APP._totems = {};
};


// Plane utility
APP.createPlane = (xsize, zsize, material, type)=>{
    if (!type) type = ATON.NTYPES.SCENE;

    let g = new THREE.PlaneGeometry( xsize, zsize );

    let N = new ATON.Node(undefined,type).rotateX(-Math.PI * 0.5);
    N.add( new THREE.Mesh(g, material) ); // ATON.MatHub.materials.fullyTransparent

    return N;
};

APP.createDrawingMesh = (path, sx,sy)=>{
    path = ATON.Utils.resolveCollectionURL(path);

    let panel = new THREE.Mesh( new THREE.PlaneGeometry(1,1));
	panel.material = new THREE.MeshStandardMaterial({
		//side: THREE.DoubleSide
	});

    let yratio = 1.0;
	let size   = 1.0;

    ATON.Utils.loadTexture(path, (tex) => {
		if (tex.image){
			yratio = tex.image.height / tex.image.width;
			
			//if (tex.image.height > tex.image.width) size = tex.image.height;
			//else size = tex.image.width;

            size = Math.max(tex.image.height, tex.image.width);
		}

		tex.flipY = false;
		tex.colorSpace = ATON._stdEncoding;
		
        //tex.wrapS = THREE.RepeatWrapping;
		//tex.wrapT = THREE.RepeatWrapping;

		panel.scale.y = -yratio;
		panel.scale.z = 1.0/size;

		panel.material.map = tex;
		panel.material.needsUpdate = true;
	});

    return panel;
};

// Intro Space
//========================================================
APP.realizeIntroSpace = ()=>{
/*
    let G = APP.createPlane(20,20, APP.MATS.introGround);
    G.enablePicking().attachToRoot();
    ATON._bqScene = true;
*/
    const totems = APP.confdata.spaces.intro.totems;
    if (!totems) return;

    for (let s in totems){
        const S = totems[s];

        APP._totems[S.dstspace] = new Totem(S.dstspace);
        APP._totems[S.dstspace].addDrawings(S.drawings);
        APP._totems[S.dstspace].setPosition(S.pos[0], 0.0, S.pos[1]);
        APP._totems[S.dstspace].realize();

        APP._totems[S.dstspace].attachToRoot();
    }

    ATON.Utils.loadTexture(APP.pathResAssets+ "cshadow.jpg", (tex)=>{
        APP.MATS.cshadow.map = tex;
        APP.MATS.cshadow.needsUpdate = true;
    });

    ATON.Utils.loadTexture(APP.pathResAssets+ "spotray.jpg", (tex)=>{
        APP.MATS.introSpotRay.map = tex;
        APP.MATS.introSpotRay.needsUpdate = true;
    });

    

    // Lights
/*
    const spot = new THREE.SpotLight( 0xffffff );
    spot.position.set( 0, 3, 0 );
    spot.intensity = 50;
    root.add(spot)
*/
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

APP.handleTotems = ()=>{
    if (APP._currSpaceID !== "intro") return;

    APP.MATS.maquette.uniforms.time.value = ATON.getElapsedTime();

    for (let t in APP._totems){
        const T = APP._totems[t];
        T.update();
    }
};

APP.handlePortals = ()=>{
    if (APP._currSpaceID === "intro") return;

    for (let p in APP._portals){
        const P = APP._portals[p];
        P.update();
    }
};

APP.update = ()=>{
    APP.handleLayerAnimation();
    if (APP._CSM) APP._CSM.update();

    APP.handleTotems();
    APP.handlePortals();
};


// Run the App
window.addEventListener('load', ()=>{
	APP.run();
});
