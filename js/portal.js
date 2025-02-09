class Portal extends ATON.Node {

constructor(portid){
    super("P-"+portid, ATON.NTYPES.UI);

    this._portid = portid;
    this._label = undefined;

    this._dstSpace  = undefined;
    this._dstPortal = undefined;

    this._labh = 1.2;

    this.setupMaterial();
}

setupMaterial(){
    this._matPortal = new THREE.ShaderMaterial({
        uniforms: {
            time: { type:'float', value: 0.0 },
            tint: { type:'vec3', value: ATON.MatHub.colors.white },
            vDir: { type:'vec3', value: new THREE.Vector3(1,0,0) },
            tView: { type:'t' }
        },

        vertexShader:`
            varying vec3 vPositionW;
            varying vec4 vPos;

            varying vec3 vNormalW;
            varying vec3 vNormalV;

            varying vec2 sUV;

            uniform float time;

            void main(){
                vec3 pos = position; 
                
                float hx = cos((pos.x*3.0) + time);
                float hz = cos((pos.z*3.0) + time);
                float h = max(hx,hz);

                pos.y += (h*0.03);

                vPositionW = ( modelMatrix * vec4( pos, 1.0 )).xyz;
                vPos = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );

                vNormalV  = normalize( vec3( normalMatrix * normal ));
                vNormalW  = normalize( (modelMatrix * vec4(normal, 0.0)).xyz );

                gl_Position = vPos;
                sUV = uv;
            }
        `,
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            varying vec4 vPos;
            varying vec2 sUV;

            uniform vec3 tint;
            uniform sampler2D tView;
            uniform vec3 vDir;

		    void main(){
		        vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

                float f;
                f = dot(vNormalV, vec3(0,0,1));
		        //f = clamp(1.0-f, 0.0, 1.0);
                //f *= f;
                f += 1.0;

                f = clamp(f, 0.0, 1.0);

                vec2 uv = sUV;
/*
                //uv.x = atan(vDir.x / vDir.z) - atan(viewDirectionW.x / viewDirectionW.z);
                uv.x = (vDir.x - viewDirectionW.x);
                uv.y = (vDir.y - viewDirectionW.y);

                //uv.x *= 2.0;
                //uv.y *= 2.0;

                uv.x += 0.5;
                uv.y += 0.5;

                vec4 frag = texture2D(tView, uv);
*/

/*
                vec2 uv = vPos.xy / vPos.w;
                uv.x += 0.5;
                uv.y += 0.5;

                vec4 frag = texture2D(tView, uv);
*/
                uv.x = 1.0-uv.x;

                uv.x -= 0.5;
                uv.y -= 0.5;

                uv.x *= 2.5; // / vPos.w;
                uv.y *= 2.5; // / vPos.w;

                uv.x += 0.5;
                uv.y += 0.5;


                //uv = vec2(0.5,0.5);

                //uv.x += (vNormalV.x / vPos.w);
                //uv.y += (vNormalV.y / vPos.w);
                
                //uv.x += (vDir.x + viewDirectionW.x) * 2.0;
                //uv.y += (vDir.y - viewDirectionW.y) * 2.0;


                uv.x = clamp(uv.x, 0.0,1.0);
                uv.y = clamp(uv.y, 0.0,1.0);

                //uv.x += (vDir.x - viewDirectionW.x) * 0.5;
                //uv.y += (vDir.y - viewDirectionW.y) * 0.5;

                vec4 frag = texture2D(tView, uv);


                frag = mix(frag,vec4(tint,1), f);

                float dd = dot(viewDirectionW, -vDir);
                frag.a = mix(dd,1.0, f+0.2);

                gl_FragColor = frag;
		    }
        `,

        //color: ATON.MatHub.colors.white,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        //opacity: 0.2
    });
}

setDestinationSpace(spaceid){
    this._dstSpace = spaceid;
}

setDestinationPortal(portalid){
    this._dstPortal = portalid;
}

setEnterDirection(d){
    this._edir = d;

    this._matPortal.uniforms.vDir.value = d;

    console.log(this.position);

    let o = new THREE.Vector3();
    o.copy(this.position);
    o.x -= d.x;
    o.y -= d.y;
    o.z -= d.z;

    //o.y += this._labh;

    this.lookAt(o);
}

setView(url){

    ATON.Utils.textureLoader.load(url, t => {
        //t.flipY = false;

        t.wrapS = THREE.ClampToEdgeWrapping; //THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping; //THREE.RepeatWrapping;

        //t.wrapS = THREE.RepeatWrapping;
        //t.wrapT = THREE.RepeatWrapping;

        t.magFilter = THREE.LinearFilter;
        t.minFilter = THREE.LinearFilter;

        t.colorSpace = ATON._stdEncoding;

        this._matPortal.uniforms.tView.value = t;
        this._matPortal.needsUpdate = true;
        console.log(url)
    });
}

setTitle(title){
    this._label.setText(title);
}

realize(){
    let mp = new THREE.Mesh( ATON.Utils.geomUnitSphere, this._matPortal);

    this.add( mp );

    mp.scale.set(0.3,1,0.5);
    mp.rotation.set(0,Math.PI*0.5,0);

    this.enablePicking();
/*
    let H = APP.createPlane(2,2, APP.MATS.halo, ATON.NTYPES.UI );
    H.position.y = -0.99;
    H.attachTo(this);
*/
    let self = this;

    this._label = new ATON.SUI.Label("L"+this._portid, 0.3, 0.05);
    this._label.setText(this._portid);
    this._label.position.y = this._labh;
    this._label.setScale(7.0);

    this._label.attachTo(this);

/*
    let P = ATON.createUINode().load(APP.pathResAssets+"portals/portal.gltf");
    P.rotation.set(Math.PI*0.5,0,0);
    P.setScale(11.0);
    P.setPosition(-0.7,-1.0,0);
    
    P.attachTo(this);
*/

    this.onHover = ()=>{
        //this.setScale(1.2);
    };

    this.onLeave = ()=>{
        //this.setScale(1.0);
        //console.log("Leave");
    };

    this.onSelect = ()=>{
        let a = this._edir.dot(ATON.Nav.getCurrentDirection());

        if (a > 0.7) self.enter();
    };
};

update(){
    const t = ATON.getElapsedTime();
    if (this._matPortal) this._matPortal.uniforms.time.value = t;
}

enter(){
    let dst = APP.confdata.spaces[this._dstSpace];
    if (!dst) return this;

    ATON.fireEvent("APP_PortalEnterRequest", 
        {
            space: this._dstSpace,
            portal: this._dstPortal
        });
}

}

export default Portal;