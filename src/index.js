import * as THREE from 'three';

let renderer, scene, camera, container;
let originalPosition, points, analyser, rectGroup;

let data = []; 

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

function init() {
    const overlay = document.getElementById('overlay');
    overlay.remove();

    document.getElementById('container').style.display = "block";

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.background = new THREE.Color(0x000000);

    const ambient = new THREE.HemisphereLight(0xffffff, 1);
    scene.add(ambient);

    // Crear una geometría de esfera y un material de puntos
    const geometry = new THREE.SphereGeometry(15, 64, 64); // Aumenta el detalle de la esfera

    // Usamos PointsMaterial para las partículas
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3, // Tamaño de las partículas
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
    createFloatingRectangles(5); // Puedes ajustar el número de rectángulos
    scene.add(rectGroup);

    // Activar el micrófono y obtener los datos de frecuencia
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 4096; // Tamaño de FFT
        const bufferLength = analyser.frequencyBinCount; 
        data = new Uint8Array(bufferLength);   
        source.connect(analyser);
        console.log("Mic activado")
        renderer.setAnimationLoop(animate);
    })
    .catch(err => {
        console.log('Error al acceder al mic: ', err);
    });

}

function createFloatingRectangles(num) {
    for (let i = 0; i < num; i++) {
        const width = Math.random() * 40 + 25;  
        const height = Math.random() * 40 + 25; 

        const rectGeometry = new THREE.PlaneGeometry(width, height);
        const edges = new THREE.EdgesGeometry(rectGeometry); 
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);

        wireframe.position.set(
            (Math.random() - 0.5) * 200,  
            (Math.random() - 0.1) * 20,  
            (Math.random() - 0.5) * 200  
        );

        wireframe.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        rectGroup.add(wireframe); 
    }
}


function animate() {
    
    analyser.getByteFrequencyData(data); 

    // Calcular la intensidad promedio del sonido
    const avgFrequency = (data.reduce((sum, value) => sum + value, 0) / data.length) * 1;
    points.rotation.x += 0.0009 ; 
    points.rotation.y -= 0.0016 ;

    const positionAttribute = points.geometry.attributes.position;
    const position = positionAttribute.array;
    const time = performance.now() * 0.001 ;

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
        const sineOffset = Math.sin(origX * 0.2 + time) * noiseStrength +
                           Math.cos(origY * 0.2 + time) * noiseStrength +
                           Math.sin(origZ * 0.2 + time) * noiseStrength;

        const totalOffset = sineOffset + audioOffset;

        // Usamos lerp para suavizar la transición en los vértices
        position[i] = THREE.MathUtils.lerp(position[i], origX + origX * totalOffset, 0.05);
        position[i + 1] = THREE.MathUtils.lerp(position[i + 1], origY + origY * totalOffset, 0.05);
        position[i + 2] = THREE.MathUtils.lerp(position[i + 2], origZ + origZ * totalOffset, 0.05);
    }

    positionAttribute.needsUpdate = true;

    // Escalar la esfera según la intensidad promedio del sonido
    points.scale.set(scaleMultiplier*4, scaleMultiplier*4, scaleMultiplier*4);

    rectGroup.rotation.x += 0.0009;
    rectGroup.rotation.y += 0.0016;

    render();
}

function render() {
    renderer.render(scene, camera);
}
