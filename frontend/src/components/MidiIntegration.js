// src/components/MidiIntegration.js
import React, { useState } from "react";
import axios from "axios";
import * as Midi from "jsmidgen";
import "./MidiIntegration.css";

const MidiIntegration = () => {
    // State variables for chords, file names, loading and error messages
    const [chordProgression, setChordProgression] = useState(["C", "G", "Am", "F"]);
    const [importedMidiName, setImportedMidiName] = useState("");
    const [audioFileName, setAudioFileName] = useState("");
    const [loading, setLoading] = useState(false);
    const [chordError, setChordError] = useState("");

    // Basic chord mapping: each chord maps to an array of note strings.
    // Extend or modify this map as needed.
    const chordMap = {
        "C": ["C4", "E4", "G4"],
        "G": ["G3", "B3", "D4"],
        "Am": ["A3", "C4", "E4"],
        "F": ["F3", "A3", "C4"],
    };

    // A simple melody sequence to overlay; one note per chord.
    const melodySequence = ["E4", "D4", "F4", "G4"];

    // Helper: Convert a binary string to a Uint8Array.
    const stringToUint8Array = (str) => {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    };

    // Function to generate chord progressions via API with error handling.
    const generateChords = async () => {
        setLoading(true);
        setChordError("");
        try {
            const response = await axios.post("/api/songs/generate_chords", {
                key: "C", // default key; adjust as needed
                mood: "neutral",
            });
            if (response.data && response.data.chords) {
                setChordProgression(response.data.chords);
            } else {
                setChordError("No chords returned from the API.");
            }
        } catch (error) {
            console.error("Error generating chords:", error);
            setChordError(
                error.response?.data?.error ||
                "Failed to generate chords. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Function to generate a MIDI file with synchronized chords, bass, and melody.
    const downloadMidi = () => {
        if (!chordProgression || chordProgression.length === 0) return;

        // Create a new MIDI file.
        const file = new Midi.File();

        // Create three tracks: one for chords, one for bass, and one for melody.
        const chordTrack = new Midi.Track();
        const bassTrack = new Midi.Track();
        const melodyTrack = new Midi.Track();
        file.addTrack(chordTrack);
        file.addTrack(bassTrack);
        file.addTrack(melodyTrack);

        // Define durations:
        // chordDuration: how long each chord is held (in ticks)
        // chordDelayStep: the time between chord start times (set less than chordDuration to create overlap)
        const chordDuration = 256;
        const chordDelayStep = 128; // new chord starts every 128 ticks

        // Iterate over the chord progression.
        chordProgression.forEach((chord, index) => {
            // Calculate the start time (delay) for this chord.
            const delay = index * chordDelayStep;

            // Retrieve chord notes from our mapping.
            const chordNotes = chordMap[chord];
            if (chordNotes && chordNotes.length > 0) {
                // Add each chord note on the chord track.
                chordNotes.forEach((note) => {
                    try {
                        chordTrack.addNote(0, note, chordDuration, delay);
                    } catch (err) {
                        console.error(`Error adding note ${note} for chord "${chord}":`, err);
                    }
                });
            } else {
                // Fallback: sanitize the chord (remove trailing "m") and use a single note.
                const sanitizedChord = chord.replace(/m$/, "");
                try {
                    chordTrack.addNote(0, sanitizedChord + "4", chordDuration, delay);
                } catch (err) {
                    console.error(`Error adding fallback note for chord "${chord}":`, err);
                }
            }

            // Add a bass note on a separate track.
            // Use the root note in a lower octave (e.g., octave 2).
            const root = chord.replace(/m$/, "");
            try {
                bassTrack.addNote(0, root + "2", chordDuration, delay);
            } catch (err) {
                console.error(`Error adding bass note for chord "${chord}":`, err);
            }

            // Add a melody note on the melody track.
            // Offset the melody note slightly (e.g., delay + 32 ticks) for rhythmic variation.
            const melodyNote = melodySequence[index % melodySequence.length];
            try {
                melodyTrack.addNote(0, melodyNote, chordDuration, delay + 32);
            } catch (err) {
                console.error(`Error adding melody note for chord "${chord}":`, err);
            }
        });

        // Generate the MIDI file as a binary string.
        const midiData = file.toBytes();
        const midiArray = stringToUint8Array(midiData);
        const blob = new Blob([midiArray], { type: "audio/midi" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "chord_progression_with_melody.mid";
        a.click();
        URL.revokeObjectURL(url);
    };

    // Function to handle importing a MIDI file.
    const handleMidiImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportedMidiName(file.name);
            // Additional MIDI parsing could be implemented here.
        }
    };

    // Function to handle uploading an audio stem.
    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAudioFileName(file.name);
            // Additional processing can be implemented here.
        }
    };

    return (
        <div className="midi-integration">
            <h2>MIDI & Audio Integration</h2>

            <div className="export-section">
                <h3>Export Chord Progression with Melody as MIDI</h3>
                <p>Current Chords: {chordProgression.join(" - ")}</p>
                <button className="action-button" onClick={downloadMidi}>
                    Download as MIDI
                </button>
                <button className="action-button" onClick={generateChords} disabled={loading}>
                    {loading ? "Generating..." : "Generate Chords"}
                </button>
                {chordError && <p className="error-message">{chordError}</p>}
            </div>

            <div className="import-section">
                <h3>Import a MIDI File</h3>
                <input type="file" accept=".mid,.midi" onChange={handleMidiImport} />
                {importedMidiName && <p>Imported MIDI: {importedMidiName}</p>}
            </div>

            <div className="audio-section">
                <h3>Upload Audio Stem</h3>
                <input type="file" accept="audio/*" onChange={handleAudioUpload} />
                {audioFileName && <p>Uploaded Audio: {audioFileName}</p>}
            </div>
        </div>
    );
};

export default MidiIntegration;
