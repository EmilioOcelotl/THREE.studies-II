// ths2 osc-control API

// dirección para enviar mensajes
m =  NetAddr("localhost", 57120);
// iniciar una grabación
m.sendMsg("/rec", 1);
// detener una grabación
m.sendMsg("/rec", 0);
// preescuchar una grabación
m.sendMsg("/test");
// Setear los parámetros de g1 > pointer, freqscale, windowsize, overlapsm windowrandratio
m.sendMsg("/g1set", 0.2, 1, 0.25, 0.1, 0.1);
// volumen g1
m.sendMsg("/g1gain", 0.5)
// iniciar g1
m.sendMsg("/g1start");
// detener g1
m.sendMsg("/g1stop")
// Buscar en g2
m.sendMsg("/g2search", "rusty old");
// g2 set
m.sendMsg("/g2set", 0.2, 1, 0.25, 0.1, 0.1);
// volumen g2
m.sendMsg("/g2gain", 0.5)
// iniciar g2
m.sendMsg("/g2start");
// detener g2
m.sendMsg("/g2stop")
// Buscar en g3
m.sendMsg("/g3search", "kick");
// g3 set
m.sendMsg("/g3set", 0.2, 1, 0.25, 0.1, 0.1);
// volumen g3
m.sendMsg("/g3gain", 0.5)
// iniciar g3
m.sendMsg("/g3start");
// detener g3
m.sendMsg("/g3stop"); 