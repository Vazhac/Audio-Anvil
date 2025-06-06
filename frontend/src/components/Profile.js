// components/Profile.js
import React, { useState } from "react";
import "./Profile.css";
import apiClient from "../utils/apiClient";

const ProfileImage = ({ profileImage, username }) => {
    // Use the backend URL from environment variables
    const backendURL = process.env.REACT_APP_BACKEND_URL || "";
    const defaultImageUrl = `${backendURL}/api/user/default_avatar/${username}`;
    const src = profileImage || defaultImageUrl;

    return (
        <img
            src={src}
            alt="Profile"
            className="profile-image"
            onError={(e) => {
                e.target.onerror = null; // Prevent infinite error loop
                e.target.src = defaultImageUrl; // Fallback to default generated image
            }}
        />
    );
};

const Profile = ({ user, token, refreshToken, handleLogout }) => {
    const [username, setUsername] = useState(user?.username || "User");
    const [email, setEmail] = useState(user?.email || "user@example.com");
    const [password, setPassword] = useState("");
    const [profileImage, setProfileImage] = useState(user?.profileImage);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [editingField, setEditingField] = useState(null);

    // Ensure Authorization header is always set
    apiClient.defaults.headers.Authorization = `Bearer ${token}`;

    const refreshAuthToken = async () => {
        try {
            const response = await apiClient.post("/auth/refresh", { refresh_token: refreshToken });
            const newToken = response.data.access_token;
            apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
            return newToken;
        } catch (error) {
            console.error("Error refreshing token:", error.response?.data || error.message);
            handleLogout(); // Log out user if token refresh fails
            return null;
        }
    };

    const handleApiRequest = async (requestFn) => {
        try {
            return await requestFn();
        } catch (error) {
            if (error.response?.status === 401) {
                const newToken = await refreshAuthToken();
                if (newToken) {
                    apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
                    return await requestFn();
                }
            }
            throw error;
        }
    };

    const handleSave = async (field) => {
        setSuccessMessage("");
        setErrorMessage("");

        try {
            const payload = {};
            if (field === "username" && username) payload.username = username;
            if (field === "email" && email) payload.email = email;
            if (field === "password" && password) payload.password = password;

            if (Object.keys(payload).length === 0) {
                setErrorMessage("No changes to save.");
                return;
            }

            const response = await handleApiRequest(() => apiClient.put("/user/update", payload));
            setSuccessMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
            setEditingField(null);

            // Update local storage and local state with updated user info, if available.
            if (response.data && response.data.user) {
                const updatedUser = response.data.user;
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setUsername(updatedUser.username);
                setEmail(updatedUser.email);
                if (updatedUser.profileImage) {
                    setProfileImage(updatedUser.profileImage);
                }
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.error || "Failed to update. Please try again.");
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSuccessMessage("");
        setErrorMessage("");

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await handleApiRequest(() =>
                apiClient.post("/user/profile_image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
            );
            setProfileImage(response.data.profile_image);
            setSuccessMessage("Profile image updated successfully!");

            // Optionally update the user info in localStorage with the new profile image URL
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            storedUser.profileImage = response.data.profile_image;
            localStorage.setItem("user", JSON.stringify(storedUser));
        } catch (error) {
            if (error.response) {
                setErrorMessage(error.response.data.error || "Failed to upload profile image.");
            } else if (error.request) {
                setErrorMessage("No response from the server. Please check your connection.");
            } else {
                setErrorMessage("Unexpected error. Please try again.");
            }
        }
    };

    const handleImageDelete = async () => {
        setSuccessMessage("");
        setErrorMessage("");

        try {
            await handleApiRequest(() => apiClient.delete("/user/profile_image"));
            setProfileImage(null);
            setSuccessMessage("Profile image deleted successfully!");

            // Update localStorage to remove the profile image URL
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            delete storedUser.profileImage;
            localStorage.setItem("user", JSON.stringify(storedUser));
        } catch (error) {
            setErrorMessage("Failed to delete profile image. Please try again.");
        }
    };

    return (
        <div className="profile-container">
            <h2>Profile</h2>

            {successMessage && <p className="success-message">{successMessage}</p>}
            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <div className="profile-card">
                <div className="profile-image-section">
                    <ProfileImage profileImage={profileImage} username={username} />
                    <div className="image-actions">
                        <label htmlFor="image-upload" className="upload-button">
                            Upload New Image
                        </label>
                        <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: "none" }}
                        />
                        <button onClick={handleImageDelete} className="delete-button">
                            Delete Image
                        </button>
                    </div>
                </div>

                <div className="profile-details">
                    <div className="info-row">
                        <label>Username:</label>
                        {editingField === "username" ? (
                            <div className="edit-container">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <button onClick={() => handleSave("username")}>Save</button>
                            </div>
                        ) : (
                            <div className="display-container">
                                <span>{username}</span>
                                <button onClick={() => setEditingField("username")}>Edit</button>
                            </div>
                        )}
                    </div>

                    <div className="info-row">
                        <label>Email:</label>
                        {editingField === "email" ? (
                            <div className="edit-container">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <button onClick={() => handleSave("email")}>Save</button>
                            </div>
                        ) : (
                            <div className="display-container">
                                <span>{email}</span>
                                <button onClick={() => setEditingField("email")}>Edit</button>
                            </div>
                        )}
                    </div>

                    <div className="info-row">
                        <label>Password:</label>
                        {editingField === "password" ? (
                            <div className="edit-container">
                                <input
                                    type="password"
                                    placeholder="New password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button onClick={() => handleSave("password")}>Save</button>
                            </div>
                        ) : (
                            <div className="display-container">
                                <span>••••••••</span>
                                <button onClick={() => setEditingField("password")}>Change</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
