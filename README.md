# Text to CAD Generator

A web-based application that converts natural language descriptions into 3D CAD models. Simply describe what you want to create in plain English, and watch as your words transform into interactive 3D objects.

![Text to CAD Demo](https://img.shields.io/badge/demo-live-brightgreen) ![Three.js](https://img.shields.io/badge/Three.js-r128-blue) ![License](https://img.shields.io/badge/license-MIT-green)

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

## 🎯 Quick Start

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
| **Cube/Box** | `Create a blue cube with width 2, height 1.5, and depth 1` |
| **Sphere** | `Make a red sphere with radius 1.5` |
| **Cylinder** | `Create a green cylinder with radius 0.8 and height 3` |
| **Torus** | `Make a yellow torus with inner radius 0.5 and outer radius 1.2` |
| **Cone** | `Create a purple cone with base radius 1 and height 2.5` |

### Multiple Objects

- `Make 3 red cubes arranged in a line with size 1`
- `Create 5 blue spheres with radius 0.5`
- `Generate 4 green cylinders with height 2`

### Color Support

Supported colors: `red`, `blue`, `green`, `yellow`, `purple`, `orange`, `pink`, `cyan`, `white`, `black`, `gray`/`grey`

### Dimension Keywords

- **Cubes**: `width`, `height`, `depth`, `size` (for uniform dimensions)
- **Spheres**: `radius`
- **Cylinders**: `radius`, `height`
- **Torus**: `radius` (outer), `inner radius`, `outer radius`
- **Cones**: `radius` (base), `base radius`, `height`

## 🔧 Technical Architecture

### Core Components

1. **Text Parser** (`parseText()`)
   - Tokenizes natural language input
   - Extracts shape types, dimensions, and colors
   - Handles multiple object specifications

2. **3D Engine** (Three.js)
   - Scene management and rendering
   - Lighting and shadow system
   - Interactive camera controls

3. **Shape Generator**
   - Procedural geometry creation
   - Material and color application
   - Object positioning and arrangement

4. **Export System**
   - STL format generation
   - Mesh triangulation
   - File download handling

### Dependencies

- **Three.js (r128)**: 3D graphics and rendering
- **Modern Browser**: ES6+ JavaScript support required

## 🎨 Example Use Cases

### Rapid Prototyping
```
Create a blue housing with width 5, height 3, and depth 2
```

### Educational Models
```
Make a red sphere representing the sun with radius 2
Create a smaller blue sphere with radius 0.8 for earth
```

### Mechanical Parts
```
Generate a green cylinder with radius 1.2 and height 4 for a shaft
Create a yellow torus with outer radius 2 and inner radius 0.3 for a bearing
```

### Art and Design
```
Make 7 purple spheres arranged in a line with radius 0.5
Create a pink cone with base radius 1.5 and height 3
```

## 🛠️ Advanced Usage

### Combining Multiple Commands

You can describe multiple objects in a single input:

```
Create a red cube with size 2. Make a blue sphere with radius 1 above it. 
Add a green cylinder with radius 0.5 and height 1.5.
```

### Precision Control

For exact dimensions, use specific measurements:

```
Create a mechanical housing:
- Main body: gray cube with width 10.5, height 6.2, depth 4.8
- Mounting boss: green cylinder with radius 0.8 and height 1.2
```

## 📋 Limitations

- **Shape Library**: Currently supports 5 basic primitive shapes
- **Positioning**: Limited automatic positioning (linear arrangement for multiples)
- **Boolean Operations**: No CSG operations (union, difference, intersection)
- **Complex Curves**: No support for bezier curves or custom profiles
- **Assembly**: No hierarchical object relationships

## 🔮 Future Enhancements

### Planned Features

- **Extended Shape Library**: Pyramids, prisms, custom polygons
- **Boolean Operations**: Union, difference, intersection commands
- **Advanced Positioning**: "Place X next to Y", "Stack A on top of B"
- **Parametric Modeling**: Variables and relationships between objects
- **Material Properties**: Transparency, roughness, metallic properties
- **Animation Support**: Simple animations and kinematic chains
- **AI Integration**: GPT/Claude API for better natural language understanding

### Technical Improvements

- **Better Parser**: More sophisticated NLP with context understanding
- **Export Formats**: STEP, OBJ, GLTF support
- **Performance**: LOD system for complex scenes
- **Collaboration**: Multi-user editing capabilities
- **Version Control**: Model history and branching

## 🔧 Development

### File Structure
```
text-to-cad/
├── index.html          # Main application
├── README.md          # This file
└── examples/          # Example models and commands
```

### Browser Compatibility

- **Chrome**: 80+ ✅
- **Firefox**: 75+ ✅
- **Safari**: 13+ ✅
- **Edge**: 80+ ✅

### Performance Notes

- Optimized for models with <1000 triangles
- Real-time rendering at 60fps for most geometries
- Memory efficient object management

## 📖 API Reference

### Core Functions

#### `parseText(text: string): Command[]`
Parses natural language input into structured commands.

```javascript
const commands = parseText("Create a red cube with size 2");
// Returns: [{ type: 'cube', color: 0xff0000, size: [2, 2, 2] }]
```

#### `generateCAD(): void`
Generates 3D models from current text input and updates the scene.

#### `exportModel(): void`
Exports current scene as STL file for 3D printing.

### Command Structure

```javascript
{
  type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'cone',
  color: number,        // Hex color value
  size?: number[],      // [width, height, depth] for cubes
  radius?: number,      // For spheres, cylinders, cones
  height?: number,      // For cylinders, cones
  tube?: number,        // For torus inner radius
  count?: number        // Number of objects to create
}
```

## 🤝 Contributing

We welcome contributions! Areas where help is needed:

1. **Enhanced NLP**: Improve text parsing accuracy
2. **New Shapes**: Add more geometric primitives
3. **Better Export**: Support additional file formats
4. **UI/UX**: Improve user interface and experience
5. **Documentation**: Examples and tutorials

### Development Guidelines

- Follow existing code style and patterns
- Test with multiple browsers
- Include example commands for new features
- Update documentation for any API changes

## 📄 License

MIT License - feel free to use, modify, and distribute.

## 🔗 Related Projects

- **OpenSCAD**: Programmable CAD software
- **FreeCAD**: Open-source parametric 3D modeler  
- **Blender**: 3D creation suite with scripting
- **Three.js**: JavaScript 3D library
- **A-Frame**: Web VR framework

## 🆘 Support

For issues and feature requests:

1. Check existing examples for similar use cases
2. Verify your browser supports WebGL
3. Try simpler commands if complex ones fail
4. Check browser console for error messages

## 🎉 Acknowledgments

Built with Three.js and modern web technologies. Inspired by the vision of democratizing CAD design through natural language interfaces.

---

*Transform your ideas into reality with the power of words.*
