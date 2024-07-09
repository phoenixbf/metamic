class Portal extends ATON.Node {

constructor(portid){
    super("P-"+portid, ATON.NTYPES.UI);

    this._portid = portid;
    this._label = undefined;

    this._labh = 1.2;

    this.setupMaterial();
}

setupMaterial(){
    this._matPortal = new THREE.ShaderMaterial({
        uniforms: {
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

            void main(){
                vPositionW = ( modelMatrix * vec4( position, 1.0 )).xyz;
                vPos       = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

                vNormalV   = normalize( vec3( normalMatrix * normal ));
                vNormalW   = (modelMatrix * vec4(normal, 0.0)).xyz;

                gl_Position = vPos;
                sUV = uv;
            }
        `,
        fragmentShader:`
            varying vec3 vPositionW;
		    varying vec3 vNormalW;
            varying vec3 vNormalV;
            varying vec4 vPos;

            uniform vec3 tint;
            uniform sampler2D tView;
            uniform vec3 vDir;

		    void main(){
		        vec3 viewDirectionW = normalize(cameraPosition - vPositionW);

                float f;
                f = dot(vNormalV, vec3(0,0,1));
		        //f = clamp(1.0-f, 0.0, 1.0);
                //f *= f;
                f += 0.8;

                vec2 uv;
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

                uv = vec2(0.5,0.5);
                uv.x += (vNormalV.x / vPos.w);
                uv.y += (vNormalV.y / vPos.w);
                vec4 frag = texture2D(tView, uv);


                frag = mix(frag,vec4(tint,1), f);

                float dd = dot(viewDirectionW, -vDir);
                frag.a = mix(dd,1.0, f+0.5);

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

setEnterDirection(d){
    this._edir = d;

    this._matPortal.uniforms.vDir.value = d;

    console.log(this.position);

    let o = new THREE.Vector3();
    o.copy(this.position);
    o.x -= d.x;
    o.y -= d.y;
    o.z -= d.z;

    o.y += this._labh;

    this._label.lookAt(o);
}

setView(url){

    ATON.Utils.textureLoader.load(url, t => {
        //t.flipY = false;

        t.wrapS = THREE.ClampToEdgeWrapping; //THREE.RepeatWrapping;
        t.wrapT = THREE.ClampToEdgeWrapping; //THREE.RepeatWrapping;

        //t.wrapS = THREE.RepeatWrapping;
        //t.wrapT = THREE.RepeatWrapping;

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

    this.enablePicking();

    let self = this;

    this._label = new ATON.SUI.Label("L"+this._portid, 0.3, 0.05);
    this._label.setText(this._portid);
    this._label.position.y = this._labh;
    this._label.setScale(7.0);

    this._label.attachTo(this);

    this.onHover = ()=>{
        //this.setScale(1.2);
        console.log("Hover");
    };

    this.onLeave = ()=>{
        //this.setScale(1.0);
        console.log("Leave");
    };

    this.onSelect = ()=>{
        self.enter();
    };
};

enter(){
    let dst = APP.confdata.spaces[this._dstSpace];
    if (!dst) return this;

    ATON.fireEvent("APP_PortalEnterRequest", 
        {
            space: this._dstSpace,
            portal: this._portid
        });
}

}

export default Portal;