import { Grain, AudioBufferRecorder } from 'treslib'; 
import * as dat from 'dat.gui';

let g1, g2, source;
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let rec1, rec2;
let isPlaying1 = false; // Estado de reproducción g1
let isPlaying2 = false; // Estado de reproducción g2

const params = {
  // Granulador 1
  g1Record: () => recordSegment(1),
  g1Play: false, // Cambiado a false por defecto
  g1GrainSize: 0.1,
  g1Overlap: 0.5,
  g1Speed: 1.0,
  g1Position: 0,
  g1Gain: 0.5,
  
  // Granulador 2
  g2Record: () => recordSegment(2),
  g2Play: false,
  g2GrainSize: 0.1,
  g2Overlap: 0.5,
  g2Speed: 1.0,
  g2Position: 0,
  g2Gain: 0.5
};

async function recordSegment(granulatorNum) {
  try {
    const recorder = new AudioBufferRecorder(audioCtx, source, 2.0);
    console.log(`Grabando segmento de 2s para g${granulatorNum}...`);
    await recorder.startRecording();
    
    const buffer = await recorder.getRecordedBuffer();
    
    if (granulatorNum === 1) {
      rec1 = recorder;
      updateG1(buffer);
      // Detener reproducción previa al grabar nuevo segmento
      if (isPlaying1) {
        g1.stop();
        g1.start(); // Reiniciar con nuevo buffer
      }
    } else {
      rec2 = recorder;
      updateG2(buffer);
      if (isPlaying2) {
        g2.stop();
        g2.start();
      }
    }
    
    console.log(`Segmento de 2s grabado para g${granulatorNum}`);
  } catch (err) {
    console.error(`Error grabando segmento:`, err);
  }
}

function initGranulators(audioSource, grain1, grain2) {
  // audioCtx = ctx;
  source = audioSource;
  g1 = grain1 || new Grain(audioCtx);
  g2 = grain2 || new Grain(audioCtx);
  
  setupGUI();
}

function setupGUI() {
  const gui = new dat.GUI({ width: 250 });
  
  // Granulador 1
  const g1Folder = gui.addFolder('Granulador 1');
  g1Folder.add(params, 'g1Record').name('Grabar 2s');
  
  const g1PlayCtrl = g1Folder.add(params, 'g1Play').name('Play/Stop');
  g1PlayCtrl.onChange(val => {
    if (val && rec1) {
      if (!isPlaying1) { // Solo iniciar si no está ya reproduciendo
        g1.start();
        isPlaying1 = true;
      }
    } else {
      g1.stop();
      isPlaying1 = false;
    }
  });
  
  g1Folder.add(params, 'g1GrainSize', 0.01, 2, 0.01).name('Tamaño').onChange(() => {
    if (rec1) updateG1();
  });
  
  g1Folder.add(params, 'g1Overlap', 0.1, 10, 0.1).name('Solapamiento').onChange(() => {
    if (rec1) updateG1();
  });
  
  g1Folder.add(params, 'g1Speed', -4, 4, 0.1).name('Velocidad').onChange(() => {
    if (rec1) updateG1();
  });
  
  g1Folder.add(params, 'g1Position', 0, 1, 0.01).name('Posición').onChange(() => {
    if (rec1) updateG1();
  });
  
  g1Folder.add(params, 'g1Gain', 0, 1, 0.01).name('Volumen').onChange(val => {
    g1.gain = val;
  });
  
  // Granulador 2
  const g2Folder = gui.addFolder('Granulador 2');
  g2Folder.add(params, 'g2Record').name('Grabar 2s');
  
  const g2PlayCtrl = g2Folder.add(params, 'g2Play').name('Play/Stop');
  g2PlayCtrl.onChange(val => {
    if (val && rec2) {
      if (!isPlaying2) {
        g2.start();
        isPlaying2 = true;
      }
    } else {
      g2.stop();
      isPlaying2 = false;
    }
  });
  
  g2Folder.add(params, 'g2GrainSize', 0.01, 2, 0.01).name('Tamaño').onChange(() => {
    if (rec2) updateG2();
  });
  
  g2Folder.add(params, 'g2Overlap', 0.1, 10, 0.1).name('Solapamiento').onChange(() => {
    if (rec2) updateG2();
  });
  
  g2Folder.add(params, 'g2Speed', -4, 4, 0.1).name('Velocidad').onChange(() => {
    if (rec2) updateG2();
  });
  
  g2Folder.add(params, 'g2Position', 0, 1, 0.01).name('Posición').onChange(() => {
    if (rec2) updateG2();
  });
  
  g2Folder.add(params, 'g2Gain', 0, 1, 0.01).name('Volumen').onChange(val => {
    g2.gain = val;
  });
  
  g1Folder.open();
  g2Folder.open();
}

function updateG1(buffer = null) {
  const currentBuffer = buffer || (rec1 ? rec1.getRecordedBuffer() : null);
  if (currentBuffer) {
    g1.set(
      currentBuffer,
      params.g1GrainSize,
      params.g1Overlap,
      params.g1Speed,
      params.g1Position,
      params.g1Gain
    );
    // No iniciamos automáticamente aquí
  }
}

function updateG2(buffer = null) {
  const currentBuffer = buffer || (rec2 ? rec2.getRecordedBuffer() : null);
  if (currentBuffer) {
    g2.set(
      currentBuffer,
      params.g2GrainSize,
      params.g2Overlap,
      params.g2Speed,
      params.g2Position,
      params.g2Gain
    );
    // No iniciamos automáticamente aquí
  }
}

export function setupGranulatorsGUI(audioSource, grain1, grain2) {
  initGranulators(audioSource, grain1, grain2);
}

export { g1, g2, audioCtx };