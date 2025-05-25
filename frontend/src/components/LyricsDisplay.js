import React from "react";
import axios from "axios";

const LyricsDisplay = ({lyrics}) => {
    const exportLyrics = async (format) => {
        try {
            const endpoint =
                format === "txt"
                    ? "http://127.0.0.1:5000/api/lyrics/export-txt/"
                    : "http://127.0.0.1:5000/api/lyrics/export-pdf/";

            const response = await axios.post(endpoint, {lyrics}, {responseType: "blob"});
            const blob = new Blob([response.data]);
            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = format === "txt" ? "lyrics.txt" : "lyrics.pdf";
            link.click();
        } catch (error) {
            alert("Error exporting lyrics: " + error.message);
        }
    };

    return (
        <div className="lyrics-container">
            <h3>Generated Lyrics</h3>
            <pre>{lyrics}</pre>
            <button onClick={() => exportLyrics("txt")}>Export as TXT</button>
            <button onClick={() => exportLyrics("pdf")}>Export as PDF</button>
        </div>
    );
};

export default LyricsDisplay;
