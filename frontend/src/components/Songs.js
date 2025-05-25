import React, {useState, useEffect} from "react";
import axios from "axios";
import "./Songs.css";

const Songs = ({token}) => {
    const [songs, setSongs] = useState([]);
    const [newSong, setNewSong] = useState({title: "", lyrics: ""});
    const [selectedSong, setSelectedSong] = useState(null);
    const [error, setError] = useState("");
// Fetch songs
    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await axios.get("/api/songs/list", {
                    headers: {Authorization: `Bearer ${token}`},
                });
                setSongs(response.data);
            } catch (error) {
                setError(error.response?.data?.error || "Failed to fetch songs.");
            }
        };
        fetchSongs();
    }, [token]);

// Create a new song
    const handleCreateSong = async () => {
        try {
            const response = await axios.post(
                "/api/songs/create",
                newSong,
                {headers: {Authorization: `Bearer ${token}`}}
            );
            setSongs([...songs, {id: response.data.id, ...newSong}]);
            setNewSong({title: "", lyrics: ""});
        } catch (error) {
            setError(error.response?.data?.error || "Failed to create song.");
        }
    };

// Generate chord progressions for a song
    const handleGenerateChords = async (songId) => {
        try {
            const response = await axios.post(
                "/api/songs/generate_chords",
                {theme: "general", mood: "neutral"},
                {headers: {Authorization: `Bearer ${token}`}}
            );
            const updatedSong = {
                ...selectedSong,
                chord_progressions: response.data.chords,
            };
            await axios.put(`/api/songs/${songId}`, updatedSong, {
                headers: {Authorization: `Bearer ${token}`},
            });
            setSelectedSong(updatedSong);
            setSongs((prevSongs) =>
                prevSongs.map((song) =>
                    song.id === songId ? {...song, ...updatedSong} : song
                )
            );
        } catch (error) {
            setError(error.response?.data?.error || "Failed to generate chords.");
        }
    };

    return (
        <div className="songs-container">
            <h2>My Songs</h2>
            {error && <p className="error-message">{error}</p>}
            <div className="create-song-form">
                <input
                    type="text"
                    placeholder="Song Title"
                    value={newSong.title}
                    onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                />
                <textarea
                    placeholder="Song Lyrics"
                    value={newSong.lyrics}
                    onChange={(e) => setNewSong({...newSong, lyrics: e.target.value})}
                />
                <button onClick={handleCreateSong}>Create Song</button>
            </div>
            <ul className="songs-list">
                {songs.map((song) => (
                    <li
                        key={song.id}
                        onClick={() => setSelectedSong(song)}
                        className={selectedSong?.id === song.id ? "selected" : ""}
                    >
                        <h3>{song.title}</h3>
                        <p>{song.lyrics}</p>
                        {song.chord_progressions && (
                            <p>Chords: {song.chord_progressions.join(" - ")}</p>
                        )}
                        <button onClick={() => handleGenerateChords(song.id)}>
                            Generate Chords
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};
export default Songs;