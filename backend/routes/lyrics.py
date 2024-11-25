from flask import Blueprint, request, jsonify
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create a blueprint for lyrics
lyrics_bp = Blueprint("lyrics", __name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

@lyrics_bp.route("/", methods=["POST"])
def generate_lyrics():
    """
    Generate lyrics using OpenAI's Chat API.
    Request body should contain:
    - theme: The theme of the song
    - mood: The mood of the song
    - genre: The genre of the song
    """
    data = request.json
    theme = data.get("theme", "life")
    mood = data.get("mood", "neutral")
    genre = data.get("genre", "general")

    # Construct the prompt for GPT
    prompt = f"Write a {mood} {genre} song about {theme}."

    try:
        # Generate lyrics using the ChatCompletion API
        response = openai.ChatCompletion.create(
            model="gpt-4",  # Replace with 'gpt-3.5-turbo' if needed
            messages=[
                {"role": "system", "content": "You are a helpful assistant for songwriting."},
                {"role": "user", "content": "Write a happy rock song about love."},
            ],
            max_tokens=200,
            temperature=0.7,
        )
        # Extract lyrics from the response
        lyrics = response["choices"][0]["message"]["content"].strip()
        return jsonify({"lyrics": lyrics}), 200

    except openai.OpenAIError as e:
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
