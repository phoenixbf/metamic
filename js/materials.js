let MATS = {};

MATS.init = ()=>{
    MATS.introStand = new THREE.MeshStandardMaterial();
    MATS.introStand.color = new THREE.Color(0.1,0.1,0.1);

    MATS.introGround = new THREE.MeshStandardMaterial();
    ATON.Utils.loadTexture(APP.pathResAssets + "introground.jpg", (tex)=>{
        MATS.introGround.map = tex;
        MATS.introGround.map.wrapS = THREE.RepeatWrapping;
        MATS.introGround.map.wrapT = THREE.RepeatWrapping;

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


    MATS.maquetteproj = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.black,
        transparent: true,
        depthWrite: false,
        opacity: 0.2,
		//blending: THREE.MultiplyBlending
        forceSinglePass: true,
    });

/*
    MATS.maquetteproj = new THREE.MeshPhysicalMaterial({
        color: ATON.MatHub.colors.black,
        roughness: 0.3,
        metalness: 0,
        transmission: 0.7,
        ior: 1.3,
        thickness: 2.0,

        //transparent: true,
        //depthWrite: false
    });
*/
    MATS.maquette = new THREE.ShaderMaterial({
        uniforms: {
            tint: { type:'vec3', value: ATON.MatHub.colors.white },
            opacity: { type:'float', value: 0.5 }
        },

        vertexShader: ATON.MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            uniform vec3 tint;
            uniform float opacity;

		    void main(){
                vec4 A = vec4(1,1,1, opacity * 3.0);
                vec4 B = vec4(1,1,1, opacity);
                vec4 frag;

                vec3 nw = normalize(vNormalW);

                vec2 range = vec2(1.0, 1.8);
                float h = (vPositionW.y - range.x)/(range.y - range.x);
                h = clamp(h, 0.0,1.0);
                //h = 1.0-h;

                float f = 0.0;
                f = dot(nw, vec3(0,1,0));
                f = clamp(f, 0.0,1.0);

		        frag = mix(B,A, f);
                frag.a = mix(0.1,frag.a, h);

                gl_FragColor = frag;
		    }
        `,
        transparent: true,
        depthWrite: false,
        //side: THREE.DoubleSide
    }); 

};

export default MATS;