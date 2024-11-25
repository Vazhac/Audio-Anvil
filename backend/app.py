from flask import Flask
from flask_cors import CORS
from routes.lyrics import lyrics_bp
from routes.chords import chords_bp
from routes.drafts import drafts_bp

app = Flask(__name__)
CORS(app)

# Register blueprints
app.register_blueprint(lyrics_bp, url_prefix="/api/lyrics")
app.register_blueprint(chords_bp, url_prefix="/api/chords")
app.register_blueprint(drafts_bp, url_prefix="/api/drafts")

if __name__ == "__main__":
    app.run(debug=True)
