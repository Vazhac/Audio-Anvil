// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home"; // Updated Home includes the new dashboard layout
import LyricsForm from "./components/LyricsForm";
import LyricsHistory from "./components/LyricsHistory";
import Songs from "./components/Songs";
import Profile from "./components/Profile";
import Footer from "./components/Footer";
import Chords from "./components/Chords";

const App = () => {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const handleLogin = (newToken, userInfo) => {
        setToken(newToken);
        setUser(userInfo);
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userInfo));
    };

    const handleLogout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    useEffect(() => {
        console.log("Token updated:", token);
        console.log("User updated:", user);
    }, [token, user]);

    return (
        <Router>
            <Navbar token={token} handleLogout={handleLogout} user={user} />
            <Routes>
                {/* Home route renders the updated dashboard from Home.js */}
                <Route path="/" element={<Home token={token} user={user} />} />
                <Route path="/chords" element={<Chords />} />
                <Route path="/lyrics" element={<LyricsForm token={token} />} />
                <Route path="/login" element={<Login handleLogin={handleLogin} />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/lyrics/history" element={<LyricsHistory token={token} />} />
                <Route path="/songs" element={<Songs token={token} />} />
                <Route path="/profile" element={<Profile token={token} user={user} />} />
            </Routes>
            <Footer />
        </Router>
    );
};

export default App;
