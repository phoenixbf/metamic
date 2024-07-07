class Portal {

constructor(id){  
    this._id = id;
    this._node = undefined;
}

setDestinationSpace(spaceid){
    this._dstSpace = spaceid;
}

setLocation

realize(){
    this._node = ATON.createUINode("P-"+this._id);

    let mp = new THREE.Mesh( ATON.Utils.geomUnitSphere, ATON.MatHub.materials.rayController);

    this._node.add( mp );

    this._node.enablePicking().attachToRoot();

    let self = this;

    this._node.onHover = ()=>{
        console.log("Hover");
    }
    this._node.onSelect = ()=>{
        self.enter();
    }
};

getNode(){
    return this._node;
}

enter(){
    let dst = APP.confdata.spaces[this._dstSpace];
    if (!dst) return this;

    ATON.fireEvent("APP_portalRequest", 
        {
            space: this._dstSpace,
            portal: this._id
        });
}

}

export default Portal;