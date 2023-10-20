const BASE_URL = "https://api.uberchord.com/v1/chords/";
const NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const TYPES = [
	{ label: "maj", value: "" },
	{ label: "min", value: "_m" },
	{ label: "7", value: "_7" },
	{ label: "maj7", value: "_maj7" },
	{ label: "min7", value: "_m7" },
	{ label: "5", value: "_5" },
	{ label: "6", value: "_6" },
	{ label: "dim", value: "_dim" },
	{ label: "dim7", value: "_dim7" },
	{ label: "aug", value: "_aug" },
	{ label: "sus2", value: "_sus2" },
	{ label: "sus4", value: "_sus4" },
];
const STRINGS = ["E", "A", "D", "G", "B", "e"];
const FRETS = [0, 1, 2, 3, 4, 5];
const DOTS = [3, 5, 7, 9, 12, 15];
const ALL_TONES = [
	[
		"E2",
		"F2",
		"F#2",
		"G2",
		"G#2",
		"A2",
		"A#2",
		"B2",
		"C3",
		"C#3",
		"D3",
		"D#3",
		"E3",
	],
	[
		"A2",
		"A#2",
		"B2",
		"C3",
		"C#3",
		"D3",
		"D#3",
		"E3",
		"F3",
		"F#3",
		"G3",
		"G#3",
		"A3",
	],
	[
		"D3",
		"D#3",
		"E3",
		"F3",
		"F#3",
		"G3",
		"G#3",
		"A3",
		"A#3",
		"B3",
		"C4",
		"C#4",
		"D4",
	],
	[
		"G3",
		"G#3",
		"A3",
		"A#3",
		"B3",
		"C4",
		"C#4",
		"D4",
		"D#4",
		"E4",
		"F4",
		"F#4",
		"G4",
	],
	[
		"B3",
		"C4",
		"C#4",
		"D4",
		"D#4",
		"E4",
		"F4",
		"F#4",
		"G4",
		"G#4",
		"A4",
		"A#4",
		"B4",
	],
	[
		"E4",
		"F4",
		"F#4",
		"G4",
		"G#4",
		"A4",
		"A#4",
		"B4",
		"C5",
		"C#5",
		"D5",
		"D#5",
		"E5",
	],
];

const chartContainer = document.querySelector("#chart-container");
const chart = document.querySelector("#chart");
const noteSelect = document.querySelector("#note-select");
const typeSelect = document.querySelector("#type-select");
const chordNameContainer = document.querySelector("#chord-name");
const chordTones = document.querySelector("#chord-tones");
const playBtn = document.querySelector("#play-btn");
const speedSlider = document.querySelector("#speed");

let chordSequence;
let stringsData;

const guitar = new Tone.Sampler({
	urls: {
		E2: "open-e2.mp3",
		A2: "open-a2.mp3",
		D3: "open-d3.mp3",
		G3: "open-g3.mp3",
		B3: "open-b3.mp3",
		E4: "open-e4.mp3",
	},
	baseUrl: "/assets/audio/",
	onload: () => {
		console.log("loaded");
	},
});

const reverb = new Tone.Reverb({
	decay: 0.2,
});
guitar.connect(reverb);
reverb.toDestination();

NOTES.forEach((note) => {
	noteSelect.innerHTML += `<option id=${note}>${note.replace(
		"b",
		"&#9837",
	)}</option>`;
});

TYPES.forEach((type) => {
	typeSelect.innerHTML += `<option id=${type.value}>${type.label}</option>`;
});

const createFretboard = (fretPositions) => {
	chart.innerHTML = "";
	const highest = Math.max(...fretPositions, 5);
	const frets = [0];
	for (let i = 4; frets.length < 6; i--) {
		frets.push(highest - i);
	}
	frets.forEach((fret, i) => {
		const fretEl = document.createElement("div");
		fretEl.id = `fret-${fret}`;
		fretEl.classList.add("fret");
		fretEl.innerHTML += STRINGS.map(
			(string) => `<div id='pos-${fret}-${string}' class='position'></div>`,
		).join("");
		if (DOTS.includes(fret)) {
			if (fret === 12) {
				const dots = document.createElement("div");
				dots.classList.add("double-dot");
				const dot1 = document.createElement("span");
				const dot2 = document.createElement("span");
				dot1.classList.add("dot");
				dot2.classList.add("dot");
				dots.append(dot1, dot2);
				fretEl.prepend(dots);
			} else {
				const dot = document.createElement("span");
				dot.classList.add("dot");
				dot.id = `fret-${fret}-dot`;
				fretEl.prepend(dot);
			}
		}
		if (i === 1 && fret !== 1) {
			const fretNumber = document.createElement("span");
			fretNumber.classList.add("fret-number");
			fretNumber.innerHTML = `fret ${fret}`;
			fretNumber.id = "fret-number";
			fretEl.prepend(fretNumber);
		}
		if (i === 0 && frets[1] === 1) {
			fretEl.classList.add("open-fret");
		}
		chart.append(fretEl);
	});
	return frets;
};

