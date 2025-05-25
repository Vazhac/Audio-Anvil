import React, {useState, useEffect} from "react";
import axios from "axios";
import {File, Track} from "jsmidgen";
import "./Chords.css";

const TICKS_PER_BEAT = 480; // Define constant here
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHORD_INTERVALS = {
    major: [0, 4, 7],
    minor: [0, 3, 7],
    major7: [0, 4, 7, 11],
    minor7: [0, 3, 7, 10],
    dominant7: [0, 4, 7, 10],
    diminished: [0, 3, 6],
    augmented: [0, 4, 8],
    sus2: [0, 2, 7],
    sus4: [0, 5, 7],
};

function parseChordName(chordName) {
    const regex = /^([A-G]#?b?)(.*)$/;
    const match = chordName.match(regex);
    if (!match) return null;
    const root = match[1];
    let quality = match[2].toLowerCase();
    if (quality === "") quality = "major";
    else if (quality === "m") quality = "minor";
    else if (quality === "maj7") quality = "major7";
    else if (quality === "7") quality = "dominant7";

    return {root, quality};
}

function generateChordNotes(root, quality = "major", octave = 4) {
    const rootIndex = NOTE_NAMES.indexOf(root);
    if (rootIndex === -1) return [];
    const intervals = CHORD_INTERVALS[quality];
    if (!intervals) return [];

    return intervals.map(interval => {
        const noteIndex = (rootIndex + interval) % 12;
        const noteOctave = octave + Math.floor((rootIndex + interval) / 12);
        return NOTE_NAMES[noteIndex] + noteOctave;
    });
}

function invertChord(notes, inversion = 0) {
    const inverted = [...notes];
    for (let i = 0; i < inversion; i++) {
        const note = inverted.shift();
        const pitch = note.slice(0, -1);
        const octave = parseInt(note.slice(-1), 10) + 1;
        inverted.push(pitch + octave);
    }
    return inverted;
}

const stringToUint8Array = (str) => {
    const arr = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i);
    }
    return arr;
};
const Chords = () => {
    const [key, setKey] = useState("C");
    const [mood, setMood] = useState("happy");
    const [genre, setGenre] = useState("general");
    const [chordProgression, setChordProgression] = useState([]);
    const [loading, setLoading] = useState(false);
    const [chordError, setChordError] = useState("");
    const [fallbackUsed, setFallbackUsed] = useState(false);
    const [fallbackInfo, setFallbackInfo] = useState("");
    const [importedMidiName, setImportedMidiName] = useState("");
    const [audioFileName, setAudioFileName] = useState("");
    const melodySequence = ["E4", "D4", "F4", "G4"];
    const generateChords = async (keyParam = key, moodParam = mood, genreParam = genre) => {
        setLoading(true);
        setChordError("");
        setFallbackUsed(false);
        setFallbackInfo("");
        try {
            const response = await axios.post("/api/chords/", {key: keyParam, mood: moodParam, genre: genreParam});
            if (response.data && Array.isArray(response.data.chords) && response.data.chords.length > 0) {
                setChordProgression(response.data.chords[0]);
                const requestedKey = keyParam.toUpperCase();
                const firstChordRoot = parseChordName(response.data.chords[0][0])?.root.toUpperCase();
                if (firstChordRoot && firstChordRoot !== requestedKey) {
                    setFallbackUsed(true);
                    setFallbackInfo(`No progression found for key "${requestedKey}". Showing progression for key "${firstChordRoot}" instead.`);
                }
            } else {
                setChordError("No chord progression returned from the API.");
                setChordProgression([]);
            }
        } catch (error) {
            setChordError(error.response?.data?.error || "Failed to generate chords. Please try again.");
            setChordProgression([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateChords(key, mood, genre);
    }, [key, mood, genre]);

    const downloadMidi = () => {
        if (!chordProgression || chordProgression.length === 0) return;

        const BEATS_PER_BAR = 4;    // assuming 4/4 time
        const TICKS_PER_BAR = TICKS_PER_BEAT * BEATS_PER_BAR;

        const file = new File();
        file.header.setTicksPerBeat(TICKS_PER_BEAT);

        const chordTrack = new Track();
        const bassTrack = new Track();
        const melodyTrack = new Track();
        file.addTrack(chordTrack);
        file.addTrack(bassTrack);
        file.addTrack(melodyTrack);

        const bars = 8; // fixed length
        const chordsPerBar = 1; // one chord per bar
        const totalChords = bars * chordsPerBar;

        const velocity = 100;

        // Rhythmic pattern for melody (in ticks)
        const melodyRhythm = [TICKS_PER_BEAT, TICKS_PER_BEAT / 2, TICKS_PER_BEAT / 2, TICKS_PER_BEAT];

        // Scale notes for passing tones (C major scale example)
        const scaleNotes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

        for (let i = 0; i < totalChords; i++) {
            const chordName = chordProgression[i % chordProgression.length];
            const baseDelay = i * TICKS_PER_BAR;

            const parsed = parseChordName(chordName);
            if (!parsed) {
                console.warn(`Skipping invalid chord name: ${chordName}`);
                continue;
            }

            let chordNotes = generateChordNotes(parsed.root, parsed.quality, 4);
            chordNotes = invertChord(chordNotes, i % chordNotes.length);

            // Arpeggiated chord notes with rhythmic variation
            let tickCursor = baseDelay;
            chordNotes.forEach((note, idx) => {
                const duration = melodyRhythm[idx % melodyRhythm.length];
                chordTrack.addNote(0, note, duration, tickCursor, velocity);
                tickCursor += duration;
            });

            // Bass note on root, whole bar duration
            bassTrack.addNote(0, parsed.root + "2", TICKS_PER_BAR, baseDelay, velocity);

            // Melody motif using chord tones and passing scale notes
            let melodyTick = baseDelay + TICKS_PER_BEAT / 2;
            for (let j = 0; j < 4; j++) {
                const isChordTone = j % 2 === 0;
                let note;
                if (isChordTone) {
                    note = chordNotes[j % chordNotes.length];
                } else {
                    const rootIndex = scaleNotes.indexOf(parsed.root + "4");
                    if (rootIndex === -1) {
                        note = scaleNotes[0];
                    } else {
                        note = scaleNotes[rootIndex + (j % 2 === 0 ? 1 : -1)] || scaleNotes[rootIndex];
                    }
                }
                const duration = melodyRhythm[j % melodyRhythm.length];
                melodyTrack.addNote(0, note, duration, melodyTick, velocity - 20);
                melodyTick += duration;
            }
        }

        const midiData = file.toBytes();
        const midiArray = stringToUint8Array(midiData);
        const blob = new Blob([midiArray], {type: "audio/midi"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "melodic_chord_progression_8bars.mid";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleMidiImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportedMidiName(file.name);
            // TODO: Implement MIDI parsing if needed
        }
    };

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFileName(file.name);
            // TODO: Implement audio processing if needed
        }
    };

    return (
        <div className="midi-integration">
            <h2>MIDI & Audio Integration</h2>

            <div className="export-section">
                <h3>Export Chord Progression with Melody as MIDI</h3>

                <div style={{marginBottom: "10px"}}>
                    <label htmlFor="key-select">Select Key: </label>
                    <select id="key-select" value={key} onChange={e => setKey(e.target.value)} disabled={loading}>
                        <option value="C">C</option>
                        <option value="C#">C# / Db</option>
                        <option value="D">D</option>
                        <option value="D#">D# / Eb</option>
                        <option value="E">E</option>
                        <option value="F">F</option>
                        <option value="F#">F# / Gb</option>
                        <option value="G">G</option>
                        <option value="G#">G# / Ab</option>
                        <option value="A">A</option>
                        <option value="A#">A# / Bb</option>
                        <option value="B">B</option>
                        <option value="Bb">Bb</option>
                        <option value="Eb">Eb</option>
                    </select>

                    <label htmlFor="mood-select" style={{marginLeft: "20px"}}>Select Mood: </label>
                    <select id="mood-select" value={mood} onChange={e => setMood(e.target.value)} disabled={loading}>
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="neutral">Neutral</option>
                        <option value="angry">Angry</option>
                        <option value="romantic">Romantic</option>
                        <option value="excited">Excited</option>
                        <option value="peaceful">Peaceful</option>
                        <option value="melancholic">Melancholic</option>
                        <option value="nostalgic">Nostalgic</option>
                        <option value="dark">Dark</option>
                    </select>

                    <label htmlFor="genre-select" style={{marginLeft: "20px"}}>Select Genre: </label>
                    <select id="genre-select" value={genre} onChange={e => setGenre(e.target.value)} disabled={loading}>
                        <option value="general">General</option>
                        <option value="pop">Pop</option>
                        <option value="rock">Rock</option>
                        <option value="jazz">Jazz</option>
                        <option value="blues">Blues</option>
                        <option value="country">Country</option>
                        <option value="folk">Folk</option>
                        <option value="metal">Metal</option>
                        <option value="hiphop">Hip Hop</option>
                        <option value="electronic">Electronic</option>
                    </select>

                    <button
                        className="action-button"
                        onClick={() => generateChords(key, mood, genre)}
                        disabled={loading}
                        style={{marginLeft: "20px"}}
                    >
                        {loading ? "Generating..." : "Generate Chords"}
                    </button>
                </div>

                {fallbackUsed && (
                    <div className="fallback-warning" style={{
                        marginTop: "10px",
                        color: "#b35c00",
                        backgroundColor: "#fff4e5",
                        padding: "10px",
                        borderRadius: "6px"
                    }}>
                        {fallbackInfo}
                    </div>
                )}

                <h4>Current Chord Progression:</h4>
                {chordProgression.length > 0 ? (
                    <div className="chord-list">
                        {chordProgression.map((chord, idx) => (
                            <span key={idx} className="chord-badge">{chord}</span>
                        ))}
                    </div>
                ) : (
                    <p>No chords available</p>
                )}

                <button
                    className="action-button"
                    onClick={downloadMidi}
                    disabled={chordProgression.length === 0}
                    style={{marginTop: "10px"}}
                >
                    Download as MIDI
                </button>
            </div>

            <div className="notes-section" style={{
                marginTop: "30px",
                padding: "15px",
                backgroundColor: "#fff4f2",
                borderRadius: "8px",
                color: "#333"
            }}>
                <h3>Helpful Notes for Generating Chords</h3>
                <ul>
                    <li><strong>Keys:</strong> Choose a key that fits the vocal range or mood of your song. Common keys
                        like C, G, and D are easier to play on guitar and piano.
                    </li>
                    <li><strong>Moods:</strong> Select a mood that matches the emotional tone you want. For example,
                        "happy" keys often use major chords, while "sad" moods lean towards minor chords.
                    </li>
                    <li><strong>Genres:</strong> Different genres have characteristic chord progressions. For example,
                        blues often uses dominant 7th chords, jazz uses complex chords like major7 and minor7, and pop
                        tends to use simple major/minor progressions.
                    </li>
                    <li><strong>Experiment:</strong> Try different combinations to find unique progressions that inspire
                        your creativity.
                    </li>
                    <li><strong>Limitations:</strong> The backend currently supports a limited set of keys and moods. If
                        you select unsupported options, you may get no progressions.
                    </li>
                </ul>
            </div>

            <div className="import-section" style={{marginTop: "30px"}}>
                <h3>Import a MIDI File</h3>
                <input type="file" accept=".mid,.midi" onChange={handleMidiImport}/>
                {importedMidiName && <p>Imported MIDI: {importedMidiName}</p>}
            </div>

            <div className="audio-section" style={{marginTop: "30px"}}>
                <h3>Upload Audio Stem</h3>
                <input type="file" accept="audio/*" onChange={handleAudioUpload}/>
                {audioFileName && <p>Uploaded Audio: {audioFileName}</p>}
            </div>
        </div>
    );
};
export default Chords;