import { SHAPE_NAMES_REGEX_PART, SHAPES } from './shapes.js';

/**
 * Extracts position coordinates (x, y, z) from a text string.
 * @param {string} text The text to parse.
 * @returns {object|null} An object with x, y, z properties or null if no coordinates are found.
 */
export function extractPosition(text) {
    const pos = {};
    const coordRegex = /(x|y|z)\s+(-?\d+\.?\d*)/g;
    let match;
    let found = false;
    while ((match = coordRegex.exec(text)) !== null) {
        found = true;
        pos[match[1]] = parseFloat(match[2]);
    }
    return found ? pos : null;
}

/**
 * Extracts rotation angles (x, y, z) from a text string and converts to radians.
 * @param {string} text The text to parse.
 * @returns {object|null} An object with x, y, z rotation in radians, or null.
 */
export function extractRotation(text) {
    const rot = {};
    const rotRegex = /rotate(?:d)?\s+(?:by\s+)?(-?\d+\.?\d*)\s*(?:deg|degrees)?\s+on\s+(?:the\s+)?(x|y|z)/g;
    let match;
    let found = false;
    while ((match = rotRegex.exec(text)) !== null) {
        found = true;
        rot[match[2]] = THREE.MathUtils.degToRad(parseFloat(match[1]));
    }
    return found ? rot : null;
}

/**
 * Extracts a relational command (e.g., "on top of").
 * @param {string} text The text to parse.
 * @returns {object|null} An object with relationship and target shape, or null.
 */
export function extractRelationship(text) {
    const relRegex = new RegExp(`(on\\s+top\\s+of)\\s+(?:a|an|the)\\s+(?:object\\s+named\\s+["']([^"']+)["']|(${SHAPE_NAMES_REGEX_PART}))`);
    const match = text.match(relRegex);

    if (match) {
        const relationship = match[1].replace(/\s+/g, '-');
        const targetName = match[2];
        let targetShape = match[3];

        if (targetName) {
            return { relationship, target: { type: 'name', value: targetName } };
        }

        if (targetShape) {
            // Normalize alias
            for (const [shapeName, shapeConfig] of Object.entries(SHAPES)) {
                if (shapeConfig.aliases.includes(targetShape)) {
                    targetShape = shapeName;
                    break;
                }
            }
            return { relationship, target: { type: 'shape', value: targetShape } };
        }
    }
    return null;
}

/**
 * Extracts a subtraction command (e.g., "cut ... through ...").
 * @param {string} text The text to parse.
 * @returns {object|null} An object with the target shape for subtraction, or null.
 */
export function extractSubtraction(text) {
    const subRegex = new RegExp(`cut\\s+it\\s+through\\s+(?:a|an|the)\\s+(?:object\\s+named\\s+["']([^"']+)["']|(${SHAPE_NAMES_REGEX_PART}))`);
    const match = text.match(subRegex);

    if (match) {
        const targetName = match[1];
        let targetShape = match[2];

        if (targetName) {
            return { target: { type: 'name', value: targetName } };
        }
        if (targetShape) {
            for (const [shapeName, shapeConfig] of Object.entries(SHAPES)) {
                if (shapeConfig.aliases.includes(targetShape)) {
                    targetShape = shapeName;
                    break;
                }
            }
            return { target: { type: 'shape', value: targetShape } };
        }
    }
    return null;
}

/**
 * Extracts a union command (e.g., "unite with ...").
 * @param {string} text The text to parse.
 * @returns {object|null} An object with the target shape for union, or null.
 */
export function extractUnion(text) {
    const unionRegex = new RegExp(`(?:unite|combine|add)\\s+it\\s+(?:with|to)\\s+(?:a|an|the)\\s+(?:object\\s+named\\s+["']([^"']+)["']|(${SHAPE_NAMES_REGEX_PART}))`);
    const match = text.match(unionRegex);

    if (match) {
        const targetName = match[1];
        let targetShape = match[2];

        if (targetName) {
            return { target: { type: 'name', value: targetName } };
        }
        if (targetShape) {
            for (const [shapeName, shapeConfig] of Object.entries(SHAPES)) {
                if (shapeConfig.aliases.includes(targetShape)) {
                    targetShape = shapeName;
                    break;
                }
            }
            return { target: { type: 'shape', value: targetShape } };
        }
    }
    return null;
}

/**
 * Extracts an intersection command (e.g., "intersect with ...").
 * @param {string} text The text to parse.
 * @returns {object|null} An object with the target shape for intersection, or null.
 */
export function extractIntersection(text) {
    const intersectRegex = new RegExp(`intersect\\s+it\\s+with\\s+(?:a|an|the)\\s+(?:object\\s+named\\s+["']([^"']+)["']|(${SHAPE_NAMES_REGEX_PART}))`);
    const match = text.match(intersectRegex);

    if (match) {
        const targetName = match[1];
        let targetShape = match[2];

        if (targetName) {
            return { target: { type: 'name', value: targetName } };
        }
        if (targetShape) {
            for (const [shapeName, shapeConfig] of Object.entries(SHAPES)) {
                if (shapeConfig.aliases.includes(targetShape)) {
                    targetShape = shapeName;
                    break;
                }
            }
            return { target: { type: 'shape', value: targetShape } };
        }
    }
    return null;
}

