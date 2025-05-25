from openai import OpenAI
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    jwt_required,
    create_access_token,
    create_refresh_token,
    get_jwt_identity
)
from google.cloud import firestore
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from datetime import timedelta
import logging
import re
from flask import send_file
from PIL import Image, ImageDraw, ImageFont
import io
from routes.chords import chords_bp

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Adjust origins for production

# After initializing your Flask app (app = Flask(__name__)) and before running it:
app.register_blueprint(chords_bp, url_prefix="/api/chords")

# Set OpenAI API Key


# Logging Configuration
logging.basicConfig(level=logging.DEBUG)

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecret")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
jwt = JWTManager(app)

# Firestore Client
db = firestore.Client()

UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ------------------------------- Helper Functions -------------------------------
def validate_email(email):
    """Validate email format."""
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(email_regex, email) is not None


def validate_password(password):
    """Validate password strength."""
    return len(password) >= 8


def generate_chords(theme, mood):
    """Generate chord progressions based on theme and mood."""
    progressions = {
        "happy": [["C", "G", "Am", "F"], ["D", "G", "Bm", "A"]],
        "sad": [["Am", "G", "F", "E"], ["Dm", "Am", "Bb", "F"]],
        "neutral": [["G", "C", "Em", "D"], ["F", "C", "G", "Am"]]
    }
    mood_chords = progressions.get(mood.lower(), [["C", "G", "Am", "F"]])
    return mood_chords[len(theme) % len(mood_chords)]


def create_default_image(initial, filepath):
    try:
        # Avatar settings
        img_size = 248
        background_color = (73, 128, 192)  # Example: Blue background
        text_color = (255, 255, 255)  # White text
        font_size = 120

        # Create a blank image
        image = Image.new("RGB", (img_size, img_size), color=background_color)
        draw = ImageDraw.Draw(image)

        # Load a font
        font_path = "arial.ttf"  # Replace with a valid font path
        try:
            font = ImageFont.truetype(font_path, font_size)
        except IOError:
            logging.error(f"Font file not found: {font_path}")
            font = ImageFont.load_default()

        # Center the initial text
        text_bbox = draw.textbbox((0, 0), initial, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        text_x = (img_size - text_width) / 2
        text_y = (img_size - text_height) / 2

        # Draw shadow and main text
        shadow_offset = 2
        draw.text((text_x + shadow_offset, text_y + shadow_offset), initial, font=font, fill=(0, 0, 0))
        draw.text((text_x, text_y), initial, font=font, fill=text_color)

        # Save the image
        image.save(filepath, "PNG")
    except Exception as e:
        logging.error(f"Error generating default avatar: {e}")


# ------------------------------- Routes -------------------------------

# User Profile Update
@app.route("/api/user/update", methods=["PUT"])
@jwt_required()
def update_user():
    current_user = get_jwt_identity()
    data = request.json

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    user_ref = db.collection("users").document(current_user)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404

    user_data = user_doc.to_dict()

    updates = {}

    # Update username
    if username:
        if db.collection("users").document(username).get().exists():
            return jsonify({"error": "Username already taken."}), 400
        updates["username"] = username

    # Update email
    if email:
        if not validate_email(email):
            return jsonify({"error": "Invalid email format."}), 400
        email_query = db.collection("users").where("email", "==", email).stream()
        if any(email_query):
            return jsonify({"error": "Email already in use."}), 400
        updates["email"] = email

    # Update password
    if password:
        if not validate_password(password):
            return jsonify({"error": "Password must be at least 8 characters long."}), 400
        updates["password"] = generate_password_hash(password)

    if updates:
        user_ref.update(updates)

    # Handle username change
    if "username" in updates:
        new_username = updates["username"]
        new_ref = db.collection("users").document(new_username)
        new_ref.set(user_data)
        new_ref.update(updates)
        user_ref.delete()
        current_user = new_username

    # Return the updated user data
    updated_user = db.collection("users").document(current_user).get().to_dict()
    return jsonify({"message": "User updated successfully.", "user": updated_user}), 200


@app.route("/api/user/default_avatar/<username>", methods=["GET"])
def generate_initial_avatar(username):
    try:
        # Ensure the username is valid
        if not username:
            raise ValueError("Username is required")

        # Avatar settings
        img_size = 248  # Image size (square)
        background_color = (73, 128, 192)  # Example: Blue background
        text_color = (255, 255, 255)  # White text
        font_size = 120

        # Create a blank image
        image = Image.new("RGB", (img_size, img_size), color=background_color)
        draw = ImageDraw.Draw(image)

        # Load a font
        font_path = "arial.ttf"  # Ensure this font file exists
        try:
            font = ImageFont.truetype(font_path, font_size)
        except IOError:
            logging.error(f"Font file not found: {font_path}")
            font = ImageFont.load_default()

        # Extract initials (e.g., "John Doe" -> "JD")
        initials = "".join([name[0].upper() for name in username.split()[:2]])

        # Calculate text position for centering
        text_bbox = draw.textbbox((0, 0), initials, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        text_x = (img_size - text_width) / 2
        text_y = (img_size - text_height) / 2

        # Draw the initials with shadow for beautification
        shadow_offset = 2
        draw.text((text_x + shadow_offset, text_y + shadow_offset), initials, font=font, fill=(0, 0, 0))  # Shadow
        draw.text((text_x, text_y), initials, font=font, fill=text_color)  # Main text

        # Save the image to a BytesIO stream
        img_stream = io.BytesIO()
        image.save(img_stream, format="PNG")
        img_stream.seek(0)

        return send_file(img_stream, mimetype="image/png")
    except Exception as e:
        logging.error(f"Error generating default avatar: {e}")
        return jsonify({"error": "Failed to generate avatar"}), 500


# Profile Image Upload/Remove
@app.route("/api/user/profile_image", methods=["POST", "GET", "DELETE"])
@jwt_required()
def manage_profile_image():
    current_user = get_jwt_identity()
    user_ref = db.collection("users").document(current_user)
    user_doc = user_ref.get()

    if not user_doc.exists:
        logging.error("User not found in the database.")
        return jsonify({"error": "User not found"}), 404

    if request.method == "POST":
        if 'image' not in request.files:
            logging.error("No file part in the request.")
            return jsonify({"error": "No file part"}), 400

        file = request.files['image']
        if file.filename == '':
            logging.error("No file selected for upload.")
            return jsonify({"error": "No selected file"}), 400

        try:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

            # Save the uploaded image temporarily
            file.save(filepath)

            # Resize the image to 248x248 using Pillow
            resized_filename = f"resized_{filename}"
            resized_filepath = os.path.join(app.config['UPLOAD_FOLDER'], resized_filename)
            with Image.open(filepath) as img:
                img = img.resize((248, 248), Image.ANTIALIAS)
                img.save(resized_filepath)

            # Update user profile with the resized image
            relative_path = f"/uploads/{resized_filename}"
            user_ref.update({"profile_image": relative_path})

            # Remove the original file to save storage
            os.remove(filepath)

            logging.info(f"Profile image successfully uploaded and resized: {relative_path}")
            return jsonify({
                "message": "Profile image uploaded and resized successfully",
                "profile_image": relative_path
            }), 200

        except Exception as e:
            logging.exception("Failed to process the uploaded image.")
            return jsonify({"error": f"Failed to process image: {str(e)}"}), 500

    elif request.method == "GET":
        profile_image = user_doc.to_dict().get("profile_image")
        if profile_image:
            logging.info(f"Returning profile image for user {current_user}: {profile_image}")
            return jsonify({"profile_image": profile_image}), 200

        # Generate a default image based on the first initial of the username
        username = user_doc.to_dict().get("username", "U")
        initial = username[0].upper()

        default_filename = f"default_{current_user}.png"
        default_filepath = os.path.join(app.config['UPLOAD_FOLDER'], default_filename)

        if not os.path.exists(default_filepath):
            try:
                create_default_image(initial, default_filepath)
                logging.info(f"Default avatar created for user {current_user}.")
            except Exception as e:
                logging.exception("Failed to create default avatar.")
                return jsonify({"error": "Failed to generate default avatar"}), 500

        return jsonify({"profile_image": f"/uploads/{default_filename}"}), 200

    elif request.method == "DELETE":
        try:
            profile_image = user_doc.to_dict().get("profile_image")
            if profile_image and "default_" not in profile_image:
                image_path = os.path.join(app.config['UPLOAD_FOLDER'], profile_image.split("/")[-1])
                if os.path.exists(image_path):
                    os.remove(image_path)
                    logging.info(f"Profile image {image_path} deleted for user {current_user}.")

            user_ref.update({"profile_image": None})
            return jsonify({"message": "Profile image deleted successfully"}), 200
        except Exception as e:
            logging.exception("Failed to delete profile image.")
            return jsonify({"error": f"Failed to delete profile image: {str(e)}"}), 500


# Serve Uploaded Files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# Lyrics Management
@app.route("/api/lyrics", methods=["POST"])
@jwt_required()
def generate_lyrics():
    try:
        data = request.json
        current_user = get_jwt_identity()

        # Extract request parameters
        theme = data.get("theme", "life")
        mood = data.get("mood", "neutral")
        genre = data.get("genre", "general")
        max_tokens = int(data.get("max_tokens", 200))
        temperature = float(data.get("temperature", 0.7))
        rhyme_scheme = data.get("rhyme_scheme", None)

        prompt = (
            f"Generate a {mood} {genre} song about {theme}. "
            f"Rhyme scheme: {rhyme_scheme or 'none'}."
        )

        OpenAI.api_key = os.getenv("OPENAI_API_KEY")

        client = OpenAI()

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a creative and talented songwriter."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )

        lyrics = response.choices[0].message.content.strip()

        # Save generated lyrics to Firestore
        db.collection("lyrics").add({
            "user": current_user,
            "lyrics": lyrics,
            "metadata": {
                "theme": theme,
                "mood": mood,
                "genre": genre,
                "max_tokens": max_tokens,
                "temperature": temperature,
                "rhyme_scheme": rhyme_scheme,
            },
            "created_at": firestore.SERVER_TIMESTAMP,
        })

        return jsonify({"lyrics": lyrics}), 200
    except Exception as e:
        logging.error(f"Error in /api/lyrics: {e}")
        return jsonify({"error": "Failed to generate lyrics."}), 500


@app.route("/api/lyrics/delete/<string:lyrics_id>", methods=["DELETE"])
@jwt_required()
def delete_lyrics(lyrics_id):
    current_user = get_jwt_identity()
    lyrics_ref = db.collection("lyrics").document(lyrics_id)
    lyrics_doc = lyrics_ref.get()

    if not lyrics_doc.exists():
        return jsonify({"error": "Lyrics not found."}), 404
    if lyrics_doc.to_dict().get("user") != current_user:
        return jsonify({"error": "Unauthorized access."}), 403

    lyrics_ref.delete()
    return jsonify({"message": "Lyrics deleted successfully."}), 200


@app.route("/api/lyrics/history", methods=["GET"])
@jwt_required()
def get_lyrics_history():
    try:
        current_user = get_jwt_identity()
        lyrics_docs = db.collection("lyrics").where("user", "==", current_user).order_by("created_at",
                                                                                         direction=firestore.Query.DESCENDING).stream()

        lyrics_history = {}
        for doc in lyrics_docs:
            lyrics_data = doc.to_dict()
            name = lyrics_data.get("metadata", {}).get("theme", "Unknown")
            created_at = lyrics_data.get("created_at", None)
            if name not in lyrics_history:
                lyrics_history[name] = []
            lyrics_history[name].append({
                "id": doc.id,
                "lyrics": lyrics_data.get("lyrics", ""),
                "metadata": lyrics_data.get("metadata", {}),
                "created_at": created_at,
            })

        return jsonify({"history": lyrics_history}), 200
    except Exception as e:
        logging.error(f"Error fetching lyrics history: {e}")
        return jsonify({"error": "Failed to fetch lyrics history."}), 500


@app.route("/api/lyrics/<string:lyric_id>", methods=["PUT"])
@jwt_required()
def update_lyric(lyric_id):
    try:
        data = request.json
        current_user = get_jwt_identity()

        doc_ref = db.collection("lyrics").document(lyric_id)
        doc = doc_ref.get()

        if not doc.exists:
            return jsonify({"error": "Lyric not found"}), 404

        if doc.to_dict()["user"] != current_user:
            return jsonify({"error": "Unauthorized"}), 403

        update_data = {}
        if "lyrics" in data:
            update_data["lyrics"] = data["lyrics"]
        if "category" in data:
            update_data["category"] = data["category"]

        if update_data:
            doc_ref.update(update_data)

        return jsonify({"message": "Lyric updated successfully"}), 200
    except Exception as e:
        logging.error(f"Error updating lyric: {e}")
        return jsonify({"error": "Failed to update lyric."}), 500


# ------------------------------   Song Management ------------------------------
@app.route("/api/songs", methods=["GET"])
@jwt_required()
def get_songs():
    current_user = get_jwt_identity()
    songs = db.collection("songs").where("user", "==", current_user).stream()
    song_list = [song.to_dict() for song in songs]
    return jsonify({"songs": song_list}), 200


@app.route("/api/songs/<string:song_id>", methods=["GET"])
@jwt_required()
def get_song(song_id):
    current_user = get_jwt_identity()
    song_ref = db.collection("songs").document(song_id)
    song_doc = song_ref.get()

    if not song_doc.exists or song_doc.to_dict().get("user") != current_user:
        return jsonify({"error": "Unauthorized or song not found."}), 404

    song_data = song_doc.to_dict()
    return jsonify({"song": song_data}), 200


@app.route("/api/songs/<string:song_id>", methods=["PUT", "DELETE"])
@jwt_required()
def manage_song(song_id):
    current_user = get_jwt_identity()
    song_ref = db.collection("songs").document(song_id)
    song_doc = song_ref.get()

    if not song_doc.exists or song_doc.to_dict().get("user") != current_user:
        return jsonify({"error": "Unauthorized or song not found."}), 404

    if request.method == "PUT":
        data = request.json
        song_ref.update({
            "title": data.get("title"),
            "lyrics": data.get("lyrics"),
            "chord_progressions": data.get("chord_progressions"),
            "updated_at": firestore.SERVER_TIMESTAMP,
        })
        return jsonify({"message": "Song updated successfully."}), 200

    elif request.method == "DELETE":
        song_ref.delete()
        return jsonify({"message": "Song deleted successfully."}), 200


# ------------------------------- Authentication -------------------------------
@app.route("/api/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh_token():
    try:
        current_user = get_jwt_identity()
        access_token = create_access_token(identity=current_user)
        return jsonify({"access_token": access_token}), 200
    except Exception as e:
        return jsonify({"error": "Failed to refresh token"}), 500


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    try:
        data = request.json
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username or not email or not password:
            return jsonify({"error": "All fields are required."}), 400

        username_lower = username.lower()
        email_lower = email.lower()

        # Check if username or email already exists (case-insensitive)
        username_query = db.collection("users").where("username_lower", "==", username_lower).stream()
        if any(username_query):
            return jsonify({"error": "Username already taken."}), 400

        email_query = db.collection("users").where("email_lower", "==", email_lower).stream()
        if any(email_query):
            return jsonify({"error": "Email already in use."}), 400

        hashed_password = generate_password_hash(password)

        # Save user with lowercase fields
        db.collection("users").document(username).set({
            "username": username,
            "username_lower": username_lower,
            "email": email,
            "email_lower": email_lower,
            "password": hashed_password,
            # Add other fields as needed
        })

        return jsonify({"message": "User created successfully"}), 201

    except Exception as e:
        logging.error(f"Signup error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        identifier = data.get("username") or data.get("email")
        password = data.get("password")

        if not identifier or not password:
            return jsonify({"error": "Username or email and password are required."}), 400

        identifier_lower = identifier.lower()

        # Query Firestore case-insensitively by using lowercase fields
        if "@" in identifier_lower:
            user_query = db.collection("users").where("email_lower", "==", identifier_lower).stream()
            user_doc = next(iter(user_query), None)
        else:
            user_query = db.collection("users").where("username_lower", "==", identifier_lower).stream()
            user_doc = next(iter(user_query), None)

        if not user_doc or not user_doc.exists:
            return jsonify({"error": "Invalid username or email."}), 401

        user = user_doc.to_dict()

        # Password check remains case-sensitive
        if not check_password_hash(user["password"], password):
            return jsonify({"error": "Invalid password."}), 401

        access_token = create_access_token(identity=user.get("username"))
        refresh_token = create_refresh_token(identity=user.get("username"))

        return jsonify({
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }), 200

    except Exception as e:
        logging.error(f"Login error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/api/chords/generate", methods=["POST"])
@jwt_required()
def generate_chords_route():
    try:
        data = request.json
        theme = data.get("theme", "")
        mood = data.get("mood", "neutral")

        # Use your existing generate_chords helper function
        chords = generate_chords(theme, mood)

        return jsonify({"chords": chords}), 200
    except Exception as e:
        logging.error(f"Error generating chords: {e}")
        return jsonify({"error": "Failed to generate chords."}), 500


# Run Flask App
if __name__ == "__main__":
    app.run(debug=True)
