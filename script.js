import { SHAPES, SHAPE_NAMES_REGEX_PART } from './shapes.js';
import * as Transforms from './transforms.js';
import { historyManager } from './history.js';

let scene, camera, renderer, controls; // controls will now be OrbitControls

let currentObjects = [];



// Initialize Three.js scene

function initScene() {

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x2a2a2a);

    

    camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    camera.position.set(5, 5, 5);

    

    renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    

    const viewer = document.querySelector('.viewer');

    viewer.appendChild(renderer.domElement);

    

    // Add lighting

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);

    scene.add(ambientLight);

    

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);

    directionalLight.position.set(5, 5, 5);

    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 2048;

    directionalLight.shadow.mapSize.height = 2048;

    scene.add(directionalLight);

    

    // Add grid

    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x444444);

    scene.add(gridHelper);

    

    // Use OrbitControls for a better camera experience
    setupOrbitControls();

    // Setup UI event listeners
    setupEventListeners();

    // Restore state from history
    const lastState = historyManager.getCurrentState();
    document.getElementById('textInput').value = lastState;
    _generateSceneFromText(lastState);
    updateUndoRedoStates();

    

    // Handle resize

    window.addEventListener('resize', onWindowResize);

    onWindowResize();

    

    // Start render loop

    animate();

}

function setupEventListeners() {
    document.getElementById('generate-btn').addEventListener('click', generateCAD);
    document.getElementById('undo-btn').addEventListener('click', undoLastCommand);
    document.getElementById('redo-btn').addEventListener('click', redoLastCommand);
    document.getElementById('reset-view-btn').addEventListener('click', resetView);
    document.getElementById('export-stl-btn').addEventListener('click', exportSTL);
    document.getElementById('export-obj-btn').addEventListener('click', exportOBJ);

    document.querySelectorAll('.example').forEach(exampleEl => {
        exampleEl.addEventListener('click', () => {
            // The text is stored in a data attribute on the element
            const exampleText = exampleEl.dataset.exampleText;
            loadExample(exampleText);
        });
    });
}

function setupOrbitControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // Configure controls for a better experience
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Panning will be in 3D space
    controls.minDistance = 1;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 1.9; // Prevent camera from going below the grid
    // Match the previous control scheme (Right-click to pan)
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
}



function onWindowResize() {

    const viewer = document.querySelector('.viewer');

    const width = viewer.clientWidth;

    const height = viewer.clientHeight;

    

    camera.aspect = width / height;

    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

}



function animate() {

    requestAnimationFrame(animate);

    // required if controls.enableDamping or controls.autoRotate are set to true
    controls.update();

    renderer.render(scene, camera);

}



// Text parsing and CAD generation

