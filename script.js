
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js";

import { gsap } from "https://cdn.jsdelivr.net/npm/gsap@3.14.2/index.js";

// ======================================
// 1. SCENE, CAMERA AND RENDERER
// ======================================

const container = document.getElementById("room-container");

if (!container) {
    throw new Error("room-container not found in index.html");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color("#dce7e7");

const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.set(10, 9, 12);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

container.appendChild(renderer.domElement);

// ======================================
// 2. CAMERA CONTROLS
// ======================================

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 7;
controls.maxDistance = 22;

// ======================================
// 3. LIGHTING
// ======================================

scene.add(
    new THREE.AmbientLight(0xffffff, 1.8)
);

const sunlight = new THREE.DirectionalLight(
    0xffe3bd,
    3.5
);

sunlight.position.set(-5, 10, 7);
sunlight.castShadow = true;

sunlight.shadow.mapSize.set(2048, 2048);

sunlight.shadow.camera.left = -10;
sunlight.shadow.camera.right = 10;
sunlight.shadow.camera.top = 10;
sunlight.shadow.camera.bottom = -10;

scene.add(sunlight);

const fillLight = new THREE.DirectionalLight(
    0xd6edff,
    1.2
);

fillLight.position.set(5, 5, -5);
scene.add(fillLight);

// ======================================
// 4. MATERIALS
// ======================================

const materials = {
    floor: new THREE.MeshStandardMaterial({
        color: "#eee4d4",
        roughness: 0.85
    }),

    blue: new THREE.MeshStandardMaterial({
        color: "#a9c7c9",
        roughness: 0.65
    }),

    wood: new THREE.MeshStandardMaterial({
        color: "#bd9068",
        roughness: 0.75
    }),

    wall: new THREE.MeshStandardMaterial({
        color: "#cbb5a5",
        roughness: 0.9
    }),

    white: new THREE.MeshStandardMaterial({
        color: "#f4f0e7"
    }),

    dark: new THREE.MeshStandardMaterial({
        color: "#343b3c",
        roughness: 0.4
    }),

    glass: new THREE.MeshStandardMaterial({
        color: "#b9dce4",
        roughness: 0.2,
        metalness: 0.1
    }),

    green: new THREE.MeshStandardMaterial({
        color: "#647c43"
    }),

    metal: new THREE.MeshStandardMaterial({
        color: "#a8aaa7",
        metalness: 0.8,
        roughness: 0.25
    })
};

// ======================================
// 5. GROUP AND OBJECT HELPERS
// ======================================

const roomParts = [];

function makeGroup(name, startY = 0) {
    const group = new THREE.Group();

    group.name = name;
    group.position.y = startY;

    group.userData.startY = startY;

    scene.add(group);
    roomParts.push(group);

    return group;
}

function addBox(
    parent,
    width,
    height,
    depth,
    material,
    x,
    y,
    z
) {
    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(
        geometry,
        material
    );

    mesh.position.set(x, y, z);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;
}

function addCylinder(
    parent,
    radius,
    height,
    material,
    x,
    y,
    z
) {
    const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
            radius,
            radius,
            height,
            24
        ),
        material
    );

    mesh.position.set(x, y, z);
    mesh.castShadow = true;

    parent.add(mesh);

    return mesh;
}

// ======================================
// 6. FLOOR AND PLATFORM
// ======================================

const floorGroup = makeGroup("Floor", -4);

addBox(
    floorGroup,
    7.2,
    0.22,
    7.2,
    materials.floor,
    0,
    0,
    0
);

// Floor tiles

const tileMaterial = new THREE.MeshStandardMaterial({
    color: "#d8c9b4",
    roughness: 0.9
});

for (let x = -3; x <= 3; x++) {
    for (let z = -3; z <= 3; z++) {

        addBox(
            floorGroup,
            0.96,
            0.018,
            0.96,
            tileMaterial,
            x,
            0.125,
            z
        );
    }
}

// ======================================
// 7. ROOM WALLS
// ======================================

const wallGroup = makeGroup("Room Walls", 5);

// Back wall

