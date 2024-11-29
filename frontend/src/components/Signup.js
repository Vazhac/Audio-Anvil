import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        // Frontend Validation
        if (!formData.username || !formData.email || !formData.password) {
            setError("All fields are required.");
            return;
        }

        if (!validateEmail(formData.email)) {
            setError("Invalid email address.");
            return;
        }

        if (!validatePassword(formData.password)) {
            setError("Password must be at least 8 characters long.");
            return;
        }

        try {
            // Send data to the backend
            const response = await axios.post("/api/auth/signup", formData);
            setMessage(response.data.message); // Success message from the server
        } catch (error) {
            // Handle errors from the server
            setError(error.response?.data?.message || "Error signing up. Please try again.");
        }
    };

    const validateEmail = (email) => {
        const emailRegex = /^[\w.-]+@[\w.-]+\.\w+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password) => {
        return password.length >= 8; // Minimum password length
    };

    return (
        <div className="signup-container">
            <h2>Signup</h2>
            <form onSubmit={handleSubmit} className="signup-form">
                <label>Username:</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    required
                />

                <label>Email:</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                />

                <label>Password:</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter a strong password"
                    required
                />

                <button type="submit">Signup</button>
            </form>

            {message && <p className="success-message">{message}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default Signup;
