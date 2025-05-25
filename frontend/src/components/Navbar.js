import React, {useState, useEffect, useRef} from "react";
import {NavLink, useNavigate} from "react-router-dom";
import axios from "axios";
import "./Navbar.css";

const Navbar = ({token, handleLogout, user}) => {
    const [profile, setProfile] = useState(user || {username: "User", profileImage: ""});
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            if (!user?.profileImage) {
                const fetchAvatar = async () => {
                    try {
                        const response = await axios.get(`/api/user/default_avatar/${user.username}`, {
                            responseType: "blob",
                        });
                        const avatarUrl = URL.createObjectURL(response.data);
                        console.log("Fetched avatar URL:", avatarUrl);
                        setProfile((prev) => ({...prev, profileImage: avatarUrl}));
                    } catch (error) {
                        console.error("Error fetching avatar:", error);
                    }
                };
                fetchAvatar();
            } else {
                setProfile(user);
            }
        } else {
            setProfile({username: "User", profileImage: ""});
        }
    }, [token, user]);

    const toggleDropdown = () => setDropdownOpen((prev) => !prev);

    const closeDropdown = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", closeDropdown);
        return () => document.removeEventListener("mousedown", closeDropdown);
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-logo" onClick={() => navigate("/")}>
                AudioAnvil
            </div>
            <ul className="navbar-links">
                <li>
                    <NavLink to="/" className={({isActive}) => (isActive ? "active" : "")}>
                        Home
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/lyrics" className={({isActive}) => (isActive ? "active" : "")}>
                        Generate Lyrics
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/chords" className={({isActive}) => (isActive ? "active" : "")}>
                        Generate Chords
                    </NavLink>
                </li>
                {token && (
                    <>
                        <li>
                            <NavLink to="/lyrics/history" className={({isActive}) => (isActive ? "active" : "")}>
                                Lyrics History
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/songs" className={({isActive}) => (isActive ? "active" : "")}>
                                Songs
                            </NavLink>
                        </li>
                    </>
                )}
            </ul>
            <div className="navbar-user">
                {token ? (
                    <div ref={dropdownRef} className="profile-dropdown-container">
                        <div className="profile-info" onClick={toggleDropdown}>
                            <img
                                src={profile.profileImage || `/api/user/default_avatar/${profile.username}`}
                                alt="Profile"
                                className="profile-image"
                            />
                            <span className="profile-username">{profile.username || "User"}</span>
                        </div>
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item" onClick={() => navigate("/profile")}>
                                    View Profile
                                </div>
                                <div className="dropdown-item" onClick={handleLogout}>
                                    Logout
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="auth-buttons">
                        <button onClick={() => navigate("/login")} className="login-button">
                            Login
                        </button>
                        <button onClick={() => navigate("/signup")} className="signup-button">
                            Sign Up
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;