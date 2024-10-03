import { GLoop, Grain, AudioBufferRecorder, FreeSoundSearcher, FreeSoundAudioLoader } from 'treslib'; 
import { url, apiKey } from './config.js';

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export default audioCtx;

const freesound = new FreeSoundSearcher(apiKey)
const audioloader = new FreeSoundAudioLoader(apiKey)

const socket = new WebSocket(`ws://127.0.0.1:8080`);

let rec, g1 = new Grain(audioCtx); 

socket.onmessage = (event) => {
  const oscMsg = JSON.parse(event.data);
  console.log('Mensaje OSC recibido en la web:', oscMsg);
  console.log(parseFloat(oscMsg.numarg[0]))

  if(oscMsg.address == "/rec" && oscMsg.numarg[0] == 1){
    navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        const source = audioCtx.createMediaStreamSource(stream);
        console.log("Inicia grabación")
        rec = new AudioBufferRecorder(audioCtx, source, 5)
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
    g1.set(rec.getRecordedBuffer(), oscMsg.numarg[0], oscMsg.numarg[1], oscMsg.numarg[2], oscMsg.numarg[3], oscMsg.numarg[4]);  
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
  }

};

function closeSocket() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log('Conexión WebSocket cerrada manualmente.');
    }
}

window.addEventListener('beforeunload', closeSocket);