const createChordInfo = (chordData) => {
	const { chordName, tones } = chordData;
	const formattedName = chordName.replaceAll(",", " ").replace("b", "&#9837");
	const formattedTones = tones.replaceAll(",", " - ").replaceAll("b", "&#9837");
	chordNameContainer.innerHTML = `Chord name: ${formattedName}`;
	chordTones.innerHTML = `Notes: ${formattedTones}`;
};

const groupByFingerPosition = (positions) => {
	const groups = {};
	positions.forEach((pos) => {
		const { finger } = pos;
		if (parseInt(finger)) {
			if (!groups[finger]) {
				groups[finger] = [];
			}
			groups[finger].push(pos);
		}
	});
	return Object.values(groups).filter((group) => group.length > 1);
};

const createBarre = (positions) => {
	const strings = positions.map((p) => STRINGS.indexOf(p.string));
	const start = Math.min(...strings);
	const end = Math.max(...strings);
	const pos = document.querySelector(
		`#pos-${positions[0].fret}-${positions[0].string}`,
	);
	const length = end - start + 1;
	const barre = document.createElement("span");
	barre.classList.add("barre", `barre-${length}`);
	barre.innerHTML = positions[0].finger;
	pos.append(barre);
};

const getChordSequence = (stringsArray) => {
	const speed = 1 / speedSlider.value;
	if (chordSequence) {
		chordSequence.dispose();
	}
	const audioTones = [];
	for (let i = 0; i < stringsArray.length; i++) {
		if (stringsArray[i] !== "X") {
			audioTones.push(ALL_TONES[i][stringsArray[i]]);
		}
	}
	chordSequence = new Tone.Sequence(
		function (time, note) {
			console.log("in sequence", note);
			guitar.triggerAttackRelease(note, "1n", time);
		},
		audioTones,
		speed,
	).start(0);
	chordSequence.humanize = true;
	chordSequence.humanizeAmount = 0.5;
	chordSequence.loop = false;
	console.log("tones", audioTones);
};

const getChord = async () => {
	const note = NOTES[noteSelect.selectedIndex];
	const type = TYPES[typeSelect.selectedIndex].value;
	const url = `${BASE_URL}${note}${type}`;
	const response = await fetch(url);
	const [chord] = await response.json();

	const { fingering, strings } = chord;
	const fingeringArray = fingering.split(" ").map((el) => parseInt(el) || el);
	stringsData = strings.split(" ").map((el) => parseInt(el) || el);
	getChordSequence(stringsData);
	// createChordInfo(chord);
	chartContainer.classList.remove("hidden");

	const frets = createFretboard(stringsData.filter((s) => parseInt(s)));
	const positions = stringsData.map((el, i) => ({
		finger: fingeringArray[i],
		string: STRINGS[i],
		fret: el,
	}));

	const groups = groupByFingerPosition(positions);
	groups.forEach((group) => createBarre(group));

	positions.forEach((pos) => {
		let fretboardPosition = document.querySelector(
			`#pos-${pos.fret}-${pos.string}`,
		);
		if (fretboardPosition) {
			const marker = document.createElement("span");
			marker.innerHTML = pos.finger === "X" ? "O" : pos.finger;
			marker.id = `finger-${pos.finger}`;
			marker.classList.add("marker");
			fretboardPosition.append(marker);
		} else {
			fretboardPosition = document.querySelector(`#pos-0-${pos.string}`);
			const marker = document.createElement("span");
			marker.innerHTML = "X";
			marker.id = `finger-${pos.finger}`;
			marker.classList.add("mute");
			fretboardPosition.append(marker);
		}
	});
};

speedSlider.addEventListener("change", () => {
	getChordSequence(stringsData);
});

playBtn.addEventListener("click", () => {
	Tone.Transport.stop();
	if (Tone.context.data !== "running") {
		Tone.start();
	}
	Tone.Transport.start();
});

noteSelect.addEventListener("change", getChord);
typeSelect.addEventListener("change", getChord);
getChord();
