from flask import Flask
from flask_cors import CORS
from routes.lyrics import lyrics_bp
from routes.chords import chords_bp
from routes.drafts import drafts_bp
from flask import send_from_directory


app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(lyrics_bp, url_prefix="/api/lyrics")
app.register_blueprint(chords_bp, url_prefix="/api/chords")
app.register_blueprint(drafts_bp, url_prefix="/api/drafts")

if __name__ == "__main__":
    app.run(debug=True)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    """
    Serve the React frontend from the build directory.
    """
    if path and os.path.exists(os.path.join("frontend/build", path)):
        return send_from_directory("frontend/build", path)
    else:
        return send_from_directory("frontend/build", "index.html")