function parseText(text) {

    const commands = [];

    const sentences = text.toLowerCase().split(/[.!?]+/).filter(s => s.trim());
    sentences.forEach(sentence => {
        // --- Try parsing modification commands first ---
        let modificationCommand = Transforms.extractColorChange(sentence) || 
                              Transforms.extractMove(sentence) ||
                              Transforms.extractRotationChange(sentence) ||
                              Transforms.extractScaleChange(sentence);
        if (modificationCommand) {
            if (modificationCommand.action === 'color') {
                // For color changes, we need to resolve the color name to a hex value.
                modificationCommand.color = extractColor(`a ${modificationCommand.colorName} object`);
                if (modificationCommand.color) {
                     commands.push(modificationCommand);
                     return; // This sentence is a modification command, so we're done with it.
                }
            } else {
                // For other modifications like 'move', 'rotate', 'scale'
                commands.push(modificationCommand);
                return; // This sentence is a modification command, so we're done with it.
            }
        }

        // --- If not a modification, parse shape creation commands ---
        let commandCreated = false;
        // Iterate over the defined shapes to find a match
        for (const [shapeName, shapeConfig] of Object.entries(SHAPES)) {
            const allNames = [shapeName, ...shapeConfig.aliases];
            if (allNames.some(name => sentence.includes(name))) {
                const cmd = {
                    type: shapeName,
                    color: 'blue', // default color
                    position: null,
                    rotation: null,
                    relative: null,
                    name: null,
                    subtract: null,
                    union: null,
                    intersection: null
                };

                // Use the shape-specific parser for its unique parameters
                shapeConfig.parseParams(sentence, cmd);

                // Parse common attributes applicable to all shapes
                cmd.name = Transforms.extractName(sentence);
                cmd.position = Transforms.extractPosition(sentence);
                cmd.rotation = Transforms.extractRotation(sentence);
                cmd.relative = Transforms.extractRelationship(sentence);
                cmd.subtract = Transforms.extractSubtraction(sentence);
                cmd.union = Transforms.extractUnion(sentence);
                cmd.intersection = Transforms.extractIntersection(sentence);
                cmd.color = extractColor(sentence) || 'blue';

                commands.push(cmd);
                commandCreated = true;
                break; // Stop after finding the first matching shape in the sentence
            }
        }

        // Handle multiple objects (if a command was created in this sentence)
        if (commandCreated) {
            const countMatch = sentence.match(/(\d+)\s+/);
            if (countMatch && commands.length > 0) {
                const count = parseInt(countMatch[1]);
                const lastCmd = commands[commands.length - 1];
                lastCmd.count = count;
            }
        }

        
    });

    

    return commands;

}

function updateHistory(fullText) {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;

    // Clear previous history
    historyList.innerHTML = '';

    const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());

    if (sentences.length === 0) {
        const li = document.createElement('li');
        li.textContent = "No commands in history.";
        li.classList.add('history-empty');
        historyList.appendChild(li);
        return;
    }

    sentences.forEach(sentence => {
        const li = document.createElement('li');
        li.textContent = sentence.trim();
        li.addEventListener('click', () => {
            document.getElementById('textInput').value = sentence.trim();
            generateCAD();
        });
        historyList.appendChild(li);
    });
}

function extractColor(text) {

    const colors = {

        'red': 0xff0000,

        'blue': 0x0066ff,

        'green': 0x00cc00,

        'yellow': 0xffcc00,

        'purple': 0x9900cc,

        'orange': 0xff6600,

        'pink': 0xff66cc,

        'cyan': 0x00cccc,

        'white': 0xffffff,

        'black': 0x333333,

        'gray': 0x808080,

        'grey': 0x808080

    };

    

    for (const [name, hex] of Object.entries(colors)) {

        if (text.includes(name)) return hex;

    }

    return null;

}



function generateCAD() {

    const text = document.getElementById('textInput').value;
    historyManager.push(text);
    _generateSceneFromText(text);
    updateUndoRedoStates();
}

