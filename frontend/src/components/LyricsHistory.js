import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import EditLyrics from "./EditLyrics";
import "./LyricsHistory.css";

const LyricsHistory = ({ token }) => {
    const [history, setHistory] = useState({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchLyricsHistory = async () => {
            setLoading(true);
            setErrorMessage("");

            try {
                const response = await apiClient.get("/lyrics/history", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setHistory(response.data.history || {});
            } catch (error) {
                console.error("Error fetching lyrics history:", error);
                setErrorMessage(
                    error.response?.data?.error || "Failed to fetch lyrics history."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLyricsHistory();
    }, [token]);

    const handleDelete = async (id) => {
        try {
            await apiClient.delete(`/lyrics/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Remove deleted item from the state
            setHistory((prev) => {
                const newHistory = { ...prev };
                for (const theme in newHistory) {
                    newHistory[theme] = newHistory[theme].filter((item) => item.id !== id);
                    if (newHistory[theme].length === 0) {
                        delete newHistory[theme];
                    }
                }
                return newHistory;
            });
        } catch (error) {
            console.error("Error deleting lyrics:", error);
            setErrorMessage(
                error.response?.data?.error || "Failed to delete lyrics. Please try again."
            );
        }
    };

    return (
        <div className="lyrics-history-container">
            <h2>Your Lyrics History</h2>

            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {loading ? (
                <p>Loading your lyrics...</p>
            ) : Object.keys(history).length === 0 ? (
                <p>No lyrics found. Start creating your song!</p>
            ) : (
                <div className="lyrics-history-list">
                    {Object.entries(history).map(([theme, entries]) => (
                        <div key={theme} className="lyrics-history-group">
                            <h3>{theme}</h3>
                            <ul>
                                {entries.map((entry) => (
                                    <li key={entry.id} className="lyrics-history-item">
                                        <EditLyrics
                                            initialLyrics={entry.lyrics}
                                            metadata={entry.metadata}
                                            lyricsId={entry.id}
                                            token={token}
                                            onSave={(updatedLyrics) => {
                                                // Update the specific entry with edited lyrics
                                                setHistory((prev) => {
                                                    const newHistory = { ...prev };
                                                    newHistory[theme] = newHistory[theme].map((item) =>
                                                        item.id === entry.id
                                                            ? { ...item, lyrics: updatedLyrics }
                                                            : item
                                                    );
                                                    return newHistory;
                                                });
                                            }}
                                        />
                                        <button
                                            className="delete-button"
                                            onClick={() => handleDelete(entry.id)}
                                        >
                                            Delete
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LyricsHistory;