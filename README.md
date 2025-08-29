Text to CAD Generator

A web-based application that converts natural language descriptions into 3D CAD models. Simply describe what you want to create in plain English, and watch as your words transform into interactive 3D objects.
This tool is the foundational design engine for the Iron Arm Exoskeleton project.

🎯 Development Priority: Phase 0
The Text to CAD Generator is the first and most critical phase of the Iron Arm development pipeline. The success of all subsequent mechanical and electronic phases depends on this tool.

Project Ecosystem & Timeline

The 8-week plan is structured as follows, with this tool enabling the entire workflow:

 * 📅 Weeks 1-2: Text to CAD Generator (THIS PROJECT)
   * Output: Generates STL files for all mechanical parts.
 * 📅 Weeks 3-4: Iron Arm Phase 1 - Mechanical Build
   * Output: Validates physical design and ergonomics.
 * 📅 Week 5: Project PI Planner Development
   * Output: Plans wiring and electronic layout.
 * 📅 Weeks 6-7: Iron Arm Phase 2 - Electronics Integration
   * Output: A fully functional exoskeleton prototype.

🚀 Features

 * Natural Language Processing: Understands plain English descriptions of 3D objects.
 * Blueprint Confirmation: Generates a clear, human-readable "blueprint" of your design for approval before creating the final 3D model, ensuring accuracy.
 * Real-time 3D Visualization: Interactive Three.js-powered viewer.
 * Multiple Shape Support: Cubes, spheres, cylinders, cones, and torus shapes.
 * Color Recognition: Supports common color names (red, blue, green, etc.).
 * Dimension Parsing: Extracts measurements and proportions from text.
 * Interactive Controls: Mouse-based rotation, zooming, and panning.
 * STL Export: Export models for 3D printing.
 * Responsive Design: Modern UI with smooth animations.

⚡ Iron Arm Development Focus (Weeks 1-2)

My immediate mission is designing these 5 essential Iron Arm components by generating their technical blueprints and final models.

<details>
<summary><strong>1. Upper Arm Cuff Bracket (Week 1 Priority)</strong></summary>
Create upper arm cuff bracket:
- Main body: gray box with width 12, height 4, depth 2.5
- Servo attachment flange: rectangle with width 6, height 2, thickness 0.8
- Padding channels: 2 grooves with width 1, depth 0.5 for foam
- Velcro mounting tabs: 4 rectangles with width 2, height 1, thickness 0.3

</details>
<details>
<summary><strong>2. Elbow Joint Housing (Week 1 Priority)</strong></summary>
Make precision elbow joint housing:
- Main housing: black cylinder with radius 3.5 and height 2.8
- Bearing races: 2 silver rings with outer radius 3.2, inner radius 2.8  
- Cable routing channels: 4 grooves with width 0.8, depth 0.5
- Mounting boss: cylinder with radius 1.5 and height 1.2

</details>
<details>
<summary><strong>3. Motor Mount Bracket (Week 1)</strong></summary>
Generate servo motor mounting system:
- Base plate: gray rectangle with width 4.5, height 6, thickness 1.2
- Motor cavity: rectangular cutout with width 2, height 4, depth 2.5
- Screw bosses: 4 cylinders with radius 0.3 and height 0.8
- Cable management clips: 2 hooks with radius 0.5

</details>
<details>
<summary><strong>4. Control Electronics Box (Week 2)</strong></summary>
Create control system enclosure:
- Main body: blue box with width 8, height 5, depth 3
- Lid: gray plate with width 8.2, height 5.2, thickness 0.5
- Button cutouts: 2 cylinders with radius 0.8 and depth 1
- LED windows: 3 cylinders with radius 0.3 and depth 0.2
- Ventilation slots: 6 rectangles with width 3, height 0.3

</details>
<details>
<summary><strong>5. Cable Management System (Week 2)</strong></summary>
Design cable routing components:
- Cable guide: gray cylinder with radius 1, height 2, wall thickness 0.3
- Strain relief: cone with base radius 1.2, tip radius 0.4, height 1.5  
- Mounting clips: 3 C-shaped brackets with width 1.5, height 1

</details>
Week 1-2 Development Goals
 * Day 1-3: Develop the parser and blueprint generator. The core task is to convert natural language commands into a structured JSON blueprint.
 * Day 4-7: Design and iterate on the cuff bracket by generating and refining its blueprint.
 * Day 8-10: Create blueprints for the elbow housing and motor mount.
 * Day 11-14: Generate blueprints for the control box and cable management system.
 * End of Week 2: All component blueprints are finalized and their STL files are ready for Phase 1 printing.

Success Criteria for Phase 0

 * ✅ Text-to-CAD generates accurate blueprints from complex commands.
 * ✅ Blueprints produce usable STL files for all 5 components.
 * ✅ Export functionality works reliably for complex, multi-part objects.
 * ✅ Ready to begin 3D printing immediately in Week 3.

🎯 Quick Start

Prerequisites
 * A modern web browser with WebGL support.
 * Basic understanding of 3D modeling concepts.
 * (Optional) A 3D printer for physical prototyping.
Basic Usage
 * Open the HTML file in a modern web browser.
 * Type a description in the text input area.
 * Click "Generate Blueprint".
 * Review the displayed technical blueprint to confirm the tool understood your intent.
 * Click "Create 3D Model".
 * Use mouse controls to explore your creation:
   * Left click + drag: Rotate view
   * Mouse wheel: Zoom in/out
   * Right click + drag: Pan camera
 * Export your model as STL for 3D printing.

🔬 Technical Architecture

Core Components
 * Natural Language Parser: Interprets user input to identify design intent, shapes, and parameters.
 * Blueprint Generator: Translates the parsed intent into a structured, intermediate representation (JSON format).
 * 3D Engine (Three.js): Reads the final blueprint to perform geometric operations (unions, subtractions) and render the final model.
 * Export System: Generates an STL file from the final 3D geometry.
Dependencies
 * Three.js (r128): 3D graphics and rendering.
 * Three-CSG-TS (or similar): For handling Boolean (union, subtract) operations on meshes.
 * Modern Browser: ES6+ JavaScript support required.
📝 Supported Commands
Basic Shapes
| Shape | Example Command |
|---|---|
| Cube/Box | Create a blue cube with width 2, height 1.5, and depth 1 |
| Sphere | Make a red sphere with radius 1.5 |
| Cylinder | Create a green cylinder with radius 0.8 and height 3 |
| Torus | Make a yellow torus with inner radius 0.5 and outer radius 1.2 |
| Cone | Create a purple cone with base radius 1 and height 2.5 |
Dimension Keywords
 * Cubes: width, height, depth, size
 * Spheres: radius
 * Cylinders: radius, height
 * Torus: radius, inner radius, outer radius
 * Cones: radius, base radius, height
Color Support
 * Supported colors: red, blue, green, yellow, purple, orange, pink, cyan, white, black, gray/grey.
🔧 Integration with Development Workflow
With Iron Arm Exoskeleton
This tool is the primary design interface for all mechanical components of the Iron Arm. The workflow is simple: design a part in Text-to-CAD, export the STL, and send it directly to a 3D printer.
With Project PI Planner
 * Use PI Planner to allocate GPIO pins and map out sensor locations.
 * Note the physical dimensions of the required sensor modules.
 * Use Text-to-CAD to design custom mounting brackets and enclosures to the exact specifications.
<!-- end list -->
# Example: Design a mount for an HC-SR04 sensor
Create a sensor mount for HC-SR04 ultrasonic sensor:
- Base plate: gray rectangle with width 4.5, height 2, thickness 0.8
- Sensor slots: subtract two cylinders with radius 0.8 and depth 1.2
- Mounting holes: subtract cylinders with diameter 0.3 at corners

📋 Limitations
 * Boolean Operations: The core challenge is implementing robust CSG operations (union, difference, intersection).
 * Positioning: The parser will need advanced logic to understand relative positioning ("on top of", "next to", "centered on").
 * Complex Curves: No support for bezier curves, splines, or custom profiles.
 * Assembly: No concept of hierarchical object relationships or assembly constraints.
🔮 Future Enhancements
Planned for Iron Arm v2.0 Integration
 * Parametric Features: Link variables in blueprints to sensor dimensions.
 * Assembly Constraints: Develop a system for automatic mating of components.
 * Material Properties: Simple strength analysis for load-bearing parts.
 * Mechanical Features: Add library support for threads, fillets, and chamfers.
Technical Roadmap
 * Advanced Positioning: "Place X next to Y", "Stack A on top of B".
 * AI Integration: Use a GPT/Claude API for more flexible natural language understanding.
 * Export Formats: Add support for STEP, OBJ, and GLTF.
🤝 Contributing
We welcome contributions, especially those that enhance exoskeleton development:
 * Biomechanical part templates
 * Actuator mounting patterns
 * Sensor integration helpers
📞 Support & Community
 * Issues: Use GitHub Issues for bugs and feature requests.
 * Discussions: Join the maker community Discord.
 * Related Resources: Cross-reference with the PI Planner and Iron Arm assembly guides.
Part of the Iron Arm Exoskeleton Project Suite - Democratizing robotics development through intuitive tools.
Transform your ideas into reality with the power of words.
