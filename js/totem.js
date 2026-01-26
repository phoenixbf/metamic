class Totem extends ATON.Node {

constructor(spaceid){
    super("T-"+spaceid, ATON.NTYPES.SCENE);

    this._spaceid = spaceid;

    this._drawings = undefined;

    this._spotH = 2.5;

    this._dsProximity  = 8.0;
    this._dsActivation = 3.0;

    this._bProxUser = false;
    this._tEnterProx = undefined;

    this._label = undefined;
}

setTitle(str){
    if (!this._label){
        this._label = new ATON.SUI.Label(undefined, 0.3);
        this._label.setPosition(0,0.9,0.51).setScale(2);
        this._label.attachTo(this);
    }

    this._label.setText(str);
}

addDrawings(list){
    if (!list || list.length<1) return;

    this._drawings = list;
}

switchOff(){
    if (this.spotL)   this.spotL.visible   = false;
    if (this.spotRay) this.spotRay.visible = false;
    this.maquette.visible = false;
}

switchOn(){
    if (this.spotL)   this.spotL.visible   = true;
    if (this.spotRay) this.spotRay.visible = true;
    this.maquette.visible = true;
}

clear(){
    if (this.trigger) delete this.trigger;
    if (this._suiDraw){
        this._suiDraw.removeChildren();
        delete this._suiDraw;
    }

    if (this.trigger) delete this.trigger;
    if (this.maquette) delete this.maquette;
}

realize(){
    // Base
    let base = ATON.createSceneNode();
    base.add( new THREE.Mesh(ATON.Utils.geomUnitCube, APP.MATS.introStand) );
    base.setPosition(0,0.5,0);
    base.attachTo( this );
    base.disablePicking();

    let G = APP.createPlane(2.8,2.8, APP.MATS.cshadow);
    G.raycast = ATON.Utils.VOID_CAST;
    G.renderOrder = 10;

    G.setPosition(0,-0.49,0);
    G.attachTo(base);
    G.disablePicking();

    // Light
    this.spotL = new THREE.SpotLight( 0xffffff );
    this.spotL.position.set( 0, this._spotH, 0 );
    this.spotL.target = base;
    this.spotL.intensity = 30;
    this.spotL.penumbra = 0.3;
    this.spotL.angle = Math.PI/5;

    this.add(this.spotL);

    // Godrays
    let gr = new THREE.PlaneGeometry( 3,3 );
    this.spotRay = new THREE.Mesh(gr, APP.MATS.introSpotRay);
    this.spotRay.position.y = 2.0;
    this.spotRay.raycast = ATON.Utils.VOID_CAST;
    this.spotRay.renderOrder = 100;

    let T = new THREE.Vector3();
    this.spotRay.onAfterRender = ()=>{
        T.copy( ATON.Nav.getCurrentEyeLocation() );
        T.y = 2.0;
        this.spotRay.lookAt( T );
    };

    this.add(this.spotRay);

    // Halo
    this.haloEnter = new THREE.Sprite( APP.MATS.haloSprite );
    this.haloEnter.renderOrder = 10;
    this.haloEnter.raycast = ATON.Utils.VOID_CAST;
    this.haloEnter.position.y = 1.2;
    this.haloEnter.scale.setScalar(1.5);
    this.haloEnter.visible = false;

    this.add(this.haloEnter);


    // Maquette
    this.maquette = ATON.createSceneNode();
    this.maquette.attachTo( this );

    this.maquette.load(APP.pathResAssets+"maquettes/"+this._spaceid+".glb", ()=>{
        this.maquette.autoFit(new THREE.Vector3(0,0,0), 0.6);
        this.maquette.setPosition(0,1.0,0);
        this.maquette.setMaterial( APP.MATS.maquette );
        
        //this.maquette.renderOrder = 10;

        //this.haloEnter.position.y = this.maquette ...

        this._mqScale = this.maquette.scale.y;
        //this.maquette.scale.y = this._mqScale * 0.01;

        this.drawing = this.maquette.clone();
        this.drawing.setPosition(0,1,0); // -0.5
        this.drawing.scale.y = this._mqScale * 0.01;
        this.drawing.setMaterial(APP.MATS.maquetteproj);

        //this.drawing.renderOrder = 100;

        this.drawing.attachTo(this);

        this.drawing.disablePicking();
        this.maquette.disablePicking();
    });

    // Trigger
    let trsize = 0.8;
    this.trigger = ATON.createUINode("trigger-"+this._spaceid);
    this.trigger.add( new THREE.Mesh(ATON.Utils.geomUnitCube, ATON.MatHub.materials.fullyTransparent) );
    this.trigger.setPosition(this.position.x, 1.5*trsize, this.position.z);
    this.trigger.setScale(trsize);
    //this.trigger.setRotation(this.rotation);
    this.trigger.enablePicking();

    this.trigger.onHover = ()=>{
        if (!this._bProxUser) return;

        this.haloEnter.visible = true;

        ATON.AudioHub.playOnceGlobally(APP.pathResAudio+"blop.mp3");
        
        //if (this._mqScale && this.maquette) this.maquette.setScale(this._mqScale*1.1);
        //this.maquette.setMaterial(APP.MATS.introStand);
        //console.log(this._spaceid);
    };
    this.trigger.onLeave = ()=>{
        if (!this._bProxUser) return;

        this.haloEnter.visible = false;
        
        //if (this._mqScale && this.maquette) this.maquette.setScale(this._mqScale);
        //this.maquette.setMaterial(APP.MATS.maquette);
        //console.log(this._spaceid);
    };
    this.trigger.onSelect = ()=>{
        if (!this._bProxUser) return;

        //APP.loadSpace(this._spaceid, "intro");
        window.location.href = APP.basePath + "?s="+this._spaceid+"&p=intro";
    };

    this.trigger.attachToRoot();


    // SUI drawings panel
    if (!this._drawings) return;

    const numDrawings = this._drawings.length;

    this._suiDraw = ATON.createUINode(this._spaceid+"-drawings");
    this._suiDraw.setPosition( this.position )
    this._suiDraw.setScale(2);

    //this._suiDraw.setRotation( this.rotation );
    this._suiDraw.orientToLocation(0,0,0);
    this._suiDraw.attachToRoot();

    const hn = numDrawings*0.5;

    for (let d=0; d<numDrawings; d++){

        const dpath = APP.PATH_DRAWINGS + this._spaceid + "/" + this._drawings[d];
        console.log(dpath);

        let dM = APP.createDrawingMesh(dpath);
        let D = ATON.createUINode(this._spaceid+"-drawing"+d);
        D.add(dM);

        D.setPosition(((d + 0.5) - hn)*1.1, 1.5, -1.2);
        //D.orientToLocation(0,1.2,0);

        D.attachTo(this._suiDraw);
    }


}

update(){
    let E = ATON.Nav.getCurrentEyeLocation();

    let sd = E.distanceToSquared(this.position);
    if (sd > this._dsProximity){
        if (this._bProxUser){
            ATON.fire("TotemLeaveProximity", this._spaceid);
            this._tEnterProx = undefined;
        }

        this._bProxUser = false;

        //if (this.maquette.scale.y > 0.001) this.maquette.scale.y *= 0.9;

        if (this._suiDraw){
            this._suiDraw.setScale(0.001);
            this._suiDraw.visible = false;
            this.spotRay.visible = true;
        }
/*
        if (this._suiDraw){
            let s = this._suiDraw.scale.x;
            if (s > 0.0){
                s *= 0.95;
                this._suiDraw.setScale(s);
            }
        }
*/
        return;
    }

    if (!this._bProxUser){
        ATON.fire("TotemEnterProximity", this._spaceid);
        this._tEnterProx = ATON.getElapsedTime();
    }

    this._bProxUser = true;

    let t = (ATON.getElapsedTime() - this._tEnterProx)/0.9;

    if (this._suiDraw){
        this._suiDraw.visible = true;
        this.spotRay.visible  = false;
        
        if (t <= 1.0) this._suiDraw.setScale((t*2.0) + 0.001);
        
        //this._suiDraw.orientToCamera();
    }

    //if (this.maquette.scale.y < this._mqScale) this.maquette.scale.y *= 1.1;

    if (sd > this._dsActivation) return;

    // enter space
}

}

export default Totem;