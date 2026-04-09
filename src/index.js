import * as THREE from 'three';
import { EffectComposer } from '../jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../jsm/postprocessing/UnrealBloomPass.js';
import Hydra from 'hydra-synth';
import { OnsetDetector } from '../../treslib/src/OnsetDetector.js';
import { GrainEngine } from '../../treslib/src/GrainEngine.js';
import { GrainSequencer } from '../../treslib/src/GrainSequencer.js';
import { setupREPL } from './repl.js';

export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

export let g1 = null;
export let g2 = null;
export let seq = null;

let bloomPass;
let renderer, scene, camera, container;
let originalPosition, points = [], analyser, rectGroup;
let data = [];
let ring, ring2, ring3, curve, curve2, curve3;
let composer;
let cubos = [];
let avgFrequency = 0, avgCount = 0;
let consethydra = 0;
let sentido = 1;
let hydraCount = 0;

const hydra = new Hydra({
    canvas: document.getElementById("myCanvas"),
    detectAudio: false,
});

let vit = new THREE.CanvasTexture(document.getElementById("myCanvas"));
document.getElementById("myCanvas").style.display = 'none';

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

function init() {
    hydraSelect(0);
    document.getElementById('overlay').style.display = "none";
    document.getElementById('credits').style.display = "none";
    document.getElementById('container').style.display = "block";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const ambient = new THREE.HemisphereLight(0xffffff, 1);
    scene.add(ambient);

    const geometry = new THREE.SphereGeometry(15, 128, 128);
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.6,
        map: vit,
        alphaTest: 0.5,
        blending: THREE.AdditiveBlending
    });

    const positionAttribute = geometry.attributes.position;
    originalPosition = Float32Array.from(positionAttribute.array);

    points = new THREE.Points(geometry, material);
    scene.add(points);

    camera.position.z = 100;

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = Math.pow(0.3, 2.0);

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    rectGroup = new THREE.Group();
    createFloatingRectangles(10);
    scene.add(rectGroup);

    const numBamboos = 15;
    const bambooRadius = 100;
    const bambooHeight = 500;
    const bambooWidth = 0.25;
    const bambooMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < numBamboos; i++) {
        const angle = (i / numBamboos) * Math.PI * 2;
        const x = bambooRadius * Math.cos(angle);
        const z = bambooRadius * Math.sin(angle);
        const bambooGeom = new THREE.BoxGeometry(bambooWidth, bambooHeight, bambooWidth);
        const bamboo = new THREE.Mesh(bambooGeom, bambooMaterial);
        bamboo.position.set(x, 0, z);
        bamboo.lookAt(0, 0, 0);
        const tiltAngle = (Math.random() - 0.5) * Math.PI / 0.5;
        bamboo.rotation.x = tiltAngle;
        scene.add(bamboo);
    }

    window.addEventListener('resize', onWindowResize);

    playAudioFile("./audio/three-proc-mono-stereo.ogg");

    const pointsCurve = [
        new THREE.Vector3(-100, 0, -50),
        new THREE.Vector3(0, -50, -10),
        new THREE.Vector3(100, 0, 100),
        new THREE.Vector3(50, 50, -10),
        new THREE.Vector3(-100, -150, -100),
        new THREE.Vector3(100, -50, 100),
        new THREE.Vector3(-150, 50, 0)
    ];

    curve = new THREE.CatmullRomCurve3(pointsCurve, true);
    const geometryTube = new THREE.TubeGeometry(curve, 400, 0.5, 8, false);
    const materialTube = new THREE.MeshBasicMaterial({ color: 0xffffff, map: vit });
    scene.add(new THREE.Mesh(geometryTube, materialTube));

    const complementPoints1 = pointsCurve.map(p => new THREE.Vector3(p.x, -p.y, p.z));
    curve2 = new THREE.CatmullRomCurve3(complementPoints1, true);
    const geometryTube2 = new THREE.TubeGeometry(curve2, 400, 0.5, 8, false);
    const materialTube2 = new THREE.MeshBasicMaterial({ color: 0xffffff, map: vit });
    scene.add(new THREE.Mesh(geometryTube2, materialTube2));

    const complementPoints2 = pointsCurve.map(p => new THREE.Vector3(p.x, p.y, -p.z));
    curve3 = new THREE.CatmullRomCurve3(complementPoints2, true);
    const geometryTube3 = new THREE.TubeGeometry(curve3, 400, 0.5, 8, false);
    const materialTube3 = new THREE.MeshBasicMaterial({ color: 0xffffff, map: vit });
    scene.add(new THREE.Mesh(geometryTube3, materialTube3));

    const cylMat = new THREE.MeshBasicMaterial({ color: 0xffffff, map: vit });
    const cylGeom = new THREE.CylinderGeometry(0, 3.25, 12, 32);
    ring = new THREE.Mesh(cylGeom, cylMat);
    scene.add(ring);

    const cylMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, map: vit });
    const cylGeom2 = new THREE.CylinderGeometry(0, 3.25, 12, 32);
    ring2 = new THREE.Mesh(cylGeom2, cylMat2);
    scene.add(ring2);

    const cylMat3 = new THREE.MeshBasicMaterial({ color: 0xffffff, map: vit });
    const cylGeom3 = new THREE.CylinderGeometry(0, 3.25, 12, 32);
    ring3 = new THREE.Mesh(cylGeom3, cylMat3);
    scene.add(ring3);

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5, 0.6, 0.4
    );
    composer.addPass(bloomPass);

    createCubes();
    setupREPL();
}

function createCubes() {
    const xgrid = 3, ygrid = 4;
    const ux = 1 / xgrid;
    const uy = 1 / ygrid;
    let cubeCount = 0;
    const radius = 300;
    const totalCubes = xgrid * ygrid;
    const phi = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < xgrid; i++) {
        for (let j = 0; j < ygrid; j++) {
            const geometry = new THREE.PlaneGeometry(30, 30, 40, 40);
            change_uvs(geometry, ux, uy, i, j);
            applyDomeDeformation(geometry, 1.5);

            const originalPositions = new Float32Array(geometry.attributes.position.array);

            const mat = new THREE.MeshBasicMaterial({
                map: vit,
                blending: THREE.AdditiveBlending
            });

            cubos[cubeCount] = new THREE.Mesh(geometry, mat);
            cubos[cubeCount].userData = {
                originalPositions,
                displacementMultiplier: Math.random() * 10 + 5
            };

            const index = cubeCount;
            const theta = 2 * Math.PI * index / phi;
            const phiAngle = Math.acos(1 - 2 * index / totalCubes);

            cubos[cubeCount].position.set(
                radius * Math.sin(phiAngle) * Math.cos(theta),
                radius * Math.sin(phiAngle) * Math.sin(theta),
                radius * Math.cos(phiAngle)
            );

            const randScale = Math.random() * 4 + 2;
            cubos[cubeCount].scale.set(randScale * 2, randScale * 2, 1);

            cubos[cubeCount].rotation.set(
                Math.random() * Math.PI * 1.2,
                Math.random() * Math.PI * 1.2,
                Math.random() * Math.PI * 1.2
            );

            cubos[cubeCount].lookAt(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );

            scene.add(cubos[cubeCount]);
            cubeCount++;
        }
    }

    window.updateCubeVertices = function () {
        const time = Date.now() * 0.001;

        cubos.forEach(cube => {
            const geometry = cube.geometry;
            const positionAttribute = geometry.attributes.position;
            const positions = positionAttribute.array;
            const originalPositions = cube.userData.originalPositions;
            const displacementStrength = cube.userData.displacementMultiplier * (1 + Math.sin(time * 0.5) * 0.3);

            for (let i = 0; i < positions.length; i += 3) {
                positions[i]     = originalPositions[i];
                positions[i + 1] = originalPositions[i + 1];
                positions[i + 2] = originalPositions[i + 2];

                const waveEffect = Math.sin(time + i * 0.2) * 0.1;
                const displacement = waveEffect * displacementStrength;

                positions[i]     += displacement * (0.5 + Math.sin(time * 0.3 + i) * 0.1);
                positions[i + 1] += displacement * (0.5 + Math.cos(time * 0.35 + i) * 0.1);
                positions[i + 2] += displacement * (0.7 + Math.sin(time * 0.4 + i) * 0.1);
            }

            positionAttribute.needsUpdate = true;
        });
    };
}

function applyDomeDeformation(geometry, intensity = 1.0) {
    const positions = geometry.attributes.position.array;

    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const distance = Math.sqrt(x * x + y * y) / 15;
        const curvature = Math.cos(distance * Math.PI * 0.5) * intensity * 200;
        positions[i + 2] = curvature * (0.5 + Math.sin(x * y * 0.01) * 0.3);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
}

function change_uvs(geometry, unitx, unity, offsetx, offsety) {
    const uvs = geometry.attributes.uv.array;
    for (let i = 0; i < uvs.length; i += 2) {
        uvs[i]     = (uvs[i] + offsetx) * unitx;
        uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
    }
}

function createFloatingRectangles(num) {
    const radius = 150;
    const phi = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < num; i++) {
        const width  = Math.random() * 80 + 25;
        const height = Math.random() * 80 + 25;
        const rectGeometry = new THREE.PlaneGeometry(width, height);
        const edges = new THREE.EdgesGeometry(rectGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 6 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);

        const theta    = 2 * Math.PI * i / phi;
        const phiAngle = Math.acos(1 - 2 * i / num);

        wireframe.position.set(
            radius * Math.sin(phiAngle) * Math.cos(theta),
            radius * Math.sin(phiAngle) * Math.sin(theta),
            radius * Math.cos(phiAngle)
        );
        wireframe.lookAt(0, 0, 0);
        rectGroup.add(wireframe);
    }
}

function animate() {
    analyser.getByteFrequencyData(data);

    avgFrequency = 0;
    for (let i = 0; i < data.length; i++) avgFrequency += data[i];
    avgFrequency /= data.length;

    avgCount = (avgCount + avgFrequency) % 100000;

    bloomPass.strength = Math.sqrt(avgFrequency * 0.02) * 0.6;

    const positionAttribute = points.geometry.attributes.position;
    const position = positionAttribute.array;

    const noiseStrength = 0.2;
    const freqStrength  = 4;

    const minScale = 0.77;
    const maxScale = 1 + avgFrequency / 256;
    const scaleMultiplier = THREE.MathUtils.lerp(minScale, maxScale, avgFrequency / 256);

    for (let i = 0; i < position.length; i += 3) {
        const origX = originalPosition[i];
        const origY = originalPosition[i + 1];
        const origZ = originalPosition[i + 2];

        const freqValue  = data[i % data.length] / 256;
        const audioOffset = Math.pow(freqValue, 1) * freqStrength;

        const sineOffset =
            Math.sin(origX * 0.3 + avgCount / 1000) * noiseStrength +
            Math.cos(origY * 0.3 + avgCount / 1000) * noiseStrength +
            Math.sin(origZ * 0.3 + avgCount / 1000) * noiseStrength;

        const totalOffset = sineOffset + audioOffset;

        position[i]     = THREE.MathUtils.lerp(position[i],     origX + origX * totalOffset, 0.05);
        position[i + 1] = THREE.MathUtils.lerp(position[i + 1], origY + origY * totalOffset, 0.05);
        position[i + 2] = THREE.MathUtils.lerp(position[i + 2], origZ + origZ * totalOffset, 0.05);
    }

    positionAttribute.needsUpdate = true;

    points.scale.set(scaleMultiplier * 12, scaleMultiplier * 12, scaleMultiplier * 12);

    updateCubeVertices();

    const stime  = ((avgCount * 0.125) % 5000) / 5000;
    const stime2 = stime;
    const stime3 = stime;

    const point = curve.getPointAt(stime);
    ring.position.set(point.x, point.y, point.z);
    const tangent = curve.getTangentAt(stime);
    ring.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent));

    const point2 = curve2.getPointAt(stime2);
    ring2.position.set(point2.x, point2.y, point2.z);
    const tangent2 = curve2.getTangentAt(stime2);
    ring2.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent2));

    const point3 = curve3.getPointAt(stime3);
    ring3.position.set(point3.x, point3.y, point3.z);
    const tangent3 = curve3.getTangentAt(stime3);
    ring3.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent3));

    const t = avgCount / 1000;
    const amplitudeX = 1 + t;
    const amplitudeY = 25;
    const amplitudeZ = 1 + t;
    const frequency  = 0.5;

    camera.position.x = amplitudeX * Math.sin(t * sentido * frequency);
    camera.position.y = amplitudeY * Math.sin(t * frequency * 0.5);
    camera.position.z = amplitudeZ * Math.cos(t * sentido * frequency);
    camera.lookAt(ring.position);

    composer.render();
}

export function showCredits() {
    document.getElementById('container').remove();

    const credits = document.createElement('div');
    credits.id = 'credits';
    credits.innerHTML = '';
    credits.style.display = 'block';
    document.body.appendChild(credits);
}

export function hydraSelect(sketch) {
    switch (sketch) {
        case 0:
            osc(10, 0.04, 0.6)
                .color(0.8 * 4, 0.9 * 2, 0.5)
                .modulate(noise(3, 0.1).rotate(0.1, 0.02).scale(1.1), 0.1)
                .modulate(src(o0).scale(1.1).rotate(0.01), 0.1)
                .invert()
                .saturate(1.1)
                .hue(2)
                .out();
            break;
        case 1:
            osc(10, 0.08, 0.8)
                .color(1 * 2, 0.8 * 4, 0.9)
                .modulate(noise(4, 0.1).rotate(0.01, 0.02).scale(1.1), 0.1)
                .modulate(src(o0).scale(1.1).rotate(0.01), 0.2)
                .invert()
                .saturate(1.1)
                .out();
            break;
        case 2:
            osc(19, 0.4, 0.4)
                .color(1.5, 0.9 * 8, 0.8 * 4)
                .modulate(noise(1, 0.1).rotate(0.1, 0.02).scale(1.01), 0.5)
                .modulate(src(o0).scale(1.1).rotate(0.01), 0.1)
                .invert()
                .saturate(1.1)
                .out();
            break;
        case 3:
            osc(10, 0.14, 0.4)
                .color(2, 0.9 * 8, 0.8 * 4)
                .modulate(voronoi(0.8, 0.1).rotate(0.01, 0.02).scale(1.01), 0.3)
                .modulate(src(o0).scale(1.1).rotate(0.1), 0.2)
                .invert()
                .saturate(1.1)
                .out();
            break;
    }
}

function playAudioFile(filePath) {
    fetch(filePath)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
        .then(audioBuffer => {
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;

            const gainNode = audioCtx.createGain();
            gainNode.gain.value = 0.3;

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 4096;
            analyser.smoothingTimeConstant = 0.95;
            data = new Uint8Array(analyser.frequencyBinCount);

            source.connect(gainNode);
            gainNode.connect(analyser);
            analyser.connect(audioCtx.destination);

            const onsetDetector = new OnsetDetector(audioCtx, audioBuffer, 0.01);
            onsetDetector.start((flux) => {
                vit.needsUpdate = true;

                if (consethydra === 58) {
                    consethydra = 0;
                    sentido *= -1;
                    hydraSelect(hydraCount % 4);
                    hydraCount++;
                }
                consethydra++;
            });

            source.onended = function () {
                onsetDetector.stop();
                document.getElementById('container').style.display = "none";
                document.getElementById('overlay').style.display = "block";
                document.getElementById('credits').style.display = "block";
            };

            // Inicializar g1 con el mismo buffer del audio principal
            g1 = new GrainEngine(audioCtx, audioBuffer, {
                pointer: 0,
                windowSize: 0.1,
                overlaps: 8,
                amp: 0.3,
                randomPosition: 0.1,
                randomPitch: 0.05
            });
            g1.connect(audioCtx.destination);
            seq = new GrainSequencer(audioCtx, 120, 4);
            window.dispatchEvent(new CustomEvent('g1ready'));

            source.start(0);
            renderer.setAnimationLoop(animate);
        })
        .catch(console.error);
}

function onWindowResize() {
    const width  = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
}