/**
 * Extracts a name for an object from the text.
 * @param {string} text The text to parse.
 * @returns {string|null} The extracted name or null.
 */
export function extractName(text) {
    const nameRegex = /(?:named|called)\s+["']([^"']+)["']/;
    const match = text.match(nameRegex);
    return match ? match[1] : null;
}

/**
 * Applies rotation to a mesh based on a command object.
 * @param {THREE.Mesh} mesh The mesh to rotate.
 * @param {object} cmd The command object.
 */
export function applyRotation(mesh, cmd) {
    if (cmd.rotation) {
        mesh.rotation.set(
            cmd.rotation.x || 0,
            cmd.rotation.y || 0,
            cmd.rotation.z || 0
        );
    }
}

/**
 * Applies positioning to a mesh, handling relative, absolute, and automatic layouts.
 * @param {THREE.Mesh} mesh The mesh to position.
 * @param {object} cmd The command object.
 * @param {object} context Contains `index`, `count`, `commands`, and `meshMap`.
 * @returns {boolean} True if the position was set, otherwise false.
 */
export function applyPositioning(mesh, cmd, context) {
    const { index, i, count, commands, meshMap } = context;

    // Priority 1: Relative Positioning
    if (cmd.relative) {
        for (let j = index - 1; j >= 0; j--) {
            if (commands[j].type === cmd.relative.targetShape && meshMap.has(j)) {
                const targetMesh = meshMap.get(j)[0];
                const targetBox = new THREE.Box3().setFromObject(targetMesh);
                mesh.geometry.computeBoundingBox();
                const newObjectBaseOffset = -mesh.geometry.boundingBox.min.y;

                if (cmd.relative.relationship === 'on-top-of') {
                    mesh.position.set(targetMesh.position.x, targetBox.max.y + newObjectBaseOffset, targetMesh.position.z);
                    return true;
                }
            }
        }
    }

    // Priority 2: Absolute & Automatic Positioning
    const autoLayoutOffset = new THREE.Vector3(0, 0, 0);
    if (count > 1) {
        autoLayoutOffset.x = (i - (count - 1) / 2) * 2.5;
    }
    autoLayoutOffset.z = index * 3;

    mesh.position.set(
        cmd.position?.x ?? autoLayoutOffset.x,
        cmd.position?.y ?? autoLayoutOffset.y,
        cmd.position?.z ?? autoLayoutOffset.z
    );
    return true;
}

/**
 * Performs a CSG subtraction operation.
 * @param {THREE.Mesh} toolMesh The mesh to subtract.
 * @param {THREE.Mesh} targetMesh The mesh to be subtracted from.
 * @returns {THREE.Mesh} The resulting mesh from the subtraction.
 */
export function performSubtraction(toolMesh, targetMesh) {
    // Ensure matrices are up-to-date before CSG operation
    toolMesh.updateMatrix();
    targetMesh.updateMatrix();

    // Use the global THREE.CSG object from the included library
    const toolCSG = THREE.CSG.fromMesh(toolMesh);
    const targetCSG = THREE.CSG.fromMesh(targetMesh);

    const resultCSG = targetCSG.subtract(toolCSG);

    const resultMesh = THREE.CSG.toMesh(resultCSG, targetMesh.material);
    resultMesh.geometry.computeVertexNormals(); // Recalculate normals for correct lighting

    // Carry over the original position and rotation
    resultMesh.position.copy(targetMesh.position);
    resultMesh.rotation.copy(targetMesh.rotation);

    return resultMesh;
}

/**
 * Performs a CSG union operation.
 * @param {THREE.Mesh} toolMesh The mesh to unite.
 * @param {THREE.Mesh} targetMesh The mesh to be united with.
 * @returns {THREE.Mesh} The resulting mesh from the union.
 */
export function performUnion(toolMesh, targetMesh) {
    toolMesh.updateMatrix();
    targetMesh.updateMatrix();

    const toolCSG = THREE.CSG.fromMesh(toolMesh);
    const targetCSG = THREE.CSG.fromMesh(targetMesh);

    const resultCSG = targetCSG.union(toolCSG);

    const resultMesh = THREE.CSG.toMesh(resultCSG, targetMesh.material);
    resultMesh.geometry.computeVertexNormals();

    resultMesh.position.copy(targetMesh.position);
    resultMesh.rotation.copy(targetMesh.rotation);

    return resultMesh;
}

/**
 * Performs a CSG intersection operation.
 * @param {THREE.Mesh} toolMesh The mesh to intersect.
 * @param {THREE.Mesh} targetMesh The mesh to be intersected with.
 * @returns {THREE.Mesh} The resulting mesh from the intersection.
 */
export function performIntersection(toolMesh, targetMesh) {
    toolMesh.updateMatrix();
    targetMesh.updateMatrix();

    const toolCSG = THREE.CSG.fromMesh(toolMesh);
    const targetCSG = THREE.CSG.fromMesh(targetMesh);

    const resultCSG = targetCSG.intersect(toolCSG);

    const resultMesh = THREE.CSG.toMesh(resultCSG, targetMesh.material);
    resultMesh.geometry.computeVertexNormals();

    resultMesh.position.copy(targetMesh.position);
    resultMesh.rotation.copy(targetMesh.rotation);

    return resultMesh;
}