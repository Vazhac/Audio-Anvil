// components/Home.js
import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="welcome-section">
                <h1 className="welcome-title">🎵 Welcome to AudioAnvil 🎵</h1>
                <p className="welcome-message">
                    {user
                        ? `Hey, ${user}! Ready to create your next masterpiece?`
                        : "Unleash your creativity and start crafting amazing songs today!"}
                </p>
            </div>

            <div className="action-section">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <button className="action-button" onClick={() => navigate("/generateLyrics")}>
                        Generate Lyrics
                    </button>
                    <button className="action-button" onClick={() => navigate("/lyrics/history")}>
                        View History
                    </button>
                    <button className="action-button" onClick={() => navigate("/songs")}>
                        Manage Songs
                    </button>
                    <button className="action-button" onClick={() => navigate("/profile")}>
                        Edit Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Home;
