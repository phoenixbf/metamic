let MATS = {};

MATS.init = ()=>{
    MATS.introStand = new THREE.MeshStandardMaterial();
    MATS.introStand.color = new THREE.Color(0.1,0.1,0.1);

    MATS.introGround = new THREE.MeshStandardMaterial();
    ATON.Utils.loadTexture(APP.pathResAssets + "introground.jpg", (tex)=>{
        MATS.introGround.map = tex;
        MATS.introGround.needsUpdate = true;
    });

    MATS.cshadow = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.white,
        //transparent: true,
        depthWrite: false,
        //opacity: 0.2,
		blending: THREE.MultiplyBlending
    });

    MATS.introSpotRay = new THREE.MeshBasicMaterial({
        //color: ATON.MatHub.colors.black,
        //transparent: true,
        depthWrite: false,
        depthTest: false,
        //opacity: 0.2,
		blending: THREE.AdditiveBlending
    });
/*
    MATS.intromaquette = ATON.MatHub.materials.controllerRay.clone();
    MATS.intromaquette.blending =THREE.AdditiveBlending;
    MATS.intromaquette.uniforms.opacity.value = 0.0;
*/
    MATS.intromaquette = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.white,
        transparent: true,
        depthWrite: false,
        opacity: 0.3,
		//blending: THREE.MultiplyBlending
    });

};

export default MATS;