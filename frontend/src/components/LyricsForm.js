import React, { useState } from "react";
import axios from "axios";

const LyricsForm = ({ setLyrics }) => {
    const [formData, setFormData] = useState({
        theme: "",
        mood: "",
        genre: "",
        max_tokens: 200,
        temperature: 0.7,
        rhyme_scheme: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("/api/lyrics/", formData);
            setLyrics(response.data.lyrics);
        } catch (error) {
            alert("Error generating lyrics: " + error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Generate Lyrics</h2>
            <label>Theme:</label>
            <input type="text" name="theme" value={formData.theme} onChange={handleChange} />

            <label>Mood:</label>
            <input type="text" name="mood" value={formData.mood} onChange={handleChange} />

            <label>Genre:</label>
            <input type="text" name="genre" value={formData.genre} onChange={handleChange} />

            <label>Max Tokens:</label>
            <input
                type="number"
                name="max_tokens"
                value={formData.max_tokens}
                onChange={handleChange}
            />

            <label>Temperature:</label>
            <input
                type="number"
                step="0.1"
                name="temperature"
                value={formData.temperature}
                onChange={handleChange}
            />

            <label>Rhyme Scheme (Optional):</label>
            <input
                type="text"
                name="rhyme_scheme"
                value={formData.rhyme_scheme}
                onChange={handleChange}
            />

            <button type="submit">Generate</button>
        </form>
    );
};

export default LyricsForm;
