import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "./Login.css";

const Login = ({handleLogin}) => {
    const [identifier, setIdentifier] = useState(""); // Use for both username and email
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!identifier || !password) {
            setError("Both username/email and password are required.");
            return;
        }

        try {
            const response = await axios.post("/api/auth/login", {
                username: identifier.toLowerCase(), // normalize to lowercase
                password,
            });

            console.log("Login successful:", response.data);

            const {access_token, user} = response.data;

            // Pass tokens and user info to parent handler
            handleLogin(access_token, user);

            // Redirect to home page
            navigate("/");
        } catch (err) {
            console.error("Login error:", err);

            // Handle different error cases
            if (err.response) {
                console.error("Error response data:", err.response.data);
                const errorMessage =
                    err.response.data.error || "Invalid username/email or password. Please try again.";
                setError(errorMessage);
            } else if (err.request) {
                setError("No response from the server. Please try again later.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} className="login-form">
                <label>Username/Email:</label>
                <input
                    type="text"
                    placeholder="Enter your username or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className="form-input"
                />
                <label>Password:</label>
                <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                />
                <button type="submit" className="form-button">
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;
