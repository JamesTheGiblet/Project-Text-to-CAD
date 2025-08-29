# Text to CAD Generator

![Project Status](https://img.shields.io/badge/Status-Priority%20Phase%200-red)
![License](https://img.shields.io/badge/License-MIT-blue)
![Framework](https://img.shields.io/badge/Framework-Three.js-red)
![Development Priority](https://img.shields.io/badge/Build%20Order-FIRST-important)

A web-based application that converts natural language descriptions into 3D CAD models. **This is the foundation tool for the Iron Arm exoskeleton project** - build this first to design all mechanical components before moving to physical assembly.

## 🎯 Development Priority: BUILD THIS FIRST

**Text to CAD Generator** is **Phase 0** of the Iron Arm development pipeline. Complete this tool in **Weeks 1-2** before proceeding to mechanical assembly.

### Why This Tool Comes First
- **Rapid Iteration** - Design and refine parts without expensive CAD licenses
- **Natural Interface** - Describe parts in plain English instead of learning complex CAD
- **Iron Arm Optimized** - Pre-configured for exoskeleton component types
- **STL Ready** - Direct export for 3D printing Phase 1 components

## 🔗 Project Ecosystem

### Development Pipeline (8-Week Plan)
```
📅 Weeks 1-2: Text to CAD Generator (THIS PROJECT) 
    ↓ Generates STL files for...
📅 Weeks 3-4: Iron Arm Phase 1 - Mechanical Build
    ↓ Validates design, then...  
📅 Week 5: Project PI Planner Development
    ↓ Plans wiring for...
📅 Weeks 6-7: Iron Arm Phase 2 - Electronics Integration
```

### Connected Projects
- **Text to CAD Generator** (this project) - **BUILD FIRST** - Design tool for all mechanical parts
- **[Project PI Planner](../pi-planner/)** - **BUILD THIRD** - GPIO planning for electronics integration  
- **[Iron Arm Exoskeleton](../iron-arm/)** - **BUILD SECOND & FOURTH** - Main system using both tools

## 🚀 Features

- **Natural Language Processing**: Understands plain English descriptions of 3D objects
- **Real-time 3D Visualization**: Interactive Three.js-powered viewer
- **Multiple Shape Support**: Cubes, spheres, cylinders, cones, and torus shapes
- **Color Recognition**: Supports common color names (red, blue, green, etc.)
- **Dimension Parsing**: Extracts measurements and proportions from text
- **Multiple Object Creation**: Generate arrays of objects with single commands
- **Interactive Controls**: Mouse-based rotation, zooming, and panning
- **STL Export**: Export models for 3D printing
- **Responsive Design**: Modern glassmorphism UI with smooth animations

## ⚡ Iron Arm Development Focus (Weeks 1-2)

### Critical Components to Design FIRST

Your immediate mission is designing these **5 essential Iron Arm components** using Text-to-CAD:

#### 1. Upper Arm Cuff Bracket (Week 1 Priority)
```
Create upper arm cuff bracket:
- Main body: gray box with width 12, height 4, depth 2.5
- Servo attachment flange: rectangle with width 6, height 2, thickness 0.8
- Padding channels: 2 grooves with width 1, depth 0.5 for foam
- Velcro mounting tabs: 4 rectangles with width 2, height 1, thickness 0.3
```

#### 2. Elbow Joint Housing (Week 1 Priority)  
```
Make precision elbow joint housing:
- Main housing: black cylinder with radius 3.5 and height 2.8
- Bearing races: 2 silver rings with outer radius 3.2, inner radius 2.8  
- Cable routing channels: 4 grooves with width 0.8, depth 0.5
- Mounting boss: cylinder with radius 1.5 and height 1.2
```

#### 3. Motor Mount Bracket (Week 1)
```
Generate servo motor mounting system:
- Base plate: gray rectangle with width 4.5, height 6, thickness 1.2
- Motor cavity: rectangular cutout with width 2, height 4, depth 2.5
- Screw bosses: 4 cylinders with radius 0.3 and height 0.8
- Cable management clips: 2 hooks with radius 0.5
```

#### 4. Control Electronics Box (Week 2)
```
Create control system enclosure:
- Main body: blue box with width 8, height 5, depth 3
- Lid: gray plate with width 8.2, height 5.2, thickness 0.5
- Button cutouts: 2 cylinders with radius 0.8 and depth 1
- LED windows: 3 cylinders with radius 0.3 and depth 0.2
- Ventilation slots: 6 rectangles with width 3, height 0.3
```

#### 5. Cable Management System (Week 2)
```
Design cable routing components:
- Cable guide: gray cylinder with radius 1, height 2, wall thickness 0.3
- Strain relief: cone with base radius 1.2, tip radius 0.4, height 1.5  
- Mounting clips: 3 C-shaped brackets with width 1.5, height 1
```

### Week 1-2 Development Goals
- [ ] **Day 1-3**: Build basic Text-to-CAD framework
- [ ] **Day 4-7**: Design and iterate on cuff bracket (most critical part)
- [ ] **Day 8-10**: Create elbow housing and motor mount
- [ ] **Day 11-14**: Generate control box and cable management
- [ ] **End of Week 2**: All STL files ready for Phase 1 printing

### Success Criteria for Phase 0
- ✅ Text-to-CAD generates usable STL files for all 5 components
- ✅ Natural language commands produce accurate dimensions  
- ✅ Export functionality works reliably
- ✅ Ready to begin 3D printing immediately in Week 3

#### Motor Mounts
```
Create a gray motor mount bracket with width 4.5, height 6, and depth 3
Add mounting holes with diameter 0.3 spaced 2.5 apart
Make the base thickness 0.8 for servo attachment
```

#### Sensor Housings  
```
Generate a black control box with width 8, height 5, depth 3
Create ventilation slots on the sides
Add a mounting flange with thickness 0.5
```

#### Joint Components
```
Make an elbow joint housing in gray with width 6, height 4, depth 3
Create a cylindrical bearing race with inner radius 1.2 and outer radius 1.8
Add bolt holes with diameter 0.5 in a square pattern
```

#### Cuff Systems
```
Create a curved arm cuff bracket with width 12, height 4, depth 2
Make mounting tabs with thickness 0.6 for velcro attachment
Generate padding channels with depth 0.8 for foam insertion
```

### Robotics Applications

Perfect for rapid prototyping of:
- **Actuator Mounts** - Servo and stepper motor brackets
- **Sensor Enclosures** - Custom housings for IMUs, load cells
- **Structural Elements** - Frame connectors and joints  
- **User Interfaces** - Control boxes and switch housings

## 🎯 Quick Start

### Prerequisites
- Modern web browser with WebGL support
- Basic understanding of 3D modeling concepts
- Optional: 3D printer for physical prototyping

### Basic Usage
1. Open the HTML file in a modern web browser
2. Type a description in the text input area
3. Click "Generate 3D Model"
4. Use mouse controls to explore your creation:
   - **Left click + drag**: Rotate view
   - **Mouse wheel**: Zoom in/out
   - **Right click + drag**: Pan camera
5. Export your model as STL for 3D printing

## 📝 Supported Commands

### Basic Shapes
| Shape | Example Command |
|-------|----------------|
| Cube/Box | `Create a blue cube with width 2, height 1.5, and depth 1` |
| Sphere | `Make a red sphere with radius 1.5` |
| Cylinder | `Create a green cylinder with radius 0.8 and height 3` |
| Torus | `Make a yellow torus with inner radius 0.5 and outer radius 1.2` |
| Cone | `Create a purple cone with base radius 1 and height 2.5` |

### Exoskeleton-Specific Examples

#### Mounting Brackets
```
Create a servo motor mount:
- Main body: gray cube with width 4.5, height 6, depth 3
- Add a cylindrical boss with radius 1.2 and height 1.5 for motor shaft
- Include mounting tabs with width 1 and height 0.5
```

#### Joint Housings
```
Make an elbow joint assembly:
- Housing: black cylinder with radius 3 and height 2.5
- Bearing race: silver torus with outer radius 2.8 and inner radius 2.2
- Cover plate: gray disk with radius 3.2 and thickness 0.5
```

#### Control Elements
```
Generate a control interface:
- Main enclosure: blue box with width 8, height 5, depth 3
- Button housing: red cylinder with radius 0.8 and height 1
- LED mounts: green spheres with radius 0.3 arranged in a line
```

### Multiple Objects
- `Make 3 red cubes arranged in a line with size 1`
- `Create 5 blue spheres with radius 0.5`
- `Generate 4 green cylinders with height 2`

### Color Support
**Supported colors**: red, blue, green, yellow, purple, orange, pink, cyan, white, black, gray/grey

### Dimension Keywords
- **Cubes**: width, height, depth, size (for uniform dimensions)
- **Spheres**: radius
- **Cylinders**: radius, height
- **Torus**: radius (outer), inner radius, outer radius
- **Cones**: radius (base), base radius, height

## 🔧 Integration with Development Workflow

### With Project PI Planner
1. Use **PI Planner** to allocate GPIO pins for your sensors
2. Note the physical dimensions of sensor modules
3. Use **Text to CAD** to design custom mounting brackets:
   ```
   Create a sensor mount for HC-SR04 ultrasonic sensor:
   - Base plate: gray rectangle with width 4.5, height 2, thickness 0.8
   - Sensor slots: two cylinders with radius 0.8 and depth 1.2
   - Mounting holes: diameter 0.3 at corners
   ```

### With Iron Arm Exoskeleton
1. Design custom mechanical components as needed
2. Rapidly prototype modifications and improvements
3. Generate STL files for direct 3D printing integration

Example workflow for Iron Arm upgrades:
```
# Design a new cable guide
Create a cable guide bracket:
- Main body: black cylinder with radius 1 and height 2
- Cable channel: groove with width 0.5 and depth 0.3
- Mounting base: gray rectangle with width 3, height 3, thickness 0.5

# Create sensor protection cover
Make a protective housing:
- Cover: blue dome with radius 2.5 and height 1.5  
- Mounting ring: gray torus with outer radius 2.8 and inner radius 2.2
- Access port: cylinder with radius 0.4 and height 0.3
```

## 🔬 Technical Architecture

### Core Components
- **Text Parser** (`parseText()`) - Tokenizes natural language input
- **3D Engine** (Three.js) - Scene management and rendering  
- **Shape Generator** - Procedural geometry creation
- **Export System** - STL format generation

### Dependencies
- **Three.js (r128)**: 3D graphics and rendering
- **Modern Browser**: ES6+ JavaScript support required

## 🎨 Advanced Usage Examples

### Mechanical Design Patterns

#### Mounting Systems
```
Create a universal mounting plate:
- Base: gray rectangle with width 10, height 8, thickness 1
- Reinforcement ribs: 3 gray rectangles with width 0.5, height 6, thickness 1
- Mounting holes: pattern of cylinders with radius 0.25
```

#### Bearing Housings
```
Make a precision bearing housing:
- Outer shell: black cylinder with radius 4 and height 3
- Inner race: silver cylinder with radius 2.5 and height 2.8
- Retention groove: torus with outer radius 3.8 and inner radius 3.6
```

#### Cable Management
```
Design a cable routing system:
- Main channel: gray box with width 15, height 2, depth 1
- Entry guides: 2 cylinders with radius 0.8 and height 1.5
- Strain relief: cone with base radius 1 and tip radius 0.3
```

## 📋 Limitations

- **Shape Library**: Currently supports 5 basic primitive shapes
- **Positioning**: Limited automatic positioning (linear arrangement for multiples)
- **Boolean Operations**: No CSG operations (union, difference, intersection)
- **Complex Curves**: No support for bezier curves or custom profiles
- **Assembly**: No hierarchical object relationships

## 🔮 Future Enhancements

### Planned for Iron Arm v2.0 Integration
- **Boolean Operations**: Union/difference for complex brackets
- **Parametric Features**: Variables linked to sensor dimensions
- **Assembly Constraints**: Automatic mating of components
- **Material Properties**: Strength analysis for load-bearing parts

### Technical Roadmap
- **Extended Shape Library**: Pyramids, prisms, custom polygons
- **Advanced Positioning**: "Place X next to Y", "Stack A on top of B"  
- **AI Integration**: GPT/Claude API for better natural language understanding
- **Collaboration Tools**: Multi-user editing for team projects

## 🤝 Contributing

### Areas Needing Help
- **Enhanced NLP**: Improve text parsing for engineering terminology
- **Mechanical Features**: Add threads, fillets, chamfers
- **Export Formats**: Support STEP, OBJ, GLTF
- **Integration APIs**: Direct connection to CAD software

### Iron Arm Collaboration
We especially welcome contributions that enhance exoskeleton development:
- Biomechanical part templates
- Actuator mounting patterns  
- Sensor integration helpers
- Safety feature generators

## 📞 Support & Community

### Getting Help
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Join the maker community Discord
- **Integration Support**: Cross-reference with PI Planner and Iron Arm docs

### Related Resources
- **[Iron Arm Assembly Guide](../iron-arm/docs/assembly-guide.md)** - See practical usage examples
- **[PI Planner Integration](../pi-planner/docs/cad-integration.md)** - GPIO to mechanical design workflow
- **Maker Community Forum** - Share designs and get feedback

---

**Part of the Iron Arm Exoskeleton Project Suite** - Democratizing robotics development through intuitive tools.

*Transform your ideas into reality with the power of words.*
