import React, { useState } from "react";
import LyricsForm from "../components/LyricsForm";
import LyricsDisplay from "../components/LyricsDisplay";

const Home = () => {
    const [lyrics, setLyrics] = useState("");

    return (
        <div>
            <LyricsForm setLyrics={setLyrics} />
            {lyrics && <LyricsDisplay lyrics={lyrics} />}
        </div>
    );
};

export default Home;
