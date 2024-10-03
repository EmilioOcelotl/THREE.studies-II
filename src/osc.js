import { GLoop, Grain, AudioBufferRecorder, FreeSoundSearcher, FreeSoundAudioLoader } from 'treslib'; 
import { url, apiKey } from './config.js';

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export default audioCtx;

const freesound = new FreeSoundSearcher(apiKey)
const audioloader = new FreeSoundAudioLoader(apiKey)

const socket = new WebSocket(`ws://127.0.0.1:8080`);

let rec; 

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
    console.log(audioSource.buffer)
    audioSource.connect(audioCtx.destination); 
    audioSource.start(0);
    console.log("prueba")

  }

};

function closeSocket() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log('Conexión WebSocket cerrada manualmente.');
    }
}

window.addEventListener('beforeunload', closeSocket);
