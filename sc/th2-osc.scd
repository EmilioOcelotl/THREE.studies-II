// ths2 osc-control API

// dirección para enviar mensajes

m =  NetAddr("localhost", 57120);

// iniciar una grabación

m.sendMsg("/rec", 1);

// detener una grabación

m.sendMsg("/rec", 0);

// preescuchar una grabación

m.sendMsg("/test"); 