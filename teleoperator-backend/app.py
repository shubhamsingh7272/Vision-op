from flask import Flask, jsonify, Response, request, send_file
from flask_cors import CORS
import os
import base64
from datetime import datetime
from werkzeug.utils import secure_filename
import psutil

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = 'recordings'
SCREENSHOTS_FOLDER = 'screenshots'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SCREENSHOTS_FOLDER, exist_ok=True)

@app.route('/metrics')
def get_metrics():
    try:
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        return jsonify({
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': {
                'total': memory.total,
                'used': memory.used,
                'percent': memory.percent
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'percent': disk.percent
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/save-recording', methods=['POST'])
def save_recording():
    try:
        file = request.files['file']
        recording_type = request.form.get('type', 'webcam')
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{recording_type}_recording_{timestamp}.webm"
        filepath = os.path.join(UPLOAD_FOLDER, secure_filename(filename))
        
        file.save(filepath)
        return jsonify({
            'success': True,
            'filename': filename,
            'message': 'Recording saved successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download-recording/<filename>')
def download_recording(filename):
    try:
        return send_file(
            os.path.join(UPLOAD_FOLDER, filename),
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/save-screenshot', methods=['POST'])
def save_screenshot():
    try:
        data = request.json
        screenshot_type = data.get('type', 'webcam')
        image_data = data['image'].split(',')[1]  # Remove data URL prefix
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{screenshot_type}_screenshot_{timestamp}.png"
        filepath = os.path.join(SCREENSHOTS_FOLDER, filename)
        
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(image_data))
            
        return jsonify({
            'success': True,
            'filename': filename,
            'message': 'Screenshot saved successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download-screenshot/<filename>')
def download_screenshot(filename):
    try:
        return send_file(
            os.path.join(SCREENSHOTS_FOLDER, filename),
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@app.route('/recordings/<path:filename>')
def get_recording(filename):
    try:
        return send_file(
            os.path.join(UPLOAD_FOLDER, filename),
            as_attachment=True
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)