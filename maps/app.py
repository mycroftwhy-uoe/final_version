from flask import Flask, jsonify, request, render_template
import json
import logging
import oracledb
from pathlib import Path
import os
import sys

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO)
DATA_FILE = 'features.json'

def get_password(passfile='wang.txt'):
    home = Path.home()
    passfile = os.path.join(home, passfile)
    try:
        with open(passfile) as file:
            password = file.readline().strip()
        return password
    except FileNotFoundError as detail:
        logging.error(f'Password file not found: {detail}')
        sys.exit()

def load_features():
    if Path(DATA_FILE).exists():
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            logging.error(f'Error decoding JSON: {str(e)}')
            return []
    return []

def save_features(features):
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(features, f, indent=2)
    except Exception as e:
        logging.error(f'Error saving to file: {str(e)}')

@app.route('/api/markers', methods=['GET'], endpoint='api_markers')
def sitesmap():
    password = get_password()
    with oracledb.connect(user="s2645298", password=password, dsn="geoslearn", config_dir="/etc/") as conn:
        with conn.cursor() as cur:
            cur.execute("""
                    SELECT 
                        s.eas,
                        s.litter_rating,
                        s.site_id,
                        s.latitude,
                        s.longitude,
                        NVL(LISTAGG(DISTINCT ts.common_name, ', ') WITHIN GROUP (ORDER BY ts.common_name), 'None Found') AS tree_species
                    FROM 
                        s1867964.site_info s
                    LEFT JOIN
                        s1867964.trees t ON s1867964.s.site_id = s1867964.t.site_id
                    LEFT JOIN
                        s1867964.tree_species ts ON s1867964.t.species_id = s1867964.ts.species_id
                    AND
                        s1867964.t.status = 'Alive'
                    GROUP BY
                        s.site_id, s.eas, s.litter_rating, s.latitude, s.longitude
                        """)
            data = cur.fetchall()
        markers = [{
            'eas': eas,
            'litter_rating': litter_rating,
            'site_id': site_id,
            'lat': lat,
            'lng': lng,
            'tree_species': tree_species
            } for eas, litter_rating, site_id, lat, lng, tree_species in data]
        return jsonify(markers)

@app.route('/fieldmap')
def fieldmap():
    return render_template('fieldmap.html')

@app.route('/communitymap')
def communitymap():
    return render_template('comm.html')

@app.route('/saveFeature', methods=['POST'], endpoint='saveFeature')
def save_feature():
    data = request.json
    features = load_features()
    features.append(data)
    save_features(features)
    return jsonify({"message": "Feature saved successfully!"}), 200

@app.route('/loadFeatures', methods=['GET'], endpoint='load_all_features')
def load_all_features():
    features = load_features()
    return jsonify(features)

if __name__ == '__main__':
    app.run( host='0.0.0.0',port=55420, debug=True)

