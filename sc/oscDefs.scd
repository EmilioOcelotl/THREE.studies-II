m = NetAddr("localhost", 57120);

p = ProxySpace.push(s.boot);
p.makeTempoClock((120/120));
s.meter;

////////////////////////////////////////////////////////////////////////////
// G1
////////////////////////////////////////////////////////////////////////////

(
m.sendMsg("/rectime", 6);
m.sendMsg("/rec", 1);
)

(
m.sendMsg("/rec", 0);
m.sendMsg("/g1set", 0.1, 1, 0.25, 0.1, 0.1);
m.sendMsg("/g1start");
)

m.sendMsg("/g1gain", 0.5)

(
m.sendMsg("/g1stop");
OSCdef(\g1).free;
)

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
			Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, 0.01, 1.0), inf)), // pointer
			Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, -2.0, 2.0), inf)),  // freqScale
			0.8, // windowSize
			Lag.kr(Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, 0.2, 0.5), inf)), 1), // overlaps
			Lag.kr(Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, 0.0, 0.5), inf)), 1)  // windowRandRatio
		]
	);
};
)


OSCdef(\g1).free;

////////////////////////////////////////////////////////////////////////////
// G2
////////////////////////////////////////////////////////////////////////////

(
m.sendMsg("/rectime2", 5);
m.sendMsg("/rec2", 1);
)

(
m.sendMsg("/rec2", 0);
m.sendMsg("/g2set", 0.2, 1, 0.25, 0.1, 0.1);
m.sendMsg("/g2start");
)

m.sendMsg("/g2gain", 0.5)

(
m.sendMsg("/g2stop");
OSCdef(\g2).free;
)

(
OSCdef(\g2, {|msg|
	var val1 = msg[3];  // Pointer
	var val2 = msg[4];  // freqScale
	var val3 = msg[5];  // windowSize
	var val4 = msg[6];  // overlaps
	var val5 = msg[7];  // windowRandRatio

	m.sendMsg("/g2set", val1, val2, val3, val4, val5);
}, '/g2setDef');

~g2setSend = {
	SendReply.kr(
		Impulse.kr(30),
		'/g2setDef',
		[
			Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, 0.01, 1.0), inf)), // pointer
			Lag.kr(Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, 0.2, 2.0), inf)), 1),  // freqScale
			0.01, // windowSize
			Lag.kr(Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, 0.2, 0.05), inf)), 1), // overlaps
			Lag.kr(Demand.kr(Onsets.kr(FFT(LocalBuf(512), SoundIn.ar(0)), 0.1), 0, Drand(Array.rand(20, 0.0, 0.5), inf)), 1)  // windowRandRatio
		]
	);
};
)


OSCdef(\g2).free;