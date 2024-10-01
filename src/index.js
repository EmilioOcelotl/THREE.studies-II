// Valores que se pueden modular: osc, smoothing time  

import * as THREE from 'three';
import { EffectComposer } from '../jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../jsm/postprocessing/UnrealBloomPass.js';
import Hydra from 'hydra-synth'

let renderer, scene, camera, container;
let originalPosition, points = [], analyser, rectGroup;

let data = [];

let ring, curve;
let composer;

let cubos = [];

let avgFrequency;
let avgCount = 0; 

const hydra = new Hydra({
    canvas: document.getElementById("myCanvas"),
    detectAudio: false,
    //makeGlobal: false
}) // antes tenía .synth aqui 

let elCanvas = document.getElementById("myCanvas");
vit = new THREE.CanvasTexture(elCanvas);
elCanvas.style.display = 'none';

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

function init() {
    const overlay = document.getElementById('overlay');
    overlay.remove();

    document.getElementById('container').style.display = "block";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.background = new THREE.Color(0x000000);
    //composer.render();

    const ambient = new THREE.HemisphereLight(0xffffff, 1);
    scene.add(ambient);

    // Crear una geometría de esfera y un material de puntos
    const geometry = new THREE.SphereGeometry(15, 64, 64); // Aumenta el detalle de la esfera

    // Usamos PointsMaterial para las partículas
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5, // Tamaño de las partículas
        sizeAttenuation: true
    });

    // Guardamos las posiciones originales de los vértices de la geometría
    const positionAttribute = geometry.attributes.position;
    originalPosition = Float32Array.from(positionAttribute.array); // Guardamos las posiciones originales

    // Creamos el sistema de partículas usando las posiciones de la esfera
    points = new THREE.Points(geometry, material);
    scene.add(points);

    camera.position.z = 100;

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // Crear y añadir rectángulos flotantes
    rectGroup = new THREE.Group(); // Grupo para contener los rectángulos
    createFloatingRectangles(10); // Puedes ajustar el número de rectángulos
    scene.add(rectGroup);

    // Activar el micrófono y obtener los datos de frecuencia
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 4096; // Tamaño de FFT
            analyser.smoothingTimeConstant = 0.85;
            const bufferLength = analyser.frequencyBinCount;
            data = new Uint8Array(bufferLength);
            source.connect(analyser);
            console.log("Mic activado")
            renderer.setAnimationLoop(animate);
        })
        .catch(err => {
            console.log('Error al acceder al mic: ', err);
        });

    const pointsCurve = [
        new THREE.Vector3(-100, 0, -50),
        new THREE.Vector3(0, -50, -10),
        new THREE.Vector3(100, 0, -10),
        new THREE.Vector3(50, 50, -10),
    ];

    curve = new THREE.CatmullRomCurve3(pointsCurve, true);

    // Generar la geometría de tubo
    const geometryTube = new THREE.TubeGeometry(curve, 200, 0.25, 8, false);
    const materialTube = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false });
    const tube = new THREE.Mesh(geometryTube, materialTube);
    scene.add(tube);

    const cylinderGeometry = new THREE.CylinderGeometry(0.75, 0.75, 4, 32); // (radio superior, radio inferior, altura, segmentos)
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    ring = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    scene.add(ring);

    // Post-proceso con EffectComposer
    composer = new EffectComposer(renderer);

    // RenderPass para renderizar la escena original
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // UnrealBloomPass para agregar el efecto de "bloom"
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1, // Intensidad del bloom
        0.2, // Radio
        0.25 // Umbral
    );

    composer.addPass(bloomPass);

    osc(15, 0.1, 1)
        .kaleid(7)
        .color(0.33, 0.33, 0.33)
        .rotate(0, 0.1)
        .modulate(o0, () => (avgFrequency + 0.0001) * 0.03)
        .scale(1.01)
        .out(o0)

    createCubes();

}

function createCubes() {
    const xgrid = 4, ygrid = 4;
    const ux = 1 / xgrid;
    const uy = 1 / ygrid;
    const xsize = 500 / xgrid;
    const ysize = 500 / ygrid;
    let materials = [];

  
  
    let cubeCount = 0;
    let radius = 400; // Radio de la esfera
    const totalCubes = xgrid * ygrid; // Número total de cubos
    const phi = (1 + Math.sqrt(5)) / 2; // Proporción áurea
    
    for (let i = 0; i < xgrid; i++) {
        for (let j = 0; j < ygrid; j++) {
    
            const geometry = new THREE.BoxGeometry(20, 20, 2);
            change_uvs(geometry, ux, uy, i, j);
    
            materials[cubeCount] = new THREE.MeshBasicMaterial({ color: 0xffffff, map: vit });
            let material2 = materials[cubeCount];
    
            cubos[cubeCount] = new THREE.Mesh(geometry, material2);
    
            const index = cubeCount; 
            const theta = 2 * Math.PI * index / phi; 
            const phiAngle = Math.acos(1 - 2 * index / totalCubes); 
    
            const x = radius * Math.sin(phiAngle) * Math.cos(theta);
            const y = radius * Math.sin(phiAngle) * Math.sin(theta);
            const z = radius * Math.cos(phiAngle);
    
            cubos[cubeCount].position.set(x, y, z);
    
            cubos[cubeCount].scale.x = Math.random() * 8 + 5;
            cubos[cubeCount].scale.y = Math.random() * 8 + 5;
    
            cubos[cubeCount].lookAt(0, 0, 0);
    
            scene.add(cubos[cubeCount]);
            cubeCount++;
        }
    }
    
    console.log(cubeCount);
    
}

function change_uvs(geometry, unitx, unity, offsetx, offsety) {

    const uvs = geometry.attributes.uv.array;

    for (let i = 0; i < uvs.length; i += 2) {
        uvs[i] = (uvs[i] + offsetx) * unitx;
        uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
    }

}

function createFloatingRectangles(num) {
    const radius = 100; // Radio de la esfera
    const phi = (1 + Math.sqrt(5)) / 2; // Proporción áurea para distribución

    for (let i = 0; i < num; i++) {
        const width = Math.random() * 40 + 25;
        const height = Math.random() * 40 + 25;

        const rectGeometry = new THREE.PlaneGeometry(width, height);
        const edges = new THREE.EdgesGeometry(rectGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2});
        const wireframe = new THREE.LineSegments(edges, lineMaterial);

        const theta = 2 * Math.PI * i / phi; // Ángulo azimutal
        const phiAngle = Math.acos(1 - 2 * i / num); // Ángulo polar

        const x = radius * Math.sin(phiAngle) * Math.cos(theta);
        const y = radius * Math.sin(phiAngle) * Math.sin(theta);
        const z = radius * Math.cos(phiAngle);

        wireframe.position.set(x, y, z);

        wireframe.lookAt(0, 0, 0);

        rectGroup.add(wireframe);
    }
}


function animate() {

    analyser.getByteFrequencyData(data);

    // Calcular la intensidad promedio del sonido
    avgFrequency = (data.reduce((sum, value) => sum + value, 0) / data.length) * 1;
    //points.rotation.x += 0.0009 ; 
    // points.rotation.y -= 0.0016 ;

    avgCount = (avgCount + avgFrequency)*1; 

    const positionAttribute = points.geometry.attributes.position;
    const position = positionAttribute.array;
    const time = performance.now() * 0.0005;

    const noiseStrength = 0.4;  // Ajustamos la fuerza de la oscilación
    const freqStrength = 4;   // Reduzco el impacto del audio en la deformación

    const minScale = 0.77; // Escala mínima cuando no hay sonido
    const maxScale = 1 + avgFrequency / 256; // Escala máxima cuando hay mucho sonido
    const scaleMultiplier = THREE.MathUtils.lerp(minScale, maxScale, avgFrequency / 256);

    for (let i = 0; i < position.length; i += 3) {
        // Obtenemos las posiciones originales
        const origX = originalPosition[i];
        const origY = originalPosition[i + 1];
        const origZ = originalPosition[i + 2];

        // Obtenemos el valor de frecuencia normalizado para este vértice
        const freqValue = data[i % data.length] / 256;

        // Curva exponencial para amplificar la respuesta del sonido
        const audioOffset = Math.pow(freqValue, 1) * freqStrength;

        // Aplicamos oscilaciones sinusoidales
        const sineOffset = Math.sin(origX * 0.3 + time) * noiseStrength +
            Math.cos(origY * 0.3 + time) * noiseStrength +
            Math.sin(origZ * 0.3 + time) * noiseStrength;

        const totalOffset = sineOffset + audioOffset;

        // Usamos lerp para suavizar la transición en los vértices
        position[i] = THREE.MathUtils.lerp(position[i], origX + origX * totalOffset, 0.05);
        position[i + 1] = THREE.MathUtils.lerp(position[i + 1], origY + origY * totalOffset, 0.05);
        position[i + 2] = THREE.MathUtils.lerp(position[i + 2], origZ + origZ * totalOffset, 0.05);
    }

    positionAttribute.needsUpdate = true;

    // Escalar la esfera según la intensidad promedio del sonido
    points.scale.set(scaleMultiplier * 8, scaleMultiplier * 8, scaleMultiplier * 8);

    //rectGroup.rotation.x += 0.0009;
    //rectGroup.rotation.y -= 0.0016;

    const stime = ((avgCount*0.05) % 5000) / 5000;  // tiempo para mover el anillo

    const point = curve.getPointAt(stime);     // obtener el punto en la curva
    const tangent = curve.getTangentAt(stime); // obtener la dirección en el punto

    ring.position.set(point.x, point.y, point.z);

    const axis = new THREE.Vector3(0, 1, 0); // eje inicial del cilindro
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, tangent);
    ring.quaternion.copy(quaternion);

    // Movimiento sinusoidal en X, Y y Z
    const amplitudeX = 100; // Amplitud mayor en X
    const amplitudeY = 20;  // Amplitud menor en Y
    const amplitudeZ = 100;  // Amplitud media en Z

    const frequency = 0.125; // Frecuencia baja para movimientos suaves

    // Actualizar posición de la cámara usando sinusoides
    camera.position.x = amplitudeX * Math.sin(time * frequency);
    camera.position.y = amplitudeY * Math.sin(time * frequency * 0.5); // Movimiento más lento en Y
    camera.position.z = amplitudeZ * Math.cos(time * frequency);

    // Apuntar siempre al centro (en este caso, al cubo)
    camera.lookAt(ring.position);
    vit.needsUpdate = true;

    render();
    composer.render();

}

function render() {
    renderer.render(scene, camera);
}