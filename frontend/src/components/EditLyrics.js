import React, { useState } from "react";
import apiClient from "../utils/apiClient";
import "./EditLyrics.css";

const EditLyrics = ({ initialLyrics, metadata, lyricsId, token, onSave }) => {
    const [lyrics, setLyrics] = useState(initialLyrics);
    const [isEditing, setIsEditing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        setLyrics(e.target.value);
    };

    const handleSave = async () => {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await apiClient.put(
                `/lyrics/${lyricsId}`,
                { lyrics },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccessMessage("Lyrics saved successfully!");
            setIsEditing(false);
            onSave && onSave(response.data.updatedLyrics); // Notify parent component
        } catch (error) {
            console.error("Error saving lyrics:", error);
            setErrorMessage(
                error.response?.data?.error || "Failed to save lyrics. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setLyrics(initialLyrics); // Reset lyrics to initial state
        setIsEditing(false);
    };

    return (
        <div className="edit-lyrics-container">
            <h2>Edit Your Lyrics</h2>
            {metadata && (
                <div className="metadata-info">
                    <p><strong>Theme:</strong> {metadata.theme}</p>
                    <p><strong>Mood:</strong> {metadata.mood}</p>
                    <p><strong>Genre:</strong> {metadata.genre}</p>
                </div>
            )}
            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            {isEditing ? (
                <div className="editor">
                    <textarea
                        value={lyrics}
                        onChange={handleInputChange}
                        rows="10"
                        className="lyrics-textarea"
                    />
                    <div className="editor-actions">
                        <button onClick={handleSave} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </button>
                        <button onClick={handleCancel} className="cancel-button">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="lyrics-preview">
                    <pre>{lyrics}</pre>
                    <button onClick={() => setIsEditing(true)} className="edit-button">
                        Edit Lyrics
                    </button>
                </div>
            )}
        </div>
    );
};

export default EditLyrics;
