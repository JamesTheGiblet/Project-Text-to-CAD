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
    },
    gear: {
        aliases: [],
        createGeometry: (cmd) => {
            const shape = new THREE.Shape();

            const innerRadius = cmd.radius - cmd.toothHeight;
            const outerRadius = cmd.radius;
            const angleStep = (Math.PI * 2) / cmd.teeth;
            const toothAngle = angleStep * 0.5; // Width of the tooth

            for (let i = 0; i < cmd.teeth; i++) {
                const angle = i * angleStep;

                // Start of the valley
                shape.lineTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);

                // First side of the tooth
                shape.lineTo(Math.cos(angle + toothAngle * 0.1) * innerRadius, Math.sin(angle + toothAngle * 0.1) * innerRadius);

                // Top of the tooth
                shape.lineTo(Math.cos(angle + toothAngle * 0.5) * outerRadius, Math.sin(angle + toothAngle * 0.5) * outerRadius);

                // Second side of the tooth
                shape.lineTo(Math.cos(angle + toothAngle * 0.9) * innerRadius, Math.sin(angle + toothAngle * 0.9) * innerRadius);
            }
            shape.closePath();

            // Create the central hole
            if (cmd.holeRadius > 0) {
                const holePath = new THREE.Path();
                holePath.absarc(0, 0, cmd.holeRadius, 0, Math.PI * 2, false);
                shape.holes.push(holePath);
            }

            const extrudeSettings = {
                steps: 1,
                depth: cmd.height,
                bevelEnabled: false,
            };

            return new THREE.ExtrudeGeometry(shape, extrudeSettings);
        },
        parseParams: (sentence, cmd) => {
            cmd.teeth = parseInt(sentence.match(/(\d+)\s+teeth/)?.[1] || 12);
            cmd.radius = parseFloat(sentence.match(/radius\s+(-?\d+\.?\d*)/)?.[1] || 2);
            cmd.height = parseFloat(sentence.match(/height\s+(-?\d+\.?\d*)/)?.[1] || 0.5);
            cmd.holeRadius = parseFloat(sentence.match(/hole\s+radius\s+(-?\d+\.?\d*)/)?.[1] || 0.5);
            cmd.toothHeight = parseFloat(sentence.match(/tooth\s+height\s+(-?\d+\.?\d*)/)?.[1] || 0.5);
        }
    }
};

// Generate a dynamic regex string of all shape names and aliases
const allShapeNames = Object.entries(SHAPES).reduce((acc, [name, { aliases }]) => {
    acc.push(name, ...aliases);
    return acc;
}, []);

export const SHAPE_NAMES_REGEX_PART = `(?:${allShapeNames.join('|')})`;