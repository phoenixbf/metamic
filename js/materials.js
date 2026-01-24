let MATS = {};

MATS.Colors = {};

MATS.init = ()=>{
    MATS.Colors.logo = new THREE.Color("#CA0005");
    MATS.Colors.main = new THREE.Color("#decdaf");
    MATS.Colors.draw = new THREE.Color("#ede7dd");

    MATS.introStand = new THREE.MeshStandardMaterial();
    MATS.introStand.color = new THREE.Color(0.1,0.1,0.1);

    MATS._customvshader = `
        varying vec3 vPositionW;
        varying vec4 vPos;

        varying vec3 vNormalW;
        varying vec3 vNormalV;

        varying vec2 sUV;

        void main(){
            vPositionW = ( modelMatrix * vec4( position, 1.0 )).xyz;
            vPos       = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

            vNormalV   = normalize( vec3( normalMatrix * normal ));
            vNormalW   = (modelMatrix * vec4(normal, 0.0)).xyz;

            gl_Position = vPos;

            sUV = uv;
        }
    `;

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
		blending: THREE.MultiplyBlending,
        premultipliedAlpha: true
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

    MATS.maquetteHover = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0.3,0.3,0.3), //new THREE.Color("#dcc39f"),

        roughness: 0.3,
        metalness: 0,
        transmission: 0.7,
        ior: 1.3,
        thickness: 2.0,

        //transparent: true,
        //depthWrite: false,
        //opacity: 0.6,
		//blending: THREE.MultiplyBlending
        //forceSinglePass: true,
    });

    let texHalo = ATON.Utils.loadTexture( APP.pathResAssets + "halo.jpg" );

    MATS.halo = new THREE.MeshBasicMaterial({
        color: ATON.MatHub.colors.white,
        map: texHalo,
        transparent: true,
        depthWrite: false,
        opacity: 0.5,
		blending: THREE.AdditiveBlending
    });

    MATS.haloSprite = new THREE.SpriteMaterial({
        color: MATS.Colors.main,
        map: texHalo,
        transparent: true,

        depthWrite: false,
        depthTest: false,
        
        opacity: 0.5,
		
        blending: THREE.AdditiveBlending    
    });

    MATS.arch1 = new THREE.ShaderMaterial({
        uniforms: {
            time: { type:'float', value: 0.0 },
            tint: { type:'vec3', value: MATS.Colors.main }
        },

        vertexShader: ATON.MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            uniform vec3 tint;
            uniform float time;

		    void main(){

                float f;
		        //f = dot(vNormalV, viewDirectionW);
                f = dot(vec3(vNormalV.x,vNormalV.y,vNormalV.z), vec3(0,0,1));
		        
                f = clamp(1.0-f, 0.0, 1.0);
                f *= f;

                float s = cos(vPositionW.y * 50.0);
                s *= cos(vPositionW.x * 50.0);
                s *= cos(vPositionW.z * 50.0);

                f = clamp(f, 0.0,1.0);
                //if (f < 0.5) discard;

                vec4 frag = mix(vec4(tint, s),vec4(0,0,0,0.7), f);

                float t = cos((vPositionW.y * 5.0) - (time * 1.1));
                t = (t*1000.0) - 999.0;
                t = clamp(t, 0.0,1.0);

                gl_FragColor = frag;
		    }
        `,
        transparent: true,
        depthWrite: false,
        
        //side: THREE.DoubleSide

        //emissive: ATON.MatHub.colors.white,
        //emissiveIntensity: 5.0
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
            time: { type:'float', value: 0.0 },
            tint: { type:'vec3', value: ATON.MatHub.colors.white },
            opacity: { type:'float', value: 0.5 }
        },

        vertexShader: ATON.MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            uniform vec3 tint;
            uniform float time;
            uniform float opacity;

		    void main(){
                float t = cos((vPositionW.y * 5.0) - (time * 1.1));
                t = (t*1000.0) - 999.0;
                t = clamp(t, 0.0,1.0);

                vec4 frag = vec4(1,1,1, opacity);

                vec3 nw = normalize(vNormalW);

                vec2 range = vec2(1.0, 1.8);
                float h = (vPositionW.y - range.x)/(range.y - range.x);
                h = clamp(h, 0.0,1.0);
                //h = 1.0-h;

                float f = 0.0;
                f = dot(nw, vec3(0,1,0));
                f = clamp(f, 0.0,1.0);

		        frag.a = mix(opacity, 1.0, f);
                frag.a = mix(0.1,frag.a, h);
                //frag.a = mix(frag.a,0.1, h);

                frag.rgb = mix(frag.rgb, vec3(0,0,0), t); // * (1.0-f));

                gl_FragColor = frag;
		    }
        `,
        transparent: true,
        depthWrite: false,
        //side: THREE.DoubleSide

        //emissive: ATON.MatHub.colors.white,
        //emissiveIntensity: 5.0
    });

    MATS.draw = new CustomShaderMaterial({
        baseMaterial: THREE.MeshPhysicalMaterial,

        uniforms: {
            tint: { type:'vec3', value: MATS.Colors.draw },
        },


        vertexShader: MATS._customvshader,

        fragmentShader:`
            varying vec3 vPositionW;
            varying vec4 vPos;

            varying vec3 vNormalW;
            varying vec3 vNormalV;
            varying vec2 sUV;

            uniform vec3 tint; 

            void main(){
                vec2 uvCoords = sUV;

		        ///float a = cos((vPositionW.x + vPositionW.y + vPositionW.z) * 50.0);
                //float a = cos((vPositionW.y) * 50.0);
                //if (a < -0.5) discard;

                csm_DiffuseColor = vec4(tint, 1.0);

                csm_Roughness = 1.0;
                csm_Metalness = 0.0;
            }
        `
    });

