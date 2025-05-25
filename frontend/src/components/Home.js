import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div className="welcome-section animated-fade-in">
                <h1 className="welcome-title">🎵 Welcome to AudioAnvil 🎵</h1>
                <p className="welcome-message">
                    {user && user.username
                        ? `Hey, ${user.username}! Ready to create your next masterpiece?`
                        : "Unleash your creativity and start crafting amazing songs today!"}
                </p>
            </div>

            {user ? (
                <div className="dashboard-intro animated-fade-in">
                    <h2>Your Creative Dashboard</h2>
                    <p>
                        Explore powerful AI-driven tools to generate chords, write lyrics,
                        and produce your own music effortlessly.
                    </p>
                    <div>
                        <button
                            className="primary-button"
                            onClick={() => navigate("/chords")}
                            style={{ marginRight: "15px" }}
                        >
                            Generate Chords
                        </button>
                        <button
                            className="primary-button"
                            onClick={() => navigate("/lyrics")}
                            style={{ marginRight: "15px" }}
                        >
                            Generate Lyrics
                        </button>
                        <button className="primary-button" onClick={() => navigate("/songs")}>
                            Manage Songs
                        </button>
                    </div>
                </div>
            ) : (
                <div className="login-prompt animated-fade-in">
                    <h2>Join AudioAnvil Today</h2>
                    <p>
                        Sign up now to access creative features like chord generation,
                        lyric writing, and song management.
                    </p>
                    <div className="auth-buttons">
                        <button
                            className="primary-button"
                            onClick={() => navigate("/signup")}
                            style={{ marginRight: "15px" }}
                        >
                            Sign Up
                        </button>
                        <button className="secondary-button" onClick={() => navigate("/login")}>
                            Log In
                        </button>
                    </div>
                    <div className="feature-preview">
                        <h3>What You Can Create</h3>
                        <ul>
                            <li>AI-generated chord progressions tailored to your mood</li>
                            <li>Custom lyrics crafted by advanced language models</li>
                            <li>Organize and manage your songs in one place</li>
                            <li>Export your creations as MIDI files and audio stems</li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;