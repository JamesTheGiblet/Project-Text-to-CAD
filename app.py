from flask import Flask, request, jsonify
from flask_cors import CORS
import cadquery as cq
from io import BytesIO
import re

app = Flask(__name__)
# Allow Cross-Origin Resource Sharing for easy development
CORS(app)

def _parse_float(command: str, pattern: str, default: float) -> float:
    """Helper to parse a float from a command string using regex."""
    match = re.search(pattern, command)
    return float(match.group(1)) if match and match.group(1) else default

def create_cube(command: str) -> tuple[cq.Workplane, str]:
    """Creates a cube model from a command."""
    size = _parse_float(command, r'side(?: length)?\s*[:=]?\s*(\d+\.?\d*)', 50.0)
    model = cq.Workplane("XY").box(size, size, size)
    message = f"Successfully created a cube of size {size}."
    return model, message

def create_sphere(command: str) -> tuple[cq.Workplane, str]:
    """Creates a sphere model from a command."""
    radius = _parse_float(command, r'radius\s*[:=]?\s*(\d+\.?\d*)', 30.0)
    model = cq.Workplane("XY").sphere(radius)
    message = f"Successfully created a sphere with radius {radius}."
    return model, message

def create_cylinder(command: str) -> tuple[cq.Workplane, str]:
    """Creates a cylinder model from a command."""
    radius = _parse_float(command, r'r(?:adius)?\s*[:=]?\s*(\d+\.?\d*)', 20.0)
    height = _parse_float(command, r'h(?:eight)?\s*[:=]?\s*(\d+\.?\d*)', 60.0)
    model = cq.Workplane("XY").circle(radius).extrude(height)
    message = f"Successfully created a cylinder with radius {radius} and height {height}."
    return model, message

def create_cone(command: str) -> tuple[cq.Workplane, str]:
    """Creates a cone model from a command."""
    radius = _parse_float(command, r'r(?:adius)?\s*[:=]?\s*(\d+\.?\d*)', 25.0)
    height = _parse_float(command, r'h(?:eight)?\s*[:=]?\s*(\d+\.?\d*)', 50.0)
    # CadQuery's cone is created from the apex, so we translate it to sit on the XY plane
    model = cq.Workplane("XY").cone(height, radius).translate((0,0,height/2))
    message = f"Successfully created a cone with radius {radius} and height {height}."
    return model, message

# A dispatch table to map keywords to their handler functions
COMMAND_HANDLERS = {
    "cube": create_cube,
    "sphere": create_sphere,
    "cylinder": create_cylinder,
    "cone": create_cone,
}

@app.route('/process_command', methods=['POST'])
def process_command():
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({'status': 'error', 'message': 'Invalid request. "command" key is missing.'}), 400

    command = data['command'].lower().strip()
    print(f"Received command: {command}")

    try:
        result_model = None
        message = ""

        # --- Command Processing using the dispatch table ---
        handler_found = False
        for keyword, handler in COMMAND_HANDLERS.items():
            if keyword in command:
                result_model, message = handler(command)
                handler_found = True
                break
        
        if not handler_found:
            return jsonify({'status': 'error', 'message': f'Command not recognized by backend: "{command}"'}), 400

        # --- Export the CAD model to glTF format in memory ---
        buffer = BytesIO()
        cq.exporters.export(result_model.val(), buffer, 'GLTF2')
        gltf_data = buffer.getvalue().decode('utf-8')

        return jsonify({
            'status': 'success',
            'message': message,
            'model_data': gltf_data,
            'format': 'gltf'
        })

    except Exception as e:
        print(f"Error processing command: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)