function _generateSceneFromText(text) {
    updateHistory(text);

    // Clear existing objects

    currentObjects.forEach(obj => scene.remove(obj));

    currentObjects = [];

    
    // If the input is empty, just clear the scene and stop.
    if (!text.trim()) {
        return;
    }


    const commands = parseText(text);

    // A map to store generated meshes by their command index
    const meshMap = new Map();
    const namedMeshMap = new Map();
    
    

    commands.forEach((cmd, index) => {

        // Handle modification commands
        if (cmd.type === 'modify') {
            if (cmd.action === 'color' && cmd.target.type === 'name') {
                if (namedMeshMap.has(cmd.target.value)) {
                    const targetData = namedMeshMap.get(cmd.target.value);
                    targetData.mesh.material.color.set(cmd.color);
                }
            } else if (cmd.action === 'move' && cmd.target.type === 'name') {
                if (namedMeshMap.has(cmd.target.value)) {
                    const targetData = namedMeshMap.get(cmd.target.value);
                    const mesh = targetData.mesh;
                    // Apply new position, keeping existing coordinates if not specified
                    mesh.position.set(
                        cmd.position.x ?? mesh.position.x,
                        cmd.position.y ?? mesh.position.y,
                        cmd.position.z ?? mesh.position.z
                    );
                }
            } else if (cmd.action === 'rotate' && cmd.target.type === 'name') {
                if (namedMeshMap.has(cmd.target.value)) {
                    const targetData = namedMeshMap.get(cmd.target.value);
                    const mesh = targetData.mesh;
                    // Apply incremental rotation
                    mesh.rotation.x += cmd.rotation.x || 0;
                    mesh.rotation.y += cmd.rotation.y || 0;
                    mesh.rotation.z += cmd.rotation.z || 0;
                }
            } else if (cmd.action === 'scale' && cmd.target.type === 'name') {
                if (namedMeshMap.has(cmd.target.value)) {
                    const targetData = namedMeshMap.get(cmd.target.value);
                    targetData.mesh.scale.multiplyScalar(cmd.factor);
                }
            }
            return; // Skip to the next command
        }

        // Handle creation commands

        const count = cmd.count || 1;

        
        const createdMeshes = [];

        for (let i = 0; i < count; i++) {

            let geometry, material, mesh;

            

            material = new THREE.MeshLambertMaterial({ 

                color: cmd.color || 0x0066ff,

                transparent: true,

                opacity: 0.9

            });

            const shapeConfig = SHAPES[cmd.type];
            if (!shapeConfig) {
                console.warn(`Shape type "${cmd.type}" not recognized.`);
                continue;
            }
            geometry = shapeConfig.createGeometry(cmd);

            

            mesh = new THREE.Mesh(geometry, material);

            mesh.castShadow = true;

            mesh.receiveShadow = true;
            
            // Apply standard transforms (rotation, position)
            Transforms.applyRotation(mesh, cmd);
            Transforms.applyPositioning(mesh, cmd, { index, i, count, commands, meshMap });

            // Check for any CSG operation
            const csgOperation = cmd.subtract ? 'subtract' : (cmd.union ? 'union' : (cmd.intersection ? 'intersection' : null));
            const csgTargetInfo = cmd.subtract || cmd.union || cmd.intersection;

            if (csgOperation) {
                let targetMesh = null;
                let targetCmdIndex = -1;

                // Find the target mesh to operate on
                if (csgTargetInfo.target.type === 'name') {
                    if (namedMeshMap.has(csgTargetInfo.target.value)) {
                        const targetData = namedMeshMap.get(csgTargetInfo.target.value);
                        targetMesh = targetData.mesh;
                        targetCmdIndex = targetData.index;
                    }
                } else { // type is 'shape'
                    for (let j = index - 1; j >= 0; j--) {
                        if (commands[j].type === csgTargetInfo.target.value && meshMap.has(j)) {
                            targetMesh = meshMap.get(j)[0];
                            targetCmdIndex = j;
                            break;
                        }
                    }
                }

                if (targetMesh) {
                    // Show a "ghost" of the tool mesh before performing the operation
                    const ghostMaterial = new THREE.MeshBasicMaterial({
                        color: 0xffff00, // Bright yellow
                        wireframe: true,
                        transparent: true,
                        opacity: 0.5
                    });
                    mesh.material = ghostMaterial;
                    scene.add(mesh);

                    // Show loading indicator
                    const loadingIndicator = document.getElementById('loading-indicator');
                    loadingIndicator.style.display = 'flex';

                    // Perform the CSG operation after a short delay to allow UI to update
                    setTimeout(() => {
                        let resultMesh;
                        if (csgOperation === 'subtract') {
                            resultMesh = Transforms.performSubtraction(mesh, targetMesh);
                        } else if (csgOperation === 'union') {
                            resultMesh = Transforms.performUnion(mesh, targetMesh);
                        } else if (csgOperation === 'intersection') {
                            resultMesh = Transforms.performIntersection(mesh, targetMesh);
                        }

                        resultMesh.name = targetMesh.name; // Inherit name
                        // Replace the old mesh with the new one in the scene and trackers
                        scene.remove(targetMesh);
                        scene.remove(mesh); // Remove the ghost tool
                        scene.add(resultMesh);

                        // Update currentObjects array
                        const targetIndexInCurrentObjects = currentObjects.indexOf(targetMesh);
                        if (targetIndexInCurrentObjects > -1) {
                            currentObjects.splice(targetIndexInCurrentObjects, 1, resultMesh);
                        }

                        // Update meshMap
                        meshMap.set(targetCmdIndex, [resultMesh]);
                        if (resultMesh.name) {
                            namedMeshMap.set(resultMesh.name, { mesh: resultMesh, index: targetCmdIndex });
                        }

                        // Hide loading indicator
                        loadingIndicator.style.display = 'none';
                    }, 50); // A short delay allows the browser to render the loader before blocking

                } else {
                    // If target not found, just add the "tool" shape as a normal object
                    scene.add(mesh);
                    createdMeshes.push(mesh);
                }
            } else {
                // This is a normal object, not a CSG tool
                scene.add(mesh);
                createdMeshes.push(mesh);
            }
        }

        // Store the created meshes for this command so future commands can refer to them
        if (createdMeshes.length > 0) {
            meshMap.set(index, createdMeshes);
            if (cmd.name) {
                const namedMesh = createdMeshes[0];
                namedMesh.name = cmd.name;
                namedMeshMap.set(cmd.name, { mesh: namedMesh, index: index });
            }
            currentObjects.push(...createdMeshes);
        }
    });

    

    // Auto-fit camera if objects were created

    if (currentObjects.length > 0) {

        fitCameraToObjects();

    }

}



