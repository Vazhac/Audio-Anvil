from flask import Blueprint, request, jsonify

chords_bp = Blueprint("chords", __name__)


@chords_bp.route("/", methods=["POST"])
def suggest_chords():
    data = request.json
    key = data.get("key", "C").upper()
    mood = data.get("mood", "happy").lower()
    genre = data.get("genre", "general").lower()

    progressions = {
        "general": {
            "happy": {
                "C": [["C", "G", "Am", "F"], ["C", "F", "G", "C"]],
                "C#": [["C#", "G#", "A#m", "F#"], ["C#", "F#", "G#", "C#"]],
                "D": [["D", "A", "Bm", "G"], ["D", "G", "A", "D"]],
                "D#": [["D#", "A#", "Cm", "G#"], ["D#", "G#", "A#", "D#"]],
                "E": [["E", "B", "C#m", "A"], ["E", "A", "B", "E"]],
                "F": [["F", "C", "Dm", "Bb"], ["F", "Bb", "C", "F"]],
                "F#": [["F#", "C#", "D#m", "B"], ["F#", "B", "C#", "F#"]],
                "G": [["G", "D", "Em", "C"], ["G", "C", "D", "G"]],
                "G#": [["G#", "D#", "Fm", "C#"], ["G#", "C#", "D#", "G#"]],
                "A": [["A", "E", "F#m", "D"], ["A", "D", "E", "A"]],
                "A#": [["A#", "F", "Gm", "D#"], ["A#", "D#", "F", "A#"]],
                "B": [["B", "F#", "G#m", "E"], ["B", "E", "F#", "B"]],
                "Bb": [["Bb", "F", "Gm", "Eb"], ["Bb", "Eb", "F", "Bb"]],
                "Eb": [["Eb", "Bb", "Cm", "Ab"], ["Eb", "Ab", "Bb", "Eb"]],
            },
            "sad": {
                "C": [["Am", "F", "C", "G"], ["C", "G", "F", "Am"]],
                "C#": [["A#m", "F#", "C#", "G#"], ["C#", "G#", "F#", "A#m"]],
                "D": [["Bm", "G", "D", "A"], ["D", "A", "G", "Bm"]],
                "D#": [["Cm", "G#", "D#", "A#"], ["D#", "A#", "G#", "Cm"]],
                "E": [["C#m", "A", "E", "B"], ["E", "B", "A", "C#m"]],
                "F": [["Dm", "Bb", "F", "C"], ["F", "C", "Bb", "Dm"]],
                "F#": [["D#m", "B", "F#", "C#"], ["F#", "C#", "B", "D#m"]],
                "G": [["Em", "C", "G", "D"], ["G", "D", "C", "Em"]],
                "G#": [["Fm", "C#", "G#", "D#"], ["G#", "D#", "C#", "Fm"]],
                "A": [["F#m", "D", "A", "E"], ["A", "E", "D", "F#m"]],
                "A#": [["Gm", "D#", "A#", "F"], ["A#", "F", "D#", "Gm"]],
                "B": [["G#m", "E", "B", "F#"], ["B", "F#", "E", "G#m"]],
                "Bb": [["Gm", "Eb", "Bb", "F"], ["Bb", "F", "Eb", "Gm"]],
                "Eb": [["Cm", "Ab", "Eb", "Bb"], ["Eb", "Bb", "Ab", "Cm"]],
            },
            "neutral": {
                "C": [["C", "Am", "F", "G"], ["F", "C", "G", "Am"]],
                "C#": [["C#", "A#m", "F#", "G#"], ["F#", "C#", "G#", "A#m"]],
                "D": [["D", "Bm", "G", "A"], ["G", "D", "A", "Bm"]],
                "D#": [["D#", "Cm", "G#", "A#"], ["G#", "D#", "A#", "Cm"]],
                "E": [["E", "C#m", "A", "B"], ["A", "E", "B", "C#m"]],
                "F": [["F", "Dm", "Bb", "C"], ["Bb", "F", "C", "Dm"]],
                "F#": [["F#", "D#m", "B", "C#"], ["B", "F#", "C#", "D#m"]],
                "G": [["G", "Em", "C", "D"], ["C", "G", "D", "Em"]],
                "G#": [["G#", "Fm", "C#", "D#"], ["C#", "G#", "D#", "Fm"]],
                "A": [["A", "F#m", "D", "E"], ["D", "A", "E", "F#m"]],
                "A#": [["A#", "Gm", "D#", "F"], ["D#", "A#", "F", "Gm"]],
                "B": [["B", "G#m", "E", "F#"], ["E", "B", "F#", "G#m"]],
                "Bb": [["Bb", "Gm", "Eb", "F"], ["Eb", "Bb", "F", "Gm"]],
                "Eb": [["Eb", "Cm", "Ab", "Bb"], ["Ab", "Eb", "Bb", "Cm"]],
            },
            "angry": {
                "C": [["C5", "G5", "F5", "E5"], ["C5", "F5", "G5", "C5"]],
                "G": [["G5", "D5", "C5", "B5"], ["G5", "C5", "D5", "G5"]],
            },
            "romantic": {
                "C": [["Cmaj7", "Am7", "Dm7", "G7"], ["Fmaj7", "Em7", "Am7", "Dm7"]],
                "G": [["Gmaj7", "Em7", "Am7", "D7"], ["Cmaj7", "Bm7", "Em7", "Am7"]],
            },
            "excited": {
                "C": [["C", "E7", "F", "G"], ["C", "G", "Am", "F"]],
                "G": [["G", "B7", "C", "D"], ["G", "D", "Em", "C"]],
            },
            "peaceful": {
                "C": [["Cmaj7", "Fmaj7", "Am7", "G7"], ["Fmaj7", "Cmaj7", "G7", "Am7"]],
                "G": [["Gmaj7", "Cmaj7", "Em7", "D7"], ["Cmaj7", "Gmaj7", "D7", "Em7"]],
            },
            "melancholic": {
                "C": [["Am", "F", "C", "G"], ["F", "C", "G", "Am"]],
                "G": [["Em", "C", "G", "D"], ["C", "G", "D", "Em"]],
            },
            "nostalgic": {
                "C": [["C", "Am", "F", "G"], ["Am", "F", "C", "G"]],
                "G": [["G", "Em", "C", "D"], ["Em", "C", "G", "D"]],
            },
            "dark": {
                "C": [["Cm", "Ab", "Bb", "Gm"], ["Gm", "Bb", "Ab", "Cm"]],
                "G": [["Gm", "Eb", "F", "Cm"], ["Cm", "F", "Eb", "Gm"]],
            },
        },
        "pop": {
            "happy": {
                "C": [["C", "Am", "F", "G"], ["F", "G", "C", "Am"]],
                "G": [["G", "Em", "C", "D"], ["C", "D", "G", "Em"]],
            },
            "sad": {
                "C": [["Am", "F", "C", "G"], ["F", "C", "G", "Am"]],
                "G": [["Em", "C", "G", "D"], ["C", "G", "D", "Em"]],
            },
        },
        "rock": {
            "happy": {
                "C": [["C5", "G5", "F5", "G5"], ["C5", "F5", "G5", "C5"]],
                "G": [["G5", "D5", "C5", "D5"], ["G5", "C5", "D5", "G5"]],
            },
            "angry": {
                "C": [["C5", "G5", "F5", "E5"], ["C5", "F5", "G5", "C5"]],
                "G": [["G5", "D5", "C5", "B5"], ["G5", "C5", "D5", "G5"]],
            },
        },
        "jazz": {
            "romantic": {
                "C": [["Cmaj7", "Am7", "Dm7", "G7"], ["Fmaj7", "Em7", "Am7", "Dm7"]],
                "G": [["Gmaj7", "Em7", "Am7", "D7"], ["Cmaj7", "Bm7", "Em7", "Am7"]],
            },
            "peaceful": {
                "C": [["Cmaj7", "Fmaj7", "Am7", "G7"], ["Fmaj7", "Cmaj7", "G7", "Am7"]],
                "G": [["Gmaj7", "Cmaj7", "Em7", "D7"], ["Cmaj7", "Gmaj7", "D7", "Em7"]],
            },
        },
        "blues": {
            "excited": {
                "C": [["C7", "F7", "G7", "C7"], ["C7", "G7", "F7", "C7"]],
                "G": [["G7", "C7", "D7", "G7"], ["G7", "D7", "C7", "G7"]],
            },
        },
        "hiphop": {
            "happy": {
                "C": [["C7", "F7", "G7", "C7"]],
                "G": [["G7", "C7", "D7", "G7"]],
            },
            "sad": {
                "C": [["Am7", "Dm7", "G7", "Cmaj7"]],
                "G": [["Em7", "Am7", "D7", "Gmaj7"]],
            },
            "neutral": {
                "C": [["Cmaj7", "Am7", "Dm7", "G7"]],
                "G": [["Gmaj7", "Em7", "Am7", "D7"]],
            },
        },
        "electronic": {
            "happy": {
                "C": [["C", "G", "Am", "F"]],
                "G": [["G", "D", "Em", "C"]],
            },
            "sad": {
                "C": [["Am", "F", "C", "G"]],
                "G": [["Em", "C", "G", "D"]],
            },
        },
        "metal": {
            "angry": {
                "C": [["C5", "G5", "F5", "E5"]],
                "G": [["G5", "D5", "C5", "B5"]],
            },
        },
        "folk": {
            "happy": {
                "C": [["C", "F", "G", "C"]],
                "G": [["G", "C", "D", "G"]],
            },
        },
        "country": {
            "happy": {
                "C": [["C", "G", "F", "C"]],
                "G": [["G", "D", "C", "G"]],
            },
        },
    }

    genre_progressions = progressions.get(genre, progressions.get("general", {}))
    mood_progressions = genre_progressions.get(mood, {})

    chords = mood_progressions.get(key)

    if not chords:
        if mood_progressions:
            chords = next(iter(mood_progressions.values()))
        else:
            chords = [["C", "G", "Am", "F"]]

    return jsonify({"chords": chords})
