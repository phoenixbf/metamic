/*
	Main js entry for MetaMic front-end

===============================================*/
import Portal from "./portal.js";
import MATS from "./materials.js";
import Totem from "./totem.js";

import Logic from "../logic/spaces.js";

let APP = ATON.App.realize();
//APP.requireFlares(["myFlare"]);
window.APP = APP;

APP.MATS  = MATS;
APP.Totem = Totem;
APP.Logic = Logic;

APP.pathConfigFile   = APP.basePath + "config.json";
APP.pathResAssets    = APP.basePath + "assets/";
APP.pathResIcons     = APP.pathResAssets + "icons/";
APP.pathResAudio     = APP.pathResAssets + "audio/";

APP.confdata = undefined;
APP.PATH_DRAWINGS = undefined;

APP.MODE_INSPECTION = 0;
APP.MODE_PUZZLE     = 1;

APP.STD_FOV = 70.0;


// Setup
//========================================================
APP.setup = ()=>{
    APP._bSupportXR = false;

    APP._mode = APP.MODE_INSPECTION;
    
    APP._currSpaceID = undefined;
    APP._layers = [];
    APP._currLayer = 0;

    APP._bDirtyResetLayers = true;

    // Totems (intro)
    APP._totems = {};
    APP._currTotem = undefined;

    ATON.realize();
    ATON.UI.addBasicEvents();
    APP.setupUI();

    APP.MATS.init();

    APP.setupEvents();
    APP.setupCollabLogic();

    APP.loadConfig();

    APP.gPortals = ATON.createUINode();
    APP.gPortals.attachToRoot();

    APP.gRef = ATON.createSceneNode().load(APP.pathResAssets+"ref-man.glb", ()=>{
        APP.gRef.traverse(o => {
            o.raycast = ATON.Utils.VOID_CAST;
        });
    });
    APP.gRef.setMaterial(APP.MATS.ref);
    APP.gRef.attachToRoot();
    APP.gRef.hide();

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

/*
    UI
===================================*/
APP.setupUI = ()=>{
    ATON.UI.get("toolbar").append(
        ATON.UI.createButtonFullscreen(),
        ATON.UI.createButtonQR(),
        ATON.UI.createButtonVR(),
        ATON.UI.createButtonDeviceOrientation()
    );

    ATON.UI.get("user").append(
        ATON.UI.createButtonUser({
            titlelogin: "MetaMic Login"
        })
    );

    ATON.UI.get("toolbar-bottom").append(
        ATON.UI.createButtonHome()
    );
};

// Semantics
APP.showSemanticPanel = (title, elContent)=>{
    ATON.UI.showSidePanel({
        header: title,
        body: elContent
    });
};

APP.closeSemanticPanel = ()=>{
    ATON.UI.hideSidePanel();
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

APP.resetLayers = (bBroadcast)=>{
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
        
        ///L.position.y = (((numlayers-i) * 0.1) / M.scale.x);
        L.position.y = ((i * -0.25) / M.scale.x);
        //L.position.y = -50.0;
    }

    APP._currLayer = 0;
    ATON.updateLightProbes();

    if (bBroadcast) ATON.Photon.fire("MM_PROG_RESET");
};

// Events
//========================================================
APP.setupEvents = ()=>{
    ATON.on("XR_support", d => {
        if (ATON.device.xrSupported['immersive-vr'] || ATON.device.xrSupported['immersive-ar']){
            APP._bSupportXR = true;
        }
    });

    ATON.on("APP_ConfigLoaded", ()=>{
        let space  = APP.params.get("s");
        let portal = APP.params.get("p");

        if (!space) space = "intro";

        APP.loadSpace(space, portal);
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
        if (APP._bDirtyResetLayers) APP.resetLayers();
        APP._bDirtyResetLayers = false;
    });
    
    ATON.on("APP_SpaceEnter", (spaceid)=>{
        console.log("Entered Space: '"+spaceid+"'");

        if (spaceid === "intro") APP.realizeIntroSpace();
        else APP.realizePortals();
    
        //ATON.Photon.connect();
        APP._bDirtyResetLayers = true;
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

    // VR controllers
    ATON.on("XRselectStart", (c)=>{
        if (c === ATON.XR.HAND_L) APP.requestNextLayerAnimation(true);
    });

    // Keyb
	ATON.on("KeyPress", k =>{
        if (k === ' ' || k === 'Space'){
            ATON.MediaFlow.startAudioStreaming();
        }

		if (k==='u'){
            ATON.updateLightProbes();
		}
		if (k==='a'){
            APP.requestNextLayerAnimation(true);
		}
        if (k==='r'){
            APP.resetLayers(true);
        }

        if (k==='s'){
            let p = ATON.getSceneQueriedPoint();
            if (!p) return;

            if (!APP._P) APP._P = ATON.addClipPlane( new THREE.Vector3(0,-1,0), p );
            else APP._P.constant = p.y;

            ATON.updateLightProbes();
        }
    });
    ATON.on("KeyUp",(k)=>{
        if (k === ' ' || k === 'Space'){
            ATON.MediaFlow.stopAudioStreaming();
        }
    });
};

// Collab logic
//========================================================
APP.setupCollabLogic = ()=>{
    ATON.on("VRC_IDassigned", uid =>{
        ATON.Photon.fire("MM_REQ_SPACE_STATE");
    });

    ATON.Photon.on("MM_PROG", (o)=>{
        if (!o.layer) return;

        APP.requestLayerAnimation(o.layer);
    });

    ATON.Photon.on("MM_PROG_RESET", ()=>{
        APP.resetLayers();
    });
/*
    ATON.Photon.on("MM_REQ_SPACE_STATE", ()=>{
        let S = {};
        S.currLayer = APP._currLayer;

        ATON.Photon.fire("MM_SPACE_STATE", S);
    });

    ATON.on("MM_SPACE_STATE", (S)=>{
        APP.requestLayerAnimation(S.currLayer);
        console.log(S)
    });
*/
};


// Spaces
//========================================================
APP.loadSpace = (spaceid, portalid)=>{
    let S = APP.confdata.spaces[spaceid];
    if (!S) return;

    // Clean previous scene
    if (APP._currSpaceID){
        ATON.SceneHub.clear();
    }

    APP.clearPortals();
    APP.clearTotems();

    ATON.SUI.showSelector(false);

    let sid = S.sid;
    if (!sid) return;

    // reference
    if (S.ref){
        if (S.ref.pos) APP.gRef.setPosition(S.ref.pos[0],S.ref.pos[1],S.ref.pos[2]);
        if (S.ref.scale) APP.gRef.setScale(S.ref.scale);
        
        APP.gRef.show();
    }

    APP.loadScene( sid, ()=>{
        APP._currSpaceID = spaceid;

        if (APP._currSpaceID==="intro"){
            ATON.Nav.locomotionValidator = ()=>{
                if (ATON._queryDataScene === undefined){
                    ATON.Nav._bValidLocomotion = false;
                    return;
                }

                let qs = ATON._queryDataScene;
                let P = qs.p;

                if (P.y > 0.1 || P.y < -0.1) ATON.Nav._bValidLocomotion = false;
                else ATON.Nav._bValidLocomotion = true;
            };
        }

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

        // Scene layers
        let nodes = ATON.SceneHub.currData.scenegraph.nodes;
        for (let n in nodes){
            if (n.startsWith("AI-")){
                ATON.getSceneNode(n).setMaterial(APP.MATS.AI);
            }

            if (n === "present"){
                let elP = ATON.UI.createButton({
                    text: "Context",
                    icon: APP.pathResIcons+"context.png", //"bi-building-fill",
                    classes: "aton-btn-highlight",
                    onpress: ()=>{
                        let P = ATON.getSceneNode("present");
                        P.toggle();

                        if (P.visible) elP.classList.add("aton-btn-highlight");
                        else elP.classList.remove("aton-btn-highlight");
                    }
                })

                ATON.UI.get("toolbar-bottom").append(elP);
            }
        }

        if (APP._currSpaceID !== "intro"){
            ATON.UI.get("toolbar").prepend(
                ATON.UI.createButton({
                    icon: APP.pathResIcons+"logo.png",
                    onpress: ()=>{
                        window.location.href = APP.basePath + "?s=intro";
                    }
                })
            );

            let elProg = ATON.UI.createButton({
                icon: APP.pathResIcons+"recprog.png", //"bi-puzzle-fill",
                onpress: ()=>{
                    APP.requestNextLayerAnimation(true);

                    if (APP._currLayer >= APP._layers.length-1){
                        ATON.UI.showElement(elProgReset);
                        ATON.UI.hideElement(elProg);
                    }
                }
            });

            let elProgReset = ATON.UI.createButton({
                icon: APP.pathResIcons+"recprog-reset.png",
                onpress: ()=>{
                    APP.resetLayers(true);

                    ATON.UI.hideElement(elProgReset);
                    ATON.UI.showElement(elProg);
                }
            });

            ATON.UI.hideElement(elProgReset);

            ATON.UI.get("toolbar-bottom").append( elProg, elProgReset );
        }

        // Collab
        ATON.Photon.connect("metamic-"+spaceid);

        ATON.Nav.requestHomePOV(0.1);

/*
        if (APP._bSupportXR){
            ATON.FX.reset();
        }
*/
        // Setup custom Logic for this space if present
        if (APP.Logic[spaceid]) APP.Logic[spaceid]();

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

    let numTotems = totems.length;
    let rad = 6.0;

    for (let s in totems){
        const S = totems[s];

        APP._totems[S.dstspace] = new Totem(S.dstspace);
        APP._totems[S.dstspace].addDrawings(S.drawings);
        APP._totems[S.dstspace].setTitle(S.label);
        
        //APP._totems[S.dstspace].setPosition(S.pos[0], 0.0, S.pos[1]);

        let c = (parseInt(s)/numTotems) * Math.PI;
        c += (Math.PI/numTotems)*0.5;

        APP._totems[S.dstspace].setPosition(
            -Math.cos(c) * rad,
            0.0,
            -Math.sin(c) * rad,
        );

        APP._totems[S.dstspace].orientToLocation(0,0,0);

        APP._totems[S.dstspace].realize();
        APP._totems[S.dstspace].computePOV();
        APP._totems[S.dstspace].attachToRoot();
    }

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
APP.requestLayerAnimation = (layerid, bBroadcast)=>{
    if (APP._reqLayer !== undefined) return;

    APP._reqLayer = ATON.getSceneNode(layerid);
    if (bBroadcast) ATON.Photon.fire("MM_PROG",{ layer: layerid });
};

APP.requestNextLayerAnimation = (bBroadcast)=>{
    if (!APP._layers) return;
    if (APP._currLayer >= APP._layers.length) return;

    APP._currLayer += 1;

    APP.requestLayerAnimation( APP._layers[APP._currLayer], bBroadcast );
};

APP.handleLayerAnimation = ()=>{
    if (!APP._reqLayer) return;

    APP._reqLayer.scale.y += 0.05;
    APP._reqLayer.position.y *= 0.8;
    //APP._reqLayer.position.y += 0.2;

    if (APP._reqLayer.scale.y > 1.0){
    //if (APP._reqLayer.position.y >= 0.0){

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