function fitCameraToObjects() {

    // If there are no objects to frame, reset the camera to the default view.
    if (currentObjects.length === 0) {
        resetView();
        return;
    }
    // Compute the bounding box of all current objects

    const box = new THREE.Box3();

    currentObjects.forEach(obj => box.expandByObject(obj));

    

    const size = box.getSize(new THREE.Vector3());

    const center = box.getCenter(new THREE.Vector3());

    

    const maxDim = Math.max(size.x, size.y, size.z);

    const distance = maxDim * 2;

    

    camera.position.set(

        center.x + distance * 0.5,

        center.y + distance * 0.5,

        center.z + distance * 0.5

    );

    // Update OrbitControls target to look at the center of the objects
    controls.target.copy(center);
    controls.update();
}



function loadExample(text) {

    document.getElementById('textInput').value = text;

}



function resetView() {
    // OrbitControls has a .reset() method to return to the state saved at instantiation.
    // It also resets the target.
    controls.reset();
}

function undoLastCommand() {
    const previousText = historyManager.undo();
    if (previousText !== null) {
        document.getElementById('textInput').value = previousText;
        _generateSceneFromText(previousText);
        updateUndoRedoStates();
    }
}

function redoLastCommand() {
    const nextState = historyManager.redo();
    if (nextState !== null) {
        document.getElementById('textInput').value = nextState;
        _generateSceneFromText(nextState);
        updateUndoRedoStates();
    }
}

function updateUndoRedoStates() {
    document.getElementById('undo-btn').disabled = !historyManager.canUndo();
    document.getElementById('redo-btn').disabled = !historyManager.canRedo();
}

function exportSTL() {

    const objectsToExport = currentObjects.filter(obj => obj.isMesh);
    if (objectsToExport.length === 0) {
        alert('No objects to export! Please generate a model first.');
        return;
    }

    const exporter = new THREE.STLExporter();

    // The exporter can parse the entire scene and will correctly handle meshes.
    // This is more robust than iterating through our `currentObjects` array.
    const result = exporter.parse(scene);

    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.stl';
    a.click();
    URL.revokeObjectURL(url);
}

function exportOBJ() {
    const objectsToExport = currentObjects.filter(obj => obj.isMesh);
    if (objectsToExport.length === 0) {
        alert('No objects to export! Please generate a model first.');
        return;
    }

    const exporter = new THREE.OBJExporter();

    // The exporter can parse the entire scene and will correctly handle meshes.
    const result = exporter.parse(scene);

    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.obj';
    a.click();
    URL.revokeObjectURL(url);
}



// Initialize when page loads

document.addEventListener('DOMContentLoaded', initScene);
