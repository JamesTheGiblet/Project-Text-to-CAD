# Text to CAD Generator

A web-based application that converts natural language descriptions into 3D CAD models. Simply describe what you want to create, modify, and combine in plain English, and watch as your words transform into interactive 3D objects. This tool is the foundational design engine for the Iron Arm Exoskeleton project.

![Text-to-CAD Screenshot](https://user-images.githubusercontent.com/your-username/your-repo/your-image.png) <!-- It's highly recommended to add a screenshot or GIF of the application in action! -->

🎯 Development Priority: Phase 0
The Text to CAD Generator is the first and most critical phase of the Iron Arm development pipeline. The success of all subsequent mechanical and electronic phases depends on this tool.

🚀 Features

* **Advanced 3D Operations**: Full support for Constructive Solid Geometry (CSG) including `union`, `subtraction`, and `intersection`.
* **Direct Object Manipulation**: Click to select any object in the scene, adjust its properties in real-time via a properties panel, or duplicate it instantly.
* **Object Naming & Referencing**: Assign custom names to objects and refer to them in subsequent commands for precise modifications.
* **Iterative Design Workflow**: Modify existing objects by changing their `color`, `position`, `rotation`, and `scale`.
* **Intelligent Positioning**: Understands relational commands like `"on top of"`.
* **Robust User Experience**: Features a persistent Undo/Redo stack, an interactive command history panel, named session saving/loading, and visual feedback (ghosting & loading indicators) for complex operations.
* **Expanded Shape Library**: Now includes `pyramids` in addition to cubes, spheres, cylinders, cones, and tori.
* **Real-time 3D Visualization**: Interactive Three.js-powered viewer with intuitive orbit controls.
* **Multiple Export Formats**: Export your final models as `STL`, `OBJ`, or `GLTF` files for 3D printing or use in other software.

⚡ Iron Arm Development Focus (Weeks 1-2)

My immediate mission is designing these 5 essential Iron Arm components by generating their technical blueprints and final models.

## 1. Upper Arm Cuff Bracket (Week 1 Priority)

**Command:** `Create a gray box with width 12, height 4, depth 2.5 named "cuff". Then create a box with width 6, height 2, depth 0.8 named "flange" and move it to y 3. Then unite it with "cuff".`

* Main body: gray box with width 12, height 4, depth 2.5
* Servo attachment flange: rectangle with width 6, height 2, thickness 0.8
* Padding channels: 2 grooves with width 1, depth 0.5 for foam
* Velcro mounting tabs: 4 rectangles with width 2, height 1, thickness 0.3

### 2. Elbow Joint Housing (Week 1 Priority)

**Command:** `Create a black cylinder with radius 3.5 and height 2.8 named "housing". Then create a cylinder with radius 3.2, height 2.8 and cut it through "housing". Then create a cylinder with radius 2.8, height 2.8 and unite it with "housing".`

* Main housing: black cylinder with radius 3.5 and height 2.8
* Bearing races: 2 silver rings with outer radius 3.2, inner radius 2.8
* Cable routing channels: 4 grooves with width 0.8, depth 0.5
* Mounting boss: cylinder with radius 1.5 and height 1.2

### 3. Motor Mount Bracket (Week 1)

**Command:** `Create a gray box with width 4.5, height 6, depth 1.2 named "base". Then create a box with width 2, height 4, depth 2.5 and cut it through "base".`

* Base plate: gray rectangle with width 4.5, height 6, thickness 1.2
* Motor cavity: rectangular cutout with width 2, height 4, depth 2.5
* Screw bosses: 4 cylinders with radius 0.3 and height 0.8
* Cable management clips: 2 hooks with radius 0.5

### 4. Control Electronics Box (Week 2)

**Command:** `Create a blue box with width 8, height 5, depth 3 named "box". Then create a box with width 7.8, height 4.8, depth 3 and cut it through "box".`

* Main body: blue box with width 8, height 5, depth 3
* Lid: gray plate with width 8.2, height 5.2, thickness 0.5
* Button cutouts: 2 cylinders with radius 0.8 and depth 1
* LED windows: 3 cylinders with radius 0.3 and depth 0.2
* Ventilation slots: 6 rectangles with width 3, height 0.3

### 5. Cable Management System (Week 2)

**Command:** `Create a gray cylinder with radius 1, height 2 named "guide". Then create a cylinder with radius 0.7, height 2 and cut it through "guide".`

* Cable guide: gray cylinder with radius 1, height 2, wall thickness 0.3
* Strain relief: cone with base radius 1.2, tip radius 0.4, height 1.5
* Mounting clips: 3 C-shaped brackets with width 1.5, height 1

🎯 Quick Start

1. **Run on a Local Server**: Due to browser security policies (CORS) for JavaScript modules, you cannot simply open `main.html` from your local filesystem. You must serve the files from a local web server.
    * **Recommended**: Use the Live Server extension for VS Code. Right-click `main.html` and select "Open with Live Server".
2. **Describe your model** in the text area. Use multiple sentences for sequential operations.
3. **Click "Generate 3D Model"**.
4. **Interact** with the model using your mouse (Left-click: Rotate, Right-click: Pan, Wheel: Zoom).
5. **Iterate** by modifying your text, using the interactive history panel, or using Undo/Redo.

* **Clear the scene** using the "Clear Scene" button to start fresh.
* **Export** your final model as an STL, OBJ, or GLTF file.

## 🔬 Technical Architecture

* **Natural Language Parser**: A modular system of regular expressions in `transforms.js` and `shapes.js` that interprets user input to identify shapes, operations, and parameters.
* **3D Engine (Three.js)**: Renders the 3D scene and handles geometric objects.
* **CSG Library (THREE.CSGMesh.js)**: Performs boolean operations (union, subtract, intersect) on meshes.
* **State Management (`history.js`)**: Manages the undo/redo stacks and persists the session to `localStorage`.

## 📝 Supported Commands

### Creation Commands

| Shape | Example Command |
|---|---|
| Cube/Box | `Create a blue cube with width 2, height 1.5, and depth 1` |
| Sphere | `Make a red sphere with radius 1.5` |
| Cylinder | `Create a green cylinder with radius 0.8 and height 3` |
| Torus | `Make a yellow torus with inner radius 0.5 and outer radius 1.2` |
| Cone | `Create a purple cone with base radius 1 and height 2.5` |
| Pyramid | `Create a pyramid with base radius 2 and height 3` |

### Modification Commands

| Command | Example |
|---|---|
| Naming | `Create a cube named "my_box"` |
| Move | `Move the object named "my_box" to x 5` |
| Rotate | `Rotate the object named "my_box" by 45 degrees on the y axis` |
| Scale | `Scale the object named "my_box" by 2` |
| Color | `Change the color of the object named "my_box" to green` |

### CSG & Relational Commands

| Command | Example |
|---|---|
| Union | `... and unite it with the cube` |
| Subtraction | `... and cut it through the cube` |
| Intersection | `... and intersect it with the sphere` |
| Relational | `... and put it on top of the cylinder` |

## 📋 Limitations

* **Complex Positioning**: While `"on top of"` is supported, more complex relations like `"next to"` or `"centered on"` are not yet implemented.
* **Direct Mesh Editing**: No support for sub-object manipulation like extruding a specific face, or creating fillets and chamfers.
* **Assembly Constraints**: No concept of hierarchical object relationships or assembly constraints between separate objects.

## 🔮 Future Enhancements

* **Advanced Positioning**: Implement more relational keywords like `"next to"`, `"inside"`, and `"aligned with"`.
* **Material Properties**: Add support for changing material properties like `metallic`, `roughness`, and `opacity`.
* **Enhanced Export**: Improve the STL export to be more robust and add support for other formats like OBJ or GLTF.
* **AI Integration**: Use a Large Language Model (LLM) API for more flexible and powerful natural language understanding, moving beyond the current regex-based approach.

## 🤝 Contributing

We welcome contributions, especially those that enhance exoskeleton development:

* Biomechanical part templates
* Actuator mounting patterns
* Sensor integration helpers

📞 Support & Community

* **Issues**: Use GitHub Issues for bugs and feature requests.
* **Discussions**: Join the maker community Discord.
* **Related Resources**: Cross-reference with the PI Planner and Iron Arm assembly guides.

---
*Part of the Iron Arm Exoskeleton Project Suite - Democratizing robotics development through intuitive tools.*

Transform your ideas into reality with the power of words.
