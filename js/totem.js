class Totem extends ATON.Node {

constructor(spaceid){
    super("T-"+spaceid, ATON.NTYPES.SCENE);

    this._spaceid = spaceid;

    this._spotH = 2.5;

    this._dsProximity  = 8.0;
    this._dsActivation = 3.0;

    this._bProxUser = false;

    this._label = undefined;
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
        this.maquette.autoFit(new THREE.Vector3(0,0,0), 0.5);
        this.maquette.setPosition(0,1,0);
        this.maquette.setMaterial( APP.MATS.intromaquette );
        this.maquette.disablePicking();

        this._mqScale = this.maquette.scale.y;
        //this.maquette.scale.y = this._mqScale * 0.01;
    });

    this.maquette.attachTo( this );
}

update(){
    let E = ATON.Nav.getCurrentEyeLocation();

    let sd = E.distanceToSquared(this.position);
    if (sd > this._dsProximity){
        if (this._bProxUser) ATON.fire("TotemLeaveProximity", this._spaceid);
        this._bProxUser = false;
        return;
    }

    if (!this._bProxUser) ATON.fire("TotemEnterProximity", this._spaceid);
    this._bProxUser = true;

    if (sd > this._dsActivation) return;

    // enter space
}

}

export default Totem;