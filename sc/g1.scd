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