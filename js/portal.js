class Portal extends ATON.Node {

constructor(portid){
    super("P-"+portid, ATON.NTYPES.UI);

    this._portid = portid;
}

setDestinationSpace(spaceid){
    this._dstSpace = spaceid;
}

setLocation

realize(){

    let mp = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.materials.rayController);

    this.add( mp );

    this.enablePicking();

    let self = this;

    this.onHover = ()=>{
        this.setScale(1.2);
        console.log("Hover");
    };

    this.onLeave = ()=>{
        this.setScale(1.0);
        console.log("Leave");
    };

    this.onSelect = ()=>{
        self.enter();
    };
};

enter(){
    let dst = APP.confdata.spaces[this._dstSpace];
    if (!dst) return this;

    ATON.fireEvent("APP_portalRequest", 
        {
            space: this._dstSpace,
            portal: this._portid
        });
}

}

export default Portal;