addBox(
    wallGroup,
    7,
    4.7,
    0.18,
    materials.wall,
    0,
    2.45,
    -3.5
);

// Left wall

addBox(
    wallGroup,
    0.18,
    4.7,
    7,
    materials.wall,
    -3.5,
    2.45,
    0
);

// ======================================
// 8. ARCH WINDOWS
// ======================================

function createArchWindow(
    parent,
    x,
    y,
    z,
    width,
    height,
    rotation = 0
) {
    const windowGroup = new THREE.Group();

    windowGroup.position.set(x, y, z);
    windowGroup.rotation.y = rotation;

    parent.add(windowGroup);

    const radius = width / 2;
    const straight = height - radius;

    const shape = new THREE.Shape();

    shape.moveTo(-radius, 0);
    shape.lineTo(radius, 0);
    shape.lineTo(radius, straight);

    shape.absarc(
        0,
        straight,
        radius,
        0,
        Math.PI,
        false
    );

    shape.closePath();

    const glassMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        materials.glass
    );

    glassMesh.castShadow = false;
    windowGroup.add(glassMesh);

    const frameMaterial = new THREE.MeshStandardMaterial({
        color: "#71888b"
    });

    // Side frames

    addBox(
        windowGroup,
        0.09,
        height,
        0.09,
        frameMaterial,
        -radius,
        height / 2,
        0
    );

    addBox(
        windowGroup,
        0.09,
        height,
        0.09,
        frameMaterial,
        radius,
        height / 2,
        0
    );

    // Vertical middle bar

    addBox(
        windowGroup,
        0.045,
        height - 0.3,
        0.05,
        materials.white,
        0,
        (height - 0.3) / 2,
        0.015
    );

    // Horizontal bars

    for (let i = 1; i <= 3; i++) {

        addBox(
            windowGroup,
            width - 0.12,
            0.035,
            0.05,
            materials.white,
            0,
            i * 0.65,
            0.02
        );
    }

    // Arch frame

    const points = [];

    for (let i = 0; i <= 32; i++) {

        const angle = Math.PI * i / 32;

        points.push(
            new THREE.Vector3(
                Math.cos(angle) * radius,
                straight + Math.sin(angle) * radius,
                0.04
            )
        );
    }

    const archCurve = new THREE.CatmullRomCurve3(points);

    const arch = new THREE.Mesh(
        new THREE.TubeGeometry(
            archCurve,
            32,
            0.045,
            8,
            false
        ),
        frameMaterial
    );

    windowGroup.add(arch);

    return windowGroup;
}

const windowGroup = makeGroup("Arch Windows", 5);

// Back window

createArchWindow(
    windowGroup,
    -1.45,
    1.2,
    -3.37,
    1.75,
    3.2
);

// Left window

createArchWindow(
    windowGroup,
    -3.37,
    1.2,
    1.25,
    1.75,
    3.2,
    Math.PI / 2
);

// ======================================
// 9. KITCHEN CABINETS
// ======================================


 // ======================================
 // 23. LOWER KITCHEN CABINETS
 // ======================================

const lowerCabinetGroup = makeGroup(
    "Lower Kitchen Cabinets",
    3
);

// Back lower cabinet body

addBox(
    lowerCabinetGroup,
    5.4,
    1.4,
    0.82,
    materials.blue,
    0,
    0.78,
    -2.85
);

// Back cabinet doors

for (let i = 0; i < 5; i++) {

    const x = -2.15 + i * 1.07;

    // Door panel

    addBox(
        lowerCabinetGroup,
        0.99,
        1.2,
        0.035,
        materials.white,
        x,
        0.78,
        -2.42
    );

    // Door handle

    addBox(
        lowerCabinetGroup,
        0.035,
        0.22,
        0.055,
        materials.metal,
        x + 0.36,
        0.78,
        -2.37
    );
}

// Left lower cabinet body

addBox(
    lowerCabinetGroup,
    0.82,
    1.4,
    5.4,
    materials.blue,
    -2.85,
    0.78,
    0
);

// Left cabinet doors

