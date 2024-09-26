import * as THREE from 'three';

let renderer, scene, camera, container;
let originalPosition, sphere, analyser;

let audio; 

let fftSize = 4096;

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

function init() {
    const overlay = document.getElementById('overlay');
    overlay.remove();

    document.getElementById('container').style.display = "block";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.background = new THREE.Color(0xffffff);

    //const ambient = new THREE.HemisphereLight(0xffffff, 1);
    //scene.add(ambient);

    const geometry = new THREE.SphereGeometry(15, 48, 48); // Aumenta el detalle de la esfera


    
    const material = new THREE.MeshBasicMaterial( {

        color: 0x0e0e0e,
        wireframe: true

    } );


    const positionAttribute = geometry.attributes.position;
    originalPosition = Float32Array.from(positionAttribute.array); // Guardamos las posiciones originales

    sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    camera.position.z = 50;

    const listener = new THREE.AudioListener();
    camera.add(listener);

    audio = new THREE.Audio(listener);
    const file = '/voice.mp3';

    const loader = new THREE.AudioLoader();
    loader.load(file, function (buffer) {
        audio.setBuffer(buffer);
        audio.play();
    });

    analyser = new THREE.AudioAnalyser(audio, fftSize);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);

    container = document.getElementById('container');
    container.appendChild(renderer.domElement);
}

function animate() {
    let data; 
    
    if(audio.isPlaying){    
        analyser.getFrequencyData();
        data = analyser.getFrequencyData();
    } else {
        data = [1]; 
    }
    // Calcular la intensidad promedio del sonido
    const avgFrequency = (data.reduce((sum, value) => sum + value, 0) / data.length) * 1;
    sphere.rotation.x += 0.0009 ; 
    sphere.rotation.y -= 0.0016 ;

    const positionAttribute = sphere.geometry.attributes.position;
    const position = positionAttribute.array;

    const time = performance.now() * 0.001 * (avgFrequency/500);
    const noiseStrength = 0.2;  // Ajustamos la fuerza de la oscilación, más suave
    const freqStrength = 4;   // Reduzco el impacto del audio en la deformación

    // Escalar la esfera según la intensidad promedio del sonido
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

        // Curva exponencial para amplificar la respuesta del sonido, pero más suave
        const audioOffset = Math.pow(freqValue, 4) * freqStrength;

        // Aplicamos oscilaciones sinusoidales más suaves
        const sineOffset = Math.sin(origX * 0.2 + time) * noiseStrength +
                           Math.cos(origY * 0.2 + time) * noiseStrength +
                           Math.sin(origZ * 0.2 + time) * noiseStrength;

        // Combinamos la deformación por audio con la oscilación orgánica suave
        const totalOffset = sineOffset + audioOffset;

        // Usamos lerp para suavizar la transición en los vértices
        position[i] = THREE.MathUtils.lerp(position[i], origX + origX * totalOffset, 0.05);
        position[i + 1] = THREE.MathUtils.lerp(position[i + 1], origY + origY * totalOffset, 0.05);
        position[i + 2] = THREE.MathUtils.lerp(position[i + 2], origZ + origZ * totalOffset, 0.05);
    }

    positionAttribute.needsUpdate = true;

    // Escalar la esfera según la intensidad promedio del sonido
    sphere.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);

    render();
}



function render() {
    renderer.render(scene, camera);
}
