let UI = {};

UI.init = ()=>{
    UI.setup();
};

UI.setup = ()=>{
    ATON.UI.get("toolbar").append(
        ATON.UI.createButtonFullscreen(),
        ATON.UI.createButtonQR(),
        ATON.UI.createButtonVR(),
        ATON.UI.createButtonDeviceOrientation()
    );

    ATON.UI.get("user").append(
        ATON.UI.createButtonUser({
            titlelogin: "MetaMic Login"
        })
    );

    ATON.UI.get("toolbar-bottom").append(
        ATON.UI.createButtonHome()
    );
};

UI.modalWelcome = ()=>{

};

UI.createIntroButton = ()=>{
    return ATON.UI.createButton({
        icon: APP.pathResIcons+"logo.png",
        onpress: ()=>{
            window.location.href = APP.basePath + "?s=intro";
        }
    })
};

UI.createContextButton = (N)=>{
    let elP = ATON.UI.createButton({
        text: "Context",
        icon: APP.pathResIcons+"context.png", //"bi-building-fill",
        classes: "aton-btn-highlight",
        onpress: ()=>{
            //let P = ATON.getSceneNode("present");
            //P.toggle();
            N.toggle();

            if (N.visible) elP.classList.add("aton-btn-highlight");
            else elP.classList.remove("aton-btn-highlight");
        }
    });

    return elP;
};

UI.createDropdownHypotheses = (hlist)=>{
    let elHySelect = ATON.UI.createSelect({
        items: hlist,
        value: 0,
        title: "Hypotheses",
        onselect: (v)=>{
            APP.setCurrSpaceHypothesis(v);
        }
    });

    let elHyG = ATON.UI.createContainer({
        style:"max-width:400px; display:inline-block"
    });

    elHyG.append(elHySelect);

    return elHyG;
};

export default UI;