/*
    MATS.draw = new THREE.ShaderMaterial({
        uniforms: {
            tint: { type:'vec3', value: MATS.Colors.draw },
        },

        vertexShader: ATON.MatHub.getDefVertexShader(),
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            uniform vec3 tint;
            //uniform vec3 base;
            uniform float opacity;

		    void main(){
		        //vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

                float f;
		        //f = dot(vNormalV, viewDirectionW);
                f = dot(vNormalV, vec3(0,0,1));
		        f = clamp(1.0-f, 0.0, 1.0);
                f *= f;

                f = clamp(f, 0.0,1.0);
                f *= 0.3;

                vec3 col = mix(tint,vec3(0,0,0), f);

		        //float a = cos((vPositionW.x + vPositionW.y + vPositionW.z) * 50.0);
                //if (a < -0.5) discard;

                gl_FragColor = vec4(col, 1.0);
		    }
        `
    });
*/

    MATS.AI = ATON.MatHub.materials.defUI.clone();
    MATS.AI.uniforms.opacity.value = 0.2;

    MATS.ref = new THREE.MeshPhysicalMaterial({
        color: MATS.Colors.main,
/*
        roughness: 0.5,
        transmission: 0.7,
        ior: 1.3,
        thickness: 2.0,
*/
        //transparent: true,
        //depthWrite: false,
        //opacity: 0.2,
		//blending: THREE.MultiplyBlending
        //forceSinglePass: true,
    });

    // Point-clouds override material
    ATON.MatHub.materials.point.size = 4.0;
/*
    ATON.MatHub.materials.point.depthWrite = false;
    ATON.MatHub.materials.point.blending   = THREE.MultiplyBlending;
    ATON.MatHub.materials.point.transparent = true;
    ATON.MatHub.materials.point.opacity   = 0.2;
    ATON.MatHub.materials.point.alphaTest = 0.0;
*/
    

    //ATON.MatHub.materials.point.size = 0.02;
    //ATON.MatHub.materials.point.sizeAttenuation = true;
/*
    ATON.MatHub.materials.point.transparent = true;
    ATON.MatHub.materials.point.alphaTest   = 0.0;
    ATON.MatHub.materials.point.depthWrite  = false;
*/

    ATON.MatHub.materials["maquette"] = MATS.maquette;
    ATON.MatHub.materials["draw"]     = MATS.draw;
    ATON.MatHub.materials["arch1"]    = MATS.arch1;

};

export default MATS;