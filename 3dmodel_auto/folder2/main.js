import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== 3D PREVIEW SCENE =====
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe0e0e0);

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.set(500, 500, 500);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;

const boxGroup = new THREE.Group();
scene.add(boxGroup);

// Premium Studio Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(300, 500, 400);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 2000;
dirLight.shadow.camera.left = -500;
dirLight.shadow.camera.right = 500;
dirLight.shadow.camera.top = 500;
dirLight.shadow.camera.bottom = -500;
dirLight.shadow.bias = -0.0005;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xddeeff, 0.5);
fillLight.position.set(-300, 200, -300);
scene.add(fillLight);

// Ground Shadow Plane
const planeGeometry = new THREE.PlaneGeometry(3000, 3000);
const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
const groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -200; 
groundPlane.receiveShadow = true;
scene.add(groundPlane);

const boxMaterial = new THREE.MeshStandardMaterial({
    color: 0xfdfdfd,
    roughness: 0.4,
    metalness: 0.1,
    side: THREE.DoubleSide,
    envMapIntensity: 1.0
});

let boxW, boxD, boxH;
let leftRef, frontRef, rightRef, backRef, glueRef;
let topLidRef, topTuckRef, topDustFRef, topDustBRef;
let botLeftRef, botFrontRef, botRightRef, botBackRef;
let autoTexture = null;

function build3DBox(L, W, H) {
    while (boxGroup.children.length > 0) boxGroup.remove(boxGroup.children[0]);

    if (!autoTexture) {
        autoTexture = new THREE.TextureLoader().load('/auto.svg');
        autoTexture.wrapS = THREE.ClampToEdgeWrapping;
        autoTexture.wrapT = THREE.ClampToEdgeWrapping;
        autoTexture.colorSpace = THREE.SRGBColorSpace;
    }

    const SVG_WIDTH = 387.9;
    const SVG_HEIGHT = 295.25;

    const orig_d = 60.6;
    
    const w = L;
    const d = W;
    const h = H;
    boxW = w;
    boxD = d;
    boxH = h;

    const TUCK_FLAP_H = 14.7 * (W / orig_d);
    const DUST_H = 38.0 * (W / orig_d);
    const botH = 48.35 * (W / orig_d);
    const GLUE_W = 16.0;

    function createUVGeometry(physWidth, physHeight, svgX, svgY, svgW, svgH) {
        const geo = new THREE.PlaneGeometry(physWidth, physHeight);
        const uvs = geo.attributes.uv;

        const u0 = svgX / SVG_WIDTH;
        const u1 = (svgX + svgW) / SVG_WIDTH;
        const v1 = 1.0 - (svgY / SVG_HEIGHT);
        const v0 = 1.0 - ((svgY + svgH) / SVG_HEIGHT);

        uvs.setXY(0, u0, v1);
        uvs.setXY(1, u1, v1);
        uvs.setXY(2, u0, v0);
        uvs.setXY(3, u1, v0);

        return geo;
    }

    function createPanel(physWidth, physHeight, svgX, svgY, svgW, svgH, pivotX, pivotY) {
        const group = new THREE.Group();

        const planeGeo = createUVGeometry(physWidth, physHeight, svgX, svgY, svgW, svgH);
        planeGeo.translate(physWidth / 2 - pivotX, physHeight / 2 - pivotY, 0);

        const texMesh = new THREE.Mesh(planeGeo, boxMaterial);
        if (!boxMaterial.map) {
            boxMaterial.map = autoTexture;
            boxMaterial.transparent = true;
            boxMaterial.alphaTest = 0.5;
            boxMaterial.needsUpdate = true;
        }
        texMesh.castShadow = true;
        texMesh.receiveShadow = true;
        group.add(texMesh);

        return group;
    }

    // Root is Left Panel
    leftRef = createPanel(w, h, 21.0, 80.3, 120.6, 161.5, w / 2, h / 2);

    // Top Lid
    topLidRef = createPanel(w, d, 21.0, 19.7, 120.6, 60.6, w / 2, 0);
    topLidRef.position.set(0, h / 2, 0);
    leftRef.add(topLidRef);

    // Top Tuck Flap
    topTuckRef = createPanel(w, TUCK_FLAP_H, 21.0, 5.0, 120.6, 14.7, w / 2, 0);
    topTuckRef.position.set(0, d, 0);
    topLidRef.add(topTuckRef);

    // Bottom Left Flap
    botLeftRef = createPanel(w, botH, 21.0, 241.8, 120.6, 48.35, w / 2, botH);
    botLeftRef.position.set(0, -h / 2, 0);
    leftRef.add(botLeftRef);

    // Glue Flap
    glueRef = createPanel(GLUE_W, h, 5.0, 80.3, 16.0, 161.5, GLUE_W, h / 2);
    glueRef.position.set(-w / 2, 0, 0);
    leftRef.add(glueRef);

    // Front Panel
    frontRef = createPanel(d, h, 141.6, 80.3, 60.6, 161.5, 0, h / 2);
    frontRef.position.set(w / 2, 0, 0);
    leftRef.add(frontRef);

    // Top Dust Flap (Front)
    topDustFRef = createPanel(d, DUST_H, 141.6, 42.35, 60.6, 38.0, 0, 0);
    topDustFRef.position.set(0, h / 2, 0);
    frontRef.add(topDustFRef);

    // Bottom Front Flap
    botFrontRef = createPanel(d, botH, 141.6, 241.8, 60.6, 48.35, 0, botH);
    botFrontRef.position.set(0, -h / 2, 0);
    frontRef.add(botFrontRef);

    // Right Panel
    rightRef = createPanel(w, h, 202.2, 80.3, 120.6, 161.5, 0, h / 2);
    rightRef.position.set(d, 0, 0);
    frontRef.add(rightRef);

    // Bottom Right Flap
    botRightRef = createPanel(w, botH, 202.2, 241.8, 120.6, 48.35, 0, botH);
    botRightRef.position.set(0, -h / 2, 0);
    rightRef.add(botRightRef);

    // Back Panel
    backRef = createPanel(d, h, 322.8, 80.3, 60.6, 161.5, 0, h / 2);
    backRef.position.set(w, 0, 0);
    rightRef.add(backRef);

    // Top Dust Flap (Back)
    topDustBRef = createPanel(d, DUST_H, 322.8, 42.35, 60.6, 38.0, 0, 0);
    topDustBRef.position.set(0, h / 2, 0);
    backRef.add(topDustBRef);

    // Bottom Back Flap
    botBackRef = createPanel(d, botH, 322.8, 241.8, 60.6, 48.35, 0, botH);
    botBackRef.position.set(0, -h / 2, 0);
    backRef.add(botBackRef);

    boxGroup.add(leftRef);
    updateFold();
}

function updateFold() {
    if (!leftRef) return;
    const slider = document.getElementById('fold-slider');
    if (!slider) return;
    const val = parseFloat(slider.value); // 0 to 1

    let t3 = 0; // 0 = open, 1 = closed (Tuck flap)
    if (val <= 0.1) {
        t3 = 1.0 - (val / 0.1);
    }

    let t2 = 0; // Dust flaps
    if (val <= 0.1) {
        t2 = 1.0;
    } else if (val <= 0.2) {
        t2 = 1.0 - ((val - 0.1) / 0.1);
    }

    let A = Math.PI / 2; // Default square tube
    if (val > 0.2 && val <= 0.4) {
        // Squash into flat tube
        const sq = (val - 0.2) / 0.2;
        A = (Math.PI / 2) + sq * (Math.PI / 2);
    } else if (val > 0.4 && val <= 0.6) {
        // Un-squash back to square tube
        const unsq = (val - 0.4) / 0.2;
        A = Math.PI - unsq * (Math.PI / 2);
    }

    let baseBotAngle = Math.PI / 2; // Default is closed floor
    if (val <= 0.2) {
        baseBotAngle = Math.PI / 2;
    } else if (val > 0.2 && val <= 0.4) {
        // Squashing: flap moves from closed (PI/2) to INSIDE (Math.PI)
        const sq = (val - 0.2) / 0.2;
        baseBotAngle = (Math.PI / 2) + sq * (Math.PI / 2);
    } else if (val > 0.4 && val <= 0.6) {
        // Unsquashing: flaps stay INSIDE
        baseBotAngle = Math.PI;
    } else {
        baseBotAngle = Math.PI; // Remains inside before unfolding
    }

    let botAngleFront = baseBotAngle;
    let botAngleRight = baseBotAngle;
    let botAngleBack = baseBotAngle;
    let botAngleLeft = baseBotAngle;

    if (val > 0.6) {
        // Open Bottom Flaps one by one from INSIDE (Math.PI) to OUTSIDE (0)
        let tF = Math.min(Math.max((val - 0.60) / 0.05, 0), 1);
        botAngleFront = Math.PI * (1 - tF);

        let tR = Math.min(Math.max((val - 0.65) / 0.05, 0), 1);
        botAngleRight = Math.PI * (1 - tR);

        let tB = Math.min(Math.max((val - 0.70) / 0.05, 0), 1);
        botAngleBack = Math.PI * (1 - tB);

        let tL = Math.min(Math.max((val - 0.75) / 0.05, 0), 1);
        botAngleLeft = Math.PI * (1 - tL);
    }

    let t4 = 0; // 0 = 3D shape, 1 = flat dieline
    if (val > 0.80) {
        t4 = (val - 0.80) / 0.20;
    }

    // Apply t4 to unfold into Dieline
    frontRef.rotation.y = A * (1 - t4);
    rightRef.rotation.y = (Math.PI - A) * (1 - t4);
    backRef.rotation.y = A * (1 - t4);
    
    let glueAngle = A - Math.PI;
    if (val <= 0.2) glueAngle -= 0.05;
    glueRef.rotation.y = glueAngle * (1 - t4);
    glueRef.position.x = -boxW / 2 + ((1 - t4) * 0.5);

    // Bottom Auto-lock Flaps
    botFrontRef.rotation.x = botAngleFront;
    let bF = botAngleFront / Math.PI;
    botFrontRef.position.y = -boxH / 2 + bF * 0.5;

    botBackRef.rotation.x = botAngleBack;
    let bB = botAngleBack / Math.PI;
    botBackRef.position.y = -boxH / 2 + bB * 1.0;

    botRightRef.rotation.x = botAngleRight;
    let bR = botAngleRight / Math.PI;
    botRightRef.position.y = -boxH / 2 + bR * 1.5;

    botLeftRef.rotation.x = botAngleLeft;
    let bL = botAngleLeft / Math.PI;
    botLeftRef.position.y = -boxH / 2 + bL * 2.0;

    // Top Dust Flaps
    topDustFRef.rotation.x = t2 * (-Math.PI / 2);
    topDustFRef.position.y = boxH / 2 - t2 * 1.0;

    topDustBRef.rotation.x = t2 * (-Math.PI / 2);
    topDustBRef.position.y = boxH / 2 - t2 * 2.0;

    // Top Lid and Tuck Flap
    if (topLidRef) topLidRef.rotation.x = t3 * -Math.PI / 2;
    if (topTuckRef) {
        topTuckRef.rotation.x = t3 * (-Math.PI / 2 - 0.05);
        topTuckRef.scale.x = 1.0 - (t3 * 0.02);
    }
}

// Initial box sizes
const initialL = 120.6;
const initialW = 60.6;
const initialH = 161.5;
build3DBox(initialL, initialW, initialH);

document.getElementById('fold-slider').addEventListener('input', updateFold);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
