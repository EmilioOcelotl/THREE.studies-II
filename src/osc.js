import { GLoop, Grain, AudioBufferRecorder, FreeSoundSearcher, FreeSoundAudioLoader } from 'treslib'; 
import { url, apiKey } from './config.js';

let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export default audioCtx;

const freesound = new FreeSoundSearcher(apiKey)
const audioloader = new FreeSoundAudioLoader(apiKey)

const socket = new WebSocket(`ws://127.0.0.1:8080`);

let rec, rectime, g1 = new Grain(audioCtx), g2 = new Grain(audioCtx), g3 = new Grain(audioCtx); 

let g2buffer = 0, g3buffer = 0;

socket.onmessage = (event) => {
  const oscMsg = JSON.parse(event.data);
  // console.log('Mensaje OSC recibido en la web:', oscMsg);

  /////////////////////////////////////////////////////////////////////
  // G1
  /////////////////////////////////////////////////////////////////////

  if(oscMsg.address == "rectime"){
    rectime = oscMsg.numarg[0]; 
  }

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
    console.log("cambio ganancia de g1")
  }

  /////////////////////////////////////////////////////////////////////
  // G2
  /////////////////////////////////////////////////////////////////////

  if(oscMsg.address == "/g2search"){
    async function realizarBusqueda() {
        const resultados = await freesound.buscar(oscMsg.numarg[0]);
        return resultados; 
        // luego una función que con los resultados busque un archivo en concreto y lo descargue
    }

    realizarBusqueda()
    .then(resultados => {
        let res = resultados.resultados[Math.floor(Math.random() * resultados.resultados.length)];
        console.log(res)
        let srchURL = 'https://freesound.org/apiv2/sounds/' + res.id; 
        console.log("liga:" + srchURL);  
        audioloader.loadAudio(srchURL)
        .then(buffer => {
            g2buffer = buffer; 
            g2.set(buffer, 0, 0.5, 0.1, 0.1, 0.1)
            //grain.load(buffer); 
            g2.start(); 
            console.log("muestra cargada")
        })   
    })
    console.log("buscando g2")
  }

  if(oscMsg.address == "/g2set"){
    g2.set(g2buffer, oscMsg.numarg[0], oscMsg.numarg[1], oscMsg.numarg[2], oscMsg.numarg[3], oscMsg.numarg[4]);  
    console.log("g2 set")
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

  /////////////////////////////////////////////////////////////////////
  // G3
  /////////////////////////////////////////////////////////////////////

  if(oscMsg.address == "/g3search"){
    console.log("hola")
    async function realizarBusqueda() {
        const resultados = await freesound.buscar(oscMsg.numarg[0]);
        return resultados; 
        // luego una función que con los resultados busque un archivo en concreto y lo descargue
    }

    realizarBusqueda()
    .then(resultados => {
        let res = resultados.resultados[Math.floor(Math.random() * resultados.resultados.length)];
        console.log(res)
        let srchURL = 'https://freesound.org/apiv2/sounds/' + res.id; 
        console.log("liga:" + srchURL);  
        audioloader.loadAudio(srchURL)
        .then(buffer => {
            g3buffer = buffer; 
            g3.set(buffer, 0, 0.5, 0.1, 0.1, 0.1)
            //grain.load(buffer); 
            g3.start(); 
            console.log("muestra cargada")
        })   
    })
    console.log("buscando g3")
  }

  if(oscMsg.address == "/g3set"){
    g3.set(g3buffer, oscMsg.numarg[0], oscMsg.numarg[1], oscMsg.numarg[2], oscMsg.numarg[3], oscMsg.numarg[4]);  
    console.log("g3 set")
  }

  if(oscMsg.address == "/g3start"){ 
    g3.start(); 
    console.log("inicia g3")
  }

  if(oscMsg.address == "/g3stop"){
    g3.stop();
    console.log("termina g3")
  }

  if(oscMsg.address == "/g3gain"){
    g3.gain = oscMsg.numarg[0]; 
    console.log("cambio ganancia de g3")
  }

};

function closeSocket() {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close();
        console.log('Conexión WebSocket cerrada manualmente.');
    }
}

window.addEventListener('beforeunload', closeSocket);
