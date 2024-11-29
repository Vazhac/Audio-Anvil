import React, { useState } from "react";
import axios from "axios";
import "./LyricsForm.css";

const LyricsForm = ({ token }) => {
    const [formData, setFormData] = useState({
        theme: "",
        mood: "neutral",
        genre: "general",
        rhyme_scheme: "",
        max_tokens: 200,
        temperature: 0.7,
    });

    const [generatedLyrics, setGeneratedLyrics] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneratedLyrics(null); // Reset lyrics
        setErrorMessage("");
        setLoading(true);

        const { theme, mood, genre, rhyme_scheme, max_tokens, temperature } = formData;

        // Validate inputs
        if (!theme || !mood || !genre) {
            setErrorMessage("Theme, mood, and genre are required fields.");
            setLoading(false);
            return;
        }

        try {
            // Step 1: Generate Lyrics
            const response = await axios.post(
                "/api/lyrics",
                {
                    theme,
                    mood,
                    genre,
                    rhyme_scheme: rhyme_scheme || null,
                    max_tokens: max_tokens || 200,
                    temperature: temperature || 0.7,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.lyrics) {
                const lyrics = response.data.lyrics;

                // Set the generated lyrics
                setGeneratedLyrics(lyrics);

                // Step 2: Save to History
                await axios.post(
                    "/api/lyrics/history",
                    {
                        lyrics,
                        metadata: { theme, mood, genre, rhyme_scheme, max_tokens, temperature },
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                setErrorMessage("No lyrics generated. Please try again.");
            }
        } catch (error) {
            console.error("Error generating lyrics:", error);
            setErrorMessage(
                error.response?.data?.error ||
                "An unexpected error occurred. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lyrics-form-container">
            <h2>Create Your Song Lyrics</h2>
            <form onSubmit={handleSubmit} className="lyrics-form">
                <div className="form-group">
                    <label htmlFor="theme">
                        <strong>Theme</strong>
                        <span className="description">The main topic of your song.</span>
                    </label>
                    <input
                        type="text"
                        id="theme"
                        name="theme"
                        placeholder="E.g., love, adventure, heartbreak"
                        value={formData.theme}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="mood">
                        <strong>Mood</strong>
                        <span className="description">
                            The emotional tone of your lyrics.
                        </span>
                    </label>
                    <select
                        id="mood"
                        name="mood"
                        value={formData.mood}
                        onChange={handleInputChange}
                    >
                        <option value="neutral">Neutral</option>
                        <option value="happy">Happy</option>
                        <option value="sad">Sad</option>
                        <option value="angry">Angry</option>
                        <option value="romantic">Romantic</option>
                        <option value="melancholic">Melancholic</option>
                        <option value="excited">Excited</option>
                        <option value="peaceful">Peaceful</option>
                        <option value="nostalgic">Nostalgic</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="genre">
                        <strong>Genre</strong>
                        <span className="description">
                            The musical style or category of your song.
                        </span>
                    </label>
                    <select
                        id="genre"
                        name="genre"
                        value={formData.genre}
                        onChange={handleInputChange}
                    >
                        <option value="general">General</option>
                        <option value="pop">Pop</option>
                        <option value="rock">Rock</option>
                        <option value="rap">Rap</option>
                        <option value="classical">Classical</option>
                        <option value="jazz">Jazz</option>
                        <option value="blues">Blues</option>
                        <option value="electronic">Electronic</option>
                        <option value="folk">Folk</option>
                        <option value="metal">Metal</option>
                        <option value="country">Country</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="rhyme_scheme">
                        <strong>Rhyme Scheme</strong>
                        <span className="description">
                            The pattern of rhyming in your song (optional).
                        </span>
                    </label>
                    <select
                        id="rhyme_scheme"
                        name="rhyme_scheme"
                        value={formData.rhyme_scheme}
                        onChange={handleInputChange}
                    >
                        <option value="">None</option>
                        <option value="AABB">AABB</option>
                        <option value="ABAB">ABAB</option>
                        <option value="AAAA">AAAA</option>
                        <option value="Free Verse">Free Verse</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="max_tokens">
                        <strong>Maximum Length</strong>
                        <span className="description">
                            The maximum number of tokens for your song. 1 token ≈ 4 characters.
                        </span>
                    </label>
                    <input
                        type="number"
                        id="max_tokens"
                        name="max_tokens"
                        placeholder="E.g., 200 (default), up to 1000"
                        value={formData.max_tokens}
                        onChange={handleInputChange}
                        min="50"
                        max="1000"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="temperature">
                        <strong>Creativity Level</strong>
                        <span className="description">
                            Adjusts randomness in the output. Lower values = more focused; higher = more creative.
                        </span>
                    </label>
                    <input
                        type="range"
                        id="temperature"
                        name="temperature"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.temperature}
                        onChange={handleInputChange}
                    />
                    <span className="temperature-value">{formData.temperature}</span>
                </div>
                {errorMessage && <p className="error-message" style={{ color: "red", fontWeight: "bold" }}>{errorMessage}</p>}
                <button type="submit" className="generate-button" disabled={loading}>
                    {loading ? "Generating..." : "Generate Lyrics"}
                </button>
            </form>
            {generatedLyrics && (
                <div className="lyrics-output">
                    <h3 style={{ color: "#ff6f61" }}>Your Generated Lyrics</h3>
                    <pre style={{ whiteSpace: "pre-wrap", backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "8px" }}>
                        {generatedLyrics}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default LyricsForm;
