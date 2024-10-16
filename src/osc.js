import { GLoop, Grain, AudioBufferRecorder, FreeSoundSearcher, FreeSoundAudioLoader } from 'treslib'; 
import { url, apiKey } from './config.js';
import { showCredits } from './index.js';

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const freesound = new FreeSoundSearcher(apiKey)
const audioloader = new FreeSoundAudioLoader(apiKey)

const socket = new WebSocket(`ws://127.0.0.1:8080`);

let rec, rectime, rec2, rectime2, g1 = new Grain(audioCtx), g2 = new Grain(audioCtx);  

// let g2buffer = 0, g3buffer = 0;

socket.onmessage = (event) => {
  const oscMsg = JSON.parse(event.data);
  // console.log('Mensaje OSC recibido en la web:', oscMsg);

  /////////////////////////////////////////////////////////////////////
  // G1
  /////////////////////////////////////////////////////////////////////

  if(oscMsg.address == "/rectime"){
    rectime = oscMsg.numarg[0]; 
  }

  if(oscMsg.address == "/rec" && oscMsg.numarg[0] == 1){
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const source = audioCtx.createMediaStreamSource(stream);
        console.log("Inicia grabación")
        rec = new AudioBufferRecorder(audioCtx, source, rectime)
        rec.startRecording();
    })
    .catch(err => {
        console.log('Error al acceder al mic: ', err);
    });
  }

  if(oscMsg.address == "/rec" && oscMsg.numarg[0] == 0){
    rec.stopRecording();
    console.log("termina grabación")
  }

  if(oscMsg.address == "/test"){
    let audioSource = audioCtx.createBufferSource();
    audioSource.buffer = rec.getRecordedBuffer();
    audioSource.connect(audioCtx.destination); 
    audioSource.start(0);
    console.log("prueba")
  }

  if(oscMsg.address == "/g1set"){
    g1.set(rec.getRecordedBuffer(), oscMsg.numarg[0], oscMsg.numarg[1], oscMsg.numarg[2], oscMsg.numarg[3], oscMsg.numarg[4]); // ¿Por qué estaba comentado? 
    console.log("g1 set")
  }

  if(oscMsg.address == "/g1start"){ 
    g1.start(); 
    console.log("inicia g1")
  }

  if(oscMsg.address == "/g1stop"){
    g1.stop();
    console.log("termina g1")
  }

  if(oscMsg.address == "/g1gain"){
    g1.gain = oscMsg.numarg[0]; 
    console.log("cambio ganancia de g1")
  }

    /////////////////////////////////////////////////////////////////////
  // G2
  /////////////////////////////////////////////////////////////////////

  if(oscMsg.address == "/rectime2"){
    rectime2 = oscMsg.numarg[0]; 
  }

  if(oscMsg.address == "/rec2" && oscMsg.numarg[0] == 1){
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const source = audioCtx.createMediaStreamSource(stream);
        console.log("Inicia grabación 2")
        rec2 = new AudioBufferRecorder(audioCtx, source, rectime2); 
        rec2.startRecording();
    })
    .catch(err => {
        console.log('Error al acceder al mic: ', err);
    });
  }

  if(oscMsg.address == "/rec2" && oscMsg.numarg[0] == 0){
    rec2.stopRecording();
    console.log("termina grabación")
  }

  if(oscMsg.address == "/test2"){
    let audioSource = audioCtx.createBufferSource();
    audioSource.buffer = rec2.getRecordedBuffer();
    audioSource.connect(audioCtx.destination); 
    audioSource.start(0);
    console.log("prueba")
  }

  if(oscMsg.address == "/g2set"){
    g2.set(rec2.getRecordedBuffer(), oscMsg.numarg[0], oscMsg.numarg[1], oscMsg.numarg[2], oscMsg.numarg[3], oscMsg.numarg[4]);  
    //console.log("g2 set")
  }

  if(oscMsg.address == "/g2start"){ 
    g2.start(); 
    console.log("inicia g2")
  }

  if(oscMsg.address == "/g2stop"){
    g2.stop();
    console.log("termina g2")
  }

  if(oscMsg.address == "/g2gain"){
    g2.gain = oscMsg.numarg[0]; 
    console.log("cambio ganancia de g2")
  }

  if(oscMsg.address == "/end"){
    showCredits(); 
    const startButton = document.getElementById('startButton');
    startButton.remove();
  }
 
};

function closeSocket() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log('Conexión WebSocket cerrada manualmente.');
    }
}

window.addEventListener('beforeunload', closeSocket);

export { audioCtx, g1, g2 };