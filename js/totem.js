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

realize(){
    // Base
    let base = ATON.createSceneNode();
    base.add( new THREE.Mesh(ATON.Utils.geomUnitCube, APP.MATS.introStand) );
    base.setPosition(0,0.5,0);
    base.attachTo( this );
    base.disablePicking();

    let G = APP.createPlane(2.8,2.8, APP.MATS.cshadow);
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

    let T = new THREE.Vector3();
    this.spotRay.onAfterRender = ()=>{
        T.copy( ATON.Nav.getCurrentEyeLocation() );
        T.y = 2.0;
        this.spotRay.lookAt( T );
    };

    this.add(this.spotRay);


    // Maquette
    this.maquette = ATON.createSceneNode();
    this.maquette.load(APP.pathResAssets+"maquettes/"+this._spaceid+".glb", ()=>{
        this.maquette.autoFit(new THREE.Vector3(0,0,0), 0.6);
        this.maquette.setPosition(0,1.05,0);
        this.maquette.setMaterial( APP.MATS.maquette );
        this.maquette.disablePicking();
        //this.maquette.renderOrder = 10;

        this._mqScale = this.maquette.scale.y;
        //this.maquette.scale.y = this._mqScale * 0.01;

        this.drawing = this.maquette.clone();
        this.drawing.setPosition(0,1,0); // -0.5
        this.drawing.scale.y = this._mqScale * 0.01;
        this.drawing.setMaterial(APP.MATS.maquetteproj);
        this.drawing.disablePicking();
        //this.drawing.renderOrder = 100;

        this.drawing.attachTo(this);
    });

    this.maquette.attachTo( this );


    // SUI drawings panel
    if (!this._drawings) return;

    const numDrawings = this._drawings.length;

    this._suiDraw = ATON.createUINode();
    this._suiDraw.setPosition( this.position );
    this._suiDraw.attachToRoot();

    const hn = numDrawings*0.5;

    for (let d=0; d<numDrawings; d++){

        const dpath = APP.PATH_DRAWINGS + this._spaceid + "/" + this._drawings[d];
        console.log(dpath);

        let dM = APP.createDrawingMesh(dpath);
        let D = ATON.createUINode();
        D.add(dM);

        D.setPosition(((d + 0.5) - hn)*1.1, 2.0, -1.2);
        //D.orientToLocation(0,1.5,0);

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
        if (t <= 1.0) this._suiDraw.setScale(t + 0.001);
        //this._suiDraw.orientToCamera();
    }

    //if (this.maquette.scale.y < this._mqScale) this.maquette.scale.y *= 1.1;

    if (sd > this._dsActivation) return;

    // enter space
}

}

export default Totem;