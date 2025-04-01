// src/components/Home.js
import React from "react";
import "./Home.css";
import MidiIntegration from "./MidiIntegration";

const Home = ({ user }) => {
    return (
        <div className="home-container">
            <div className="welcome-section">
                <h1 className="welcome-title">🎵 Welcome to AudioAnvil 🎵</h1>
                <p className="welcome-message">
                    {user && user.username
                        ? `Hey, ${user.username}! Ready to create your next masterpiece?`
                        : "Unleash your creativity and start crafting amazing songs today!"}
                </p>
            </div>
            {/* Insert MIDI & Audio Integration Section */}
            <MidiIntegration />

        </div>
    );
};

export default Home;
