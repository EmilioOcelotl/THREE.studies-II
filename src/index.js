// Valores que se pueden modular: osc, smoothing time  

import * as THREE from 'three';
import { EffectComposer } from '../jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../jsm/postprocessing/UnrealBloomPass.js';
import Hydra from 'hydra-synth'
import { CSS2DRenderer, CSS2DObject } from '../jsm/renderers/CSS2DRenderer.js';
import './osc.js';
import audioCtx from './osc.js';
import spriteImage from '../static/img/trace_01.png';
import { MMLLWebAudioSetup } from '../../MMLL/MMLL.js';
import { MMLLOnsetDetector } from '../../MMLL/MMLL.js';

let renderer, scene, camera, container;
let originalPosition, points = [], analyser, rectGroup;

let data = [];

let ring, ring2, ring3, curve, curve2, curve3;
let composer;

let cubos = [], bamboo = [];

let avgFrequency, avgCount = 0;

let label, label2, label3;

const hydra = new Hydra({
    canvas: document.getElementById("myCanvas"),
    detectAudio: false,
    //makeGlobal: false
}) // antes tenía .synth aqui 

let webaudio; 

let elCanvas = document.getElementById("myCanvas");
vit = new THREE.CanvasTexture(elCanvas);
elCanvas.style.display = 'none';

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

function init() {
    const overlay = document.getElementById('overlay');
    overlay.remove();

    const credits = document.getElementById('credits');
    credits.remove();

    document.getElementById('container').style.display = "block";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // scene.background = vit;
    //composer.render();

    const ambient = new THREE.HemisphereLight(0xffffff, 1);
    scene.add(ambient);

    // Crear una geometría de esfera y un material de puntos
    const geometry = new THREE.SphereGeometry(15, 64, 64); // Aumenta el detalle de la esfera

    const loader = new THREE.TextureLoader();
    
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5, // Tamaño de cada partícula
        // map: spriteTexture,
        transparent: true, // Para manejar la transparencia del sprite
        alphaTest: 0.5, // Ajusta para evitar el renderizado de pixeles transparentes
        //blending: THREE.AdditiveBlending // Mezclado para un efecto luminoso
      });

    const positionAttribute = geometry.attributes.position;
    originalPosition = Float32Array.from(positionAttribute.array); // Guardamos las posiciones originales

    points = new THREE.Points(geometry, material);
    scene.add(points);

    camera.position.z = 100;

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    // renderer.toneMapping = THREE.ReinhardToneMapping;

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    rectGroup = new THREE.Group(); // Grupo para contener los rectángulos
    createFloatingRectangles(10); // Puedes ajustar el número de rectángulos
    scene.add(rectGroup);

    const numBamboos = 15; // Cambia para ajustar el número de bamboos
    const radius = 100; // Cambia para ajustar el radio de la circunferencia
    const bambooHeight = 2000; // Altura de cada bamboo
    const bambooWidth = 0.5; // Ancho de cada bamboo

    const bambooMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < numBamboos; i++) {
        // Calcula la posición de cada bamboo
        const angle = (i / numBamboos) * Math.PI * 2;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);

        // Crear geometría del bamboo
        const geometry = new THREE.BoxGeometry(bambooWidth, bambooHeight, bambooWidth);
        const bamboo = new THREE.Mesh(geometry, bambooMaterial);

        // Coloca y rota el bamboo
        bamboo.position.set(x, 0, z); // Ajusta la altura para que toque el suelo
        bamboo.lookAt(0, 0, 0); // Hace que cada bamboo mire hacia el centro

    // Genera una inclinación aleatoria para el bamboo
    const tiltAngle = (Math.random() - 0.5) * Math.PI / 1.5; // Cambia este valor para ajustar el rango de inclinación
    bamboo.rotation.x = tiltAngle; // Rota en el eje X

        // Añade el bamboo a la escena
        scene.add(bamboo);
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            //const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
        new THREE.Vector3(100, 0, 100),
        new THREE.Vector3(50, 50, -10),
        new THREE.Vector3(-100, -150, -100),
        new THREE.Vector3(100, -50, 100),
        new THREE.Vector3(-150, 50, 0)
    ];

    curve = new THREE.CatmullRomCurve3(pointsCurve, true);

    // Generar la geometría de tubo
    const geometryTube = new THREE.TubeGeometry(curve, 400, 0.25, 8, false);
    const materialTube = new THREE.MeshBasicMaterial({ color: 0xb2b2ff, wireframe: false });
    const tube = new THREE.Mesh(geometryTube, materialTube);
    scene.add(tube);

    // Crear el primer tubo complementario (reflejado en el eje Y)
    const complementPoints1 = pointsCurve.map(point => new THREE.Vector3(point.x, -point.y, point.z));
    curve2 = new THREE.CatmullRomCurve3(complementPoints1, true);
    const geometryTubeComplement1 = new THREE.TubeGeometry(curve2, 400, 0.25, 8, false);
    const materialTubeComplement1 = new THREE.MeshBasicMaterial({ color: 0xffb2ff, wireframe: false }); // Color complementario
    const tubeComplement1 = new THREE.Mesh(geometryTubeComplement1, materialTubeComplement1);
    scene.add(tubeComplement1);

    // Crear el segundo tubo complementario (reflejado en el eje Z)
    const complementPoints2 = pointsCurve.map(point => new THREE.Vector3(point.x, point.y, -point.z));
    curve3 = new THREE.CatmullRomCurve3(complementPoints2, true);
    const geometryTubeComplement2 = new THREE.TubeGeometry(curve3, 400, 0.25, 8, false);
    const materialTubeComplement2 = new THREE.MeshBasicMaterial({ color: 0xb2ffb2, wireframe: false }); // Otro color complementario
    const tubeComplement2 = new THREE.Mesh(geometryTubeComplement2, materialTubeComplement2);
    scene.add(tubeComplement2);

    const cylinderGeometry = new THREE.CylinderGeometry(0.75, 0.75, 4, 32); // (radio superior, radio inferior, altura, segmentos)
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0xb2b2ff });
    ring = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    scene.add(ring);

    const cylinderGeometry2 = new THREE.CylinderGeometry(0.75, 0.75, 4, 32); // (radio superior, radio inferior, altura, segmentos)
    const cylinderMaterial2 = new THREE.MeshBasicMaterial({ color: 0xffb2ff });
    ring2 = new THREE.Mesh(cylinderGeometry2, cylinderMaterial2);
    scene.add(ring2);

    const cylinderGeometry3 = new THREE.CylinderGeometry(0.75, 0.75, 4, 32); // (radio superior, radio inferior, altura, segmentos)
    const cylinderMaterial3 = new THREE.MeshBasicMaterial({ color: 0xb2ffb2 });
    ring3 = new THREE.Mesh(cylinderGeometry3, cylinderMaterial3);
    scene.add(ring3);

    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1, // Intensidad del bloom
        0.4, // Radio
        0.3 // Umbral
    );

    composer.addPass(bloomPass);

    osc(() => (avgFrequency / 0.5), 0.7, 0.5)
        .kaleid(7)
        .color(1, 1, 1)
        .rotate(0, 0.1)
        .modulate(o0, () => (avgFrequency + 0.0001) * 0.03)
        .modulate(noise(() => (avgFrequency / 30) * 2, 0.01))
        .scale(1.1)
        .blend(
            osc(() => (avgFrequency > 0 ? 1 : 0.1), 0.1, 0)
                .color(0, 0, 0)
                .scale(1)
        )
        .out(o0);

    createCubes();

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('container').appendChild(labelRenderer.domElement);

    let labeltext = document.createElement('div');
    labeltext.className = 'label';
    // labeltext.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Negro con transparencia
    labeltext.style.padding = '10px';
    labeltext.style.borderRadius = '10px';
    labeltext.style.margin = '25px'; // Ajusta el margen según sea necesario
    labeltext.style.color = 'rgb(178, 178, 255)'; // Cambia a azul oscuro
    label = new CSS2DObject(labeltext);
    scene.add(label);

    //labeltext.style.border = '2px solid rgba(255, 255, 255, 1)'; // Contorno negro
    let labeltext2 = document.createElement('div');
    labeltext2.className = 'label';
    // labeltext.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Negro con transparencia
    labeltext2.style.padding = '10px';
    labeltext2.style.borderRadius = '10px';
    labeltext2.style.margin = '25px'; // Ajusta el margen según sea necesario
    labeltext2.style.color = 'rgb(255, 178, 255)'; // Cambia a azul oscuro
    label2 = new CSS2DObject(labeltext2);
    scene.add(label2);

    //labeltext.style.border = '2px solid rgba(255, 255, 255, 1)'; // Contorno negro
    let labeltext3 = document.createElement('div');
    labeltext3.className = 'label';
    // labeltext.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Negro con transparencia
    labeltext3.style.padding = '10px';
    labeltext3.style.borderRadius = '10px';
    labeltext3.style.margin = '25px'; // Ajusta el margen según sea necesario
    labeltext3.style.color = 'rgb(178, 255, 178)'; // Cambia a azul oscuro
    label3 = new CSS2DObject(labeltext3);
    scene.add(label3);

    // MMLL

    webaudio = new MMLLWebAudioSetup(256,2,callback,setup); 

}

function createCubes() {
    const xgrid = 4, ygrid = 4;
    const ux = 1 / xgrid;
    const uy = 1 / ygrid;
    const xsize = 500 / xgrid;
    const ysize = 500 / ygrid;
    let materials = [];

    let cubeCount = 0;
    let radius = 200; // Radio de la esfera
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

            let rand1 = Math.random() * 3 + 1;
            let rand2 = Math.random() * 3 + 1;

            cubos[cubeCount].scale.x = rand1;
            cubos[cubeCount].scale.y = rand2;

            cubos[cubeCount].lookAt(0, 0, 0);

            scene.add(cubos[cubeCount]);
            cubeCount++;
        }
    }
}

function change_uvs(geometry, unitx, unity, offsetx, offsety) {

    const uvs = geometry.attributes.uv.array;

    for (let i = 0; i < uvs.length; i += 2) {
        uvs[i] = (uvs[i] + offsetx) * unitx;
        uvs[i + 1] = (uvs[i + 1] + offsety) * unity;
    }

}

function createFloatingRectangles(num) {
    const radius = 150;
    const phi = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < num; i++) {
        const width = Math.random() * 80 + 25;
        const height = Math.random() * 80 + 25;

        const rectGeometry = new THREE.PlaneGeometry(width, height);
        const edges = new THREE.EdgesGeometry(rectGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 });
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

    // data = analyser.getByte...

    avgFrequency = (data.reduce((sum, value) => sum + value, 0) / data.length) * 1;

    avgCount = (avgCount + avgFrequency) * 1;


    const positionAttribute = points.geometry.attributes.position;
    const position = positionAttribute.array;
    // const time = performance.now() * 0.0005;

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
        const sineOffset = Math.sin(origX * 0.3 + (avgCount / 1000)) * noiseStrength +
            Math.cos(origY * 0.3 +  (avgCount / 1000)) * noiseStrength +
            Math.sin(origZ * 0.3 +  (avgCount / 1000)) * noiseStrength;

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

    const stime = ((avgCount * 0.125) % 5000) / 5000;  // tiempo para mover el anillo

    const point = curve.getPointAt(stime);     // obtener el punto en la curva
    const tangent = curve.getTangentAt(stime); // obtener la dirección en el punto

    ring.position.set(point.x, point.y, point.z);

    const axis = new THREE.Vector3(0, 1, 0); // eje inicial del cilindro
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, tangent);
    ring.quaternion.copy(quaternion);

    const point2 = curve2.getPointAt(stime);     // obtener el punto en la curva
    const tangent2 = curve2.getTangentAt(stime); // obtener la dirección en el punto

    ring2.position.set(point2.x, point2.y, point2.z);

    const axis2 = new THREE.Vector3(0, 1, 0); // eje inicial del cilindro
    const quaternion2 = new THREE.Quaternion().setFromUnitVectors(axis2, tangent2);
    ring2.quaternion.copy(quaternion2);

    const point3 = curve3.getPointAt(stime);     // obtener el punto en la curva
    const tangent3 = curve3.getTangentAt(stime); // obtener la dirección en el punto

    ring3.position.set(point3.x, point3.y, point3.z);

    const axis3 = new THREE.Vector3(0, 1, 0); // eje inicial del cilindro
    const quaternion3 = new THREE.Quaternion().setFromUnitVectors(axis3, tangent3);
    ring3.quaternion.copy(quaternion3);

    const amplitudeX = 1 + (avgCount/1000); // Amplitud mayor en X
    const amplitudeY = 25;  // Amplitud menor en Y
    const amplitudeZ = 1 + (avgCount/1000);  // Amplitud media en Z

    const frequency = 0.5; // Frecuencia baja para movimientos suaves

    camera.position.x = amplitudeX * Math.sin((avgCount / 1000) * frequency);
    camera.position.y = amplitudeY * Math.sin((avgCount / 1000) * frequency * 0.5); // Movimiento más lento en Y
    camera.position.z = amplitudeZ * Math.cos((avgCount / 1000) * frequency);

    camera.lookAt(ring.position);
    vit.needsUpdate = true;

    label.position.copy(ring.position);
    label.element.innerHTML = `&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp x: ${ring.position.x.toFixed(2)} y: ${ring.position.y.toFixed(2)} z: ${ring.position.z.toFixed(2)}<br><br><br><br><br><br>`;

    label2.position.copy(ring2.position);
    label2.element.innerHTML = `&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp x: ${ring2.position.x.toFixed(2)} y: ${ring2.position.y.toFixed(2)} z: ${ring2.position.z.toFixed(2)}<br><br><br><br><br><br>`;

    label3.position.copy(ring3.position);
    label3.element.innerHTML = `&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp x: ${ring3.position.x.toFixed(2)} y: ${ring3.position.y.toFixed(2)} z: ${ring3.position.z.toFixed(2)}<br><br><br><br><br><br>`;

    render();

    composer.render();
    labelRenderer.render(scene, camera);

}

function render() {
    renderer.render(scene, camera);
    // labelRenderer.render(scene, camera);
}

export function showCredits() {
    // Elimina el canvas de Three.js
    const container = document.getElementById('container');
    container.remove();


    const credits = document.createElement('div');
    credits.id = 'credits';
    credits.innerHTML = 'THREE.studies<br><br>para eCello de 5 cuerdas, livercoder y navegador<br> Iracema de Andrade y Emilio Ocelotl';
    credits.style.display = 'block';
    
    // Agregarlo al DOM
    document.body.appendChild(credits);

}

const setup = function SetUp(sampleRate){
    console.log("webaudio setup!");
    onsetdetector = new MMLLOnsetDetector(sampleRate); //default threshold 0.34
    webaudio.audiocontext.close();
    webaudio.audiocontext = audioCtx;

}

var callback = function CallBack(input,output,n) {
   
    var detection = onsetdetector.next( input.monoinput );
    
    if(detection) { //aqui antes había un !mute
	
        console.log('onsetnow');

    }

};