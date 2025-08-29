// This file defines the properties and creation logic for all supported shapes.

export const SHAPES = {
    cube: {
        aliases: ['box'],
        // Factory function to create the geometry
        createGeometry: (cmd) => {
            return new THREE.BoxGeometry(cmd.size[0], cmd.size[1], cmd.size[2]);
        },
        // Function to parse specific parameters from the text
        parseParams: (sentence, cmd) => {
            cmd.size = [1, 1, 1]; // Default size
            const widthMatch = sentence.match(/width\s+(-?\d+\.?\d*)/);
            const heightMatch = sentence.match(/height\s+(-?\d+\.?\d*)/);
            const depthMatch = sentence.match(/depth\s+(-?\d+\.?\d*)/);
            const sizeMatch = sentence.match(/size\s+(-?\d+\.?\d*)/);

            if (sizeMatch) {
                const size = parseFloat(sizeMatch[1]);
                cmd.size = [size, size, size];
            } else {
                if (widthMatch) cmd.size[0] = parseFloat(widthMatch[1]);
                if (heightMatch) cmd.size[1] = parseFloat(heightMatch[1]);
                if (depthMatch) cmd.size[2] = parseFloat(depthMatch[1]);
            }
        }
    },
    sphere: {
        aliases: ['ball'],
        createGeometry: (cmd) => {
            return new THREE.SphereGeometry(cmd.radius, 32, 16);
        },
        parseParams: (sentence, cmd) => {
            cmd.radius = 1; // Default radius
            const radiusMatch = sentence.match(/radius\s+(-?\d+\.?\d*)/);
            if (radiusMatch) cmd.radius = parseFloat(radiusMatch[1]);
        }
    },
    cylinder: {
        aliases: [],
        createGeometry: (cmd) => {
            return new THREE.CylinderGeometry(cmd.radius, cmd.radius, cmd.height, 32);
        },
        parseParams: (sentence, cmd) => {
            cmd.radius = 1; // Default
            cmd.height = 2; // Default
            const radiusMatch = sentence.match(/radius\s+(-?\d+\.?\d*)/);
            const heightMatch = sentence.match(/height\s+(-?\d+\.?\d*)/);
            if (radiusMatch) cmd.radius = parseFloat(radiusMatch[1]);
            if (heightMatch) cmd.height = parseFloat(heightMatch[1]);
        }
    },
    torus: {
        aliases: ['donut'],
        createGeometry: (cmd) => {
            return new THREE.TorusGeometry(cmd.radius, cmd.tube, 16, 100);
        },
        parseParams: (sentence, cmd) => {
            cmd.radius = 1; // Default
            cmd.tube = 0.4; // Default
            const outerRadiusMatch = sentence.match(/outer\s+radius\s+(-?\d+\.?\d*)/);
            const innerRadiusMatch = sentence.match(/inner\s+radius\s+(-?\d+\.?\d*)/);
            const tubeMatch = sentence.match(/tube\s+(?:radius\s+)?(-?\d+\.?\d*)/);
            const radiusMatch = sentence.match(/(?<!outer\s|inner\s|tube\s)radius\s+(-?\d+\.?\d*)/);

            if (outerRadiusMatch && innerRadiusMatch) {
                const outerR = parseFloat(outerRadiusMatch[1]);
                const innerR = parseFloat(innerRadiusMatch[1]);
                if (outerR > innerR) {
                    cmd.radius = (outerR + innerR) / 2;
                    cmd.tube = (outerR - innerR) / 2;
                }
            } else {
                if (radiusMatch) cmd.radius = parseFloat(radiusMatch[1]);
                if (tubeMatch) cmd.tube = parseFloat(tubeMatch[1]);
            }
        }
    },
    cone: {
        aliases: [],
        createGeometry: (cmd) => {
            return new THREE.ConeGeometry(cmd.radius, cmd.height, 32);
        },
        parseParams: (sentence, cmd) => {
            cmd.radius = 1; // Default
            cmd.height = 2; // Default
            const radiusMatch = sentence.match(/(?:base\s+)?radius\s+(-?\d+\.?\d*)/);
            const heightMatch = sentence.match(/height\s+(-?\d+\.?\d*)/);
            if (radiusMatch) cmd.radius = parseFloat(radiusMatch[1]);
            if (heightMatch) cmd.height = parseFloat(heightMatch[1]);
        }
    },
    pyramid: {
        aliases: [],
        createGeometry: (cmd) => {
            // A pyramid is a cone with 4 radial segments.
            return new THREE.ConeGeometry(cmd.radius, cmd.height, 4);
        },
        parseParams: (sentence, cmd) => {
            cmd.radius = 1; // Default base size
            cmd.height = 2; // Default height
            const radiusMatch = sentence.match(/(?:base\s+)?radius\s+(-?\d+\.?\d*)/);
            const heightMatch = sentence.match(/height\s+(-?\d+\.?\d*)/);
            if (radiusMatch) cmd.radius = parseFloat(radiusMatch[1]);
            if (heightMatch) cmd.height = parseFloat(heightMatch[1]);
        }
    }
};

// Generate a dynamic regex string of all shape names and aliases
const allShapeNames = Object.entries(SHAPES).reduce((acc, [name, { aliases }]) => {
    acc.push(name, ...aliases);
    return acc;
}, []);

export const SHAPE_NAMES_REGEX_PART = `(?:${allShapeNames.join('|')})`;