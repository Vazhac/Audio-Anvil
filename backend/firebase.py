import firebase_admin
from firebase_admin import credentials, firestore

# Path to your Firebase configuration file
cred = credentials.Certificate("config/firebase_config.json")

# Initialize the Firebase app
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()
