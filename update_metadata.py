import firebase_admin
from firebase_admin import credentials, storage
import json
import csv
import os

# --- CONFIGURATION ---
# Path to your service account key JSON file
SERVICE_ACCOUNT_KEY_PATH = 'serviceAccountKey.json'
# The name of your Firebase Storage bucket (check your Firebase console)
STORAGE_BUCKET_NAME = 'sarahs-bd.appspot.com' 
# Paths to your data files
META_JSON_PATH = 'public/meta.json'
SPHERE_JSON_PATH = 'public/sphere.json'
MAPPING_CSV_PATH = 'mapping.csv'

# --- INITIALIZE FIREBASE ADMIN SDK ---
try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
    firebase_admin.initialize_app(cred, {
        'storageBucket': STORAGE_BUCKET_NAME
    })
    print("✅ Firebase Admin SDK initialized successfully.")
except Exception as e:
    print(f"❌ Error initializing Firebase: {e}")
    print("   Please ensure 'serviceAccountKey.json' is in the correct path.")
    exit()

# Get a reference to the storage bucket
bucket = storage.bucket()

# --- LOAD AND PRE-PROCESS LOCAL DATA ---
print("\nLoading local data files...")
try:
    with open(META_JSON_PATH, 'r') as f:
        meta_data = json.load(f)
        # Create a dictionary for quick lookups by URL
        description_map = {item['id']: item['description'] for item in meta_data}
    
    with open(SPHERE_JSON_PATH, 'r') as f:
        sphere_data = json.load(f) # sphere_data is already a dictionary

    with open(MAPPING_CSV_PATH, 'r') as f:
        # Use DictReader to easily access columns by header name
        mapping_data = list(csv.DictReader(f))

    print(f"   Loaded {len(description_map)} descriptions.")
    print(f"   Loaded {len(sphere_data)} sphere positions.")
    print(f"   Loaded {len(mapping_data)} URL-to-filename mappings.")

except FileNotFoundError as e:
    print(f"❌ File not found: {e.filename}. Please check your paths.")
    exit()
except Exception as e:
    print(f"❌ Error reading data files: {e}")
    exit()


# --- UPDATE METADATA IN FIREBASE STORAGE ---
print("\nStarting metadata update process...")
updated_count = 0
skipped_count = 0

for row in mapping_data:
    imgur_url = row.get('imgur_url')
    firebase_filename = row.get('firebase_filename')

    if not imgur_url or not firebase_filename:
        print(f"   ⚠️ Skipping invalid row in CSV: {row}")
        skipped_count += 1
        continue

    # Find the corresponding data from the JSON files
    description = description_map.get(imgur_url)
    sphere_coords = sphere_data.get(imgur_url)

    if description is None or sphere_coords is None:
        print(f"   ⚠️ Skipping '{firebase_filename}': No data found for URL '{imgur_url}' in JSON files.")
        skipped_count += 1
        continue
    
    try:
        # Get a reference to the specific file (blob) in the bucket
        blob = bucket.blob(firebase_filename)

        # Firebase custom metadata values MUST be strings
        new_metadata = {
            'description': str(description),
            'sphere_x': str(sphere_coords[0]),
            'sphere_y': str(sphere_coords[1]),
            'sphere_z': str(sphere_coords[2])
        }
        
        # Set the blob's metadata property
        blob.metadata = {'customMetadata': new_metadata}
        
        # Patch the metadata to save the changes online
        blob.patch()
        
        print(f"   ✅ Successfully updated metadata for: {firebase_filename}")
        updated_count += 1

    except Exception as e:
        print(f"   ❌ FAILED to update metadata for {firebase_filename}: {e}")
        skipped_count += 1

# --- FINAL REPORT ---
print("\n--- Update Complete ---")
print(f"Successfully updated: {updated_count} files")
print(f"Skipped or failed: {skipped_count} files")
print("-----------------------")
