m = NetAddr("localhost", 57120);

p = ProxySpace.push(s.boot);
p.makeTempoClock((120/120));
s.meter;

~ons1 = { arg th = 0.4; Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), th)}; // 512 muestras por segundo
m.sendMsg("/rec", 1);

(
~ons1 = { arg th = 0.9;
   var onsets = Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), th);
   // Convierte los onsets en triggers adecuados para Demand
   Changed.kr(onsets) * Impulse.kr(30)
};
)

m.sendMsg("/rec", 1);



(
m.sendMsg("/rec", 0);
m.sendMsg("/g1set", 0.2, 1, 0.25, 0.1, 0.1);
m.sendMsg("/g1start");
)

m.sendMsg("/g1stop");


(
OSCdef(\g1, {|msg|
	var val1 = msg[3];  // Pointer
	var val2 = msg[4];  // freqScale
	var val3 = msg[5];  // windowSize
	var val4 = msg[6];  // overlaps
	var val5 = msg[7];  // windowRandRatio

	m.sendMsg("/g1set", val1, val2, val3, val4, val5);
}, '/g1setDef');

~g1setSend = {
	SendReply.kr(
		Impulse.kr(30),
		'/g1setDef',
		[
			Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.9), 0, Drand(Array.rand(20, 0.01, 1.0), inf)), // pointer
			Lag.kr(Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.9), 0, Drand(Array.rand(20, 0.2, 2.0), inf)), 1),  // freqScale
			0.8, // windowSize
			Lag.kr(Demand.kr(IOnsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.9), 0, Drand(Array.rand(20, 0.2, 0.5), inf)), 1), // overlaps
			Lag.kr(Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.9), 0, Drand(Array.rand(20, 0.0, 0.5), inf)), 1)  // windowRandRatio
		]
	);
};
)


OSCdef(\g1).free;