import os
from flask import Blueprint, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY")  # Ensure your API key is set
)

# Create a Flask blueprint
lyrics_bp = Blueprint("lyrics", __name__)

@lyrics_bp.route("/", methods=["POST"])
def generate_lyrics():
    """
    Generate lyrics using OpenAI's latest client interface.
    Customization options:
    - max_tokens: Maximum word count for the lyrics.
    - temperature: Controls creativity/randomness.
    - rhyme_scheme: Optional rhyme scheme (e.g., AABB, ABAB).
    """
    data = request.json

    # Extract inputs and set defaults
    theme = data.get("theme", "life")
    mood = data.get("mood", "neutral")
    genre = data.get("genre", "general")
    max_tokens = data.get("max_tokens", 200)  # Default to 200 tokens
    temperature = data.get("temperature", 0.7)  # Default to moderate creativity
    rhyme_scheme = data.get("rhyme_scheme")  # Optional rhyme scheme

    # Construct the prompt with optional rhyme scheme
    prompt = f"Write a {mood} {genre} song about {theme}."
    if rhyme_scheme:
        prompt += f" The song should follow a {rhyme_scheme} rhyme scheme."

    try:
        # Call OpenAI API to generate chat completion
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="gpt-4",  # Use 'gpt-3.5-turbo' if gpt-4 is unavailable
            max_tokens=max_tokens,
            temperature=temperature,
        )

        # Extract the generated lyrics
        lyrics = response.choices[0].message.content.strip()
        return jsonify({
            "theme": theme,
            "mood": mood,
            "genre": genre,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "rhyme_scheme": rhyme_scheme,
            "lyrics": lyrics
        }), 200

    except Exception as e:
        # Handle exceptions and return error response
        return jsonify({"error": str(e)}), 500