for (let i = 0; i < 5; i++) {

    const z = -2.15 + i * 1.07;

    addBox(
        lowerCabinetGroup,
        0.035,
        1.2,
        0.99,
        materials.white,
        -2.42,
        0.78,
        z
    );
}

// ======================================
// 10. WOODEN COUNTERTOP
// ======================================

const counterGroup = makeGroup("Wooden Countertops", 3);

addBox(
    counterGroup,
    5.75,
    0.16,
    1,
    materials.wood,
    0,
    1.62,
    -2.85
);

addBox(
    counterGroup,
    1,
    0.16,
    5.75,
    materials.wood,
    -2.85,
    1.62,
    0
);

// ======================================
// 11. KITCHEN SINK AND TAP
// ======================================

const sinkGroup = makeGroup("Kitchen Sink", 4);

addBox(
    sinkGroup,
    1.25,
    0.09,
    0.8,
    materials.metal,
    -1.2,
    1.73,
    -2.85
);

addBox(
    sinkGroup,
    0.9,
    0.045,
    0.55,
    materials.dark,
    -1.2,
    1.79,
    -2.85
);

// Tap

addCylinder(
    sinkGroup,
    0.045,
    0.55,
    materials.metal,
    -1.2,
    2.02,
    -2.55
);

// Tap outlet

addCylinder(
    sinkGroup,
    0.035,
    0.4,
    materials.metal,
    -1.2,
    2.27,
    -2.72
);

// ======================================
// 12. GAS STOVE
// ======================================

const stoveGroup = makeGroup("Gas Stove", 4);

addBox(
    stoveGroup,
    1.5,
    0.08,
    1.1,
    materials.dark,
    0.9,
    1.75,
    -2.85
);

for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {

        const burner = new THREE.Mesh(
            new THREE.TorusGeometry(
                0.22,
                0.035,
                8,
                32
            ),
            materials.metal
        );

        burner.rotation.x = Math.PI / 2;

        burner.position.set(
            0.45 + i * 0.65,
            1.82,
            -3.12 + j * 0.5
        );

        stoveGroup.add(burner);
    }
}

// ======================================
// 13. REFRIGERATOR
// ======================================

const fridgeGroup = makeGroup("Refrigerator", 5);

addBox(
    fridgeGroup,
    1.15,
    2.65,
    1.1,
    materials.blue,
    2.65,
    1.45,
    -2.7
);

// Fridge door

addBox(
    fridgeGroup,
    1.08,
    2.55,
    0.06,
    materials.white,
    2.65,
    1.45,
    -2.12
);

// Handle

addBox(
    fridgeGroup,
    0.045,
    0.75,
    0.07,
    materials.metal,
    2.22,
    1.5,
    -2.06
);

// ======================================
// 14. WALL SHELVES
// ======================================

const shelfGroup = makeGroup("Kitchen Shelves", 4);

for (let i = 0; i < 3; i++) {

    addBox(
        shelfGroup,
        1.1,
        0.1,
        0.55,
        materials.wood,
        2,
        2.2 + i * 0.65,
        -3.05
    );
}

// ======================================
// 15. DINING TABLE
// ======================================

const tableGroup = makeGroup("Dining Table", 3);

addBox(
    tableGroup,
    1.9,
    0.15,
    1.5,
    materials.wood,
    0.4,
    1.25,
    0.35
);

// Table legs

for (const x of [-0.35, 1.15]) {
    for (const z of [-0.2, 0.9]) {

        addBox(
            tableGroup,
            0.09,
            1.2,
            0.09,
            materials.dark,
            x,
            0.62,
            z
        );
    }
}

// ======================================
// 16. DINING CHAIRS
// ======================================

const chairGroup = makeGroup("Dining Chairs", 3);

function createChair(x, z) {

    addBox(
        chairGroup,
        0.65,
        0.12,
        0.65,
        materials.wood,
        x,
        0.8,
        z
    );

    addBox(
        chairGroup,
        0.65,
        0.85,
        0.12,
        materials.wood,
        x,
        1.25,
        z + 0.27
    );

    for (const dx of [-0.23, 0.23]) {
        for (const dz of [-0.23, 0.23]) {

            addBox(
                chairGroup,
                0.07,
                0.8,
                0.07,
                materials.dark,
                x + dx,
                0.4,
                z + dz
            );
        }
    }
}

createChair(-0.45, 1.65);
createChair(1.2, 1.65);

// ======================================
// 17. PLANTS AND DECORATION
// ======================================
// ======================================
 // 25. REALISTIC KITCHEN PENDANT LIGHTING
 // ======================================

const pendantGroup = makeGroup(
    "Pendant Lighting",
    0
);

// Warm light material

const lightMaterial = new THREE.MeshStandardMaterial({
    color: "#fff1c2",
    emissive: "#ffcc66",
    emissiveIntensity: 1.5,
    roughness: 0.3
});

// Metal shade material

const shadeMaterial = new THREE.MeshStandardMaterial({
    color: "#b9c6c4",
    metalness: 0.6,
    roughness: 0.35
});

// Create Pendant Light

function createPendantLight(x, z) {

    // Hanging wire

    addCylinder(
        pendantGroup,
        0.025,
        1.25,
        materials.dark,
        x,
        6.45,
        z
    );

    // Light shade

    const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.12,
            0.38,
            0.35,
            32
        ),
        shadeMaterial
    );

    shade.position.set(x, 5.78, z);
    shade.castShadow = true;

    pendantGroup.add(shade);

    // Glowing bulb

    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 20, 20),
        lightMaterial
    );

    bulb.position.set(x, 5.52, z);

    pendantGroup.add(bulb);

    // Warm Point Light

    const pointLight = new THREE.PointLight(
        0xffd28a,
        18,
        5
    );

    pointLight.position.set(x, 5.5, z);

    pendantGroup.add(pointLight);
}

// Three Pendant Lights

createPendantLight(-0.5, 0.35);

createPendantLight(0.4, 0.35);

createPendantLight(1.3, 0.35);


// --------------------------------------
// DECORATIVE CEILING SPOTLIGHTS
// --------------------------------------

for (let i = 0; i < 3; i++) {

    const spot = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.16,
            0.16,
            0.08,
            24
        ),
        materials.white
    );

    spot.position.set(
        -1.5 + i * 1.5,
        7.2,
        -0.5
    );

    pendantGroup.add(spot);

    const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        lightMaterial
    );

    bulb.position.set(
        -1.5 + i * 1.5,
        7.12,
        -0.5
    );

    pendantGroup.add(bulb);
}
// ======================================
// 18. ANIMATION SYSTEM - GSAP
// ======================================

let assemblyTimeline;

function resetRoom() {

    if (assemblyTimeline) {
        assemblyTimeline.kill();
    }

    roomParts.forEach((part) => {

        gsap.killTweensOf(part.position);

        part.position.y = part.userData.startY;
    });
}

function playAnimation() {

    resetRoom();

    assemblyTimeline = gsap.timeline({
        defaults: {
            duration: 1.2,
            ease: "power3.out"
        }
    });

    roomParts.forEach((part, index) => {

        assemblyTimeline.to(
            part.position,
            {
                y: 0,
                duration: 1.2,
                ease: "back.out(1.2)"
            },
            index * 0.17
        );
    });
}

// ======================================
// 19. BUTTON CONTROLS
// ======================================

const playButton = document.getElementById("playAnimation");
const resetButton = document.getElementById("resetRoom");

if (playButton) {
    playButton.addEventListener("click", playAnimation);
}

if (resetButton) {
    resetButton.addEventListener("click", resetRoom);
}

// ======================================
// 20. RESIZE HANDLER
// ======================================

window.addEventListener("resize", () => {

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );
});

// ======================================
// 21. RENDER LOOP
// ======================================

function animate() {

    requestAnimationFrame(animate);

    controls.update();

    renderer.render(scene, camera);
}

animate();

// ======================================
// 22. START ANIMATION
// ======================================

playAnimation();

console.log("3D Room Portfolio Loaded Successfully!");
