import { SHAPES, SHAPE_NAMES_REGEX_PART } from './shapes.js';
import * as Transforms from './transforms.js';
import { historyManager } from './history.js';

let scene, camera, renderer, controls;
let currentObjects = [];
let selectedObject = null;
let selectionHighlight = null;
let namedMeshMap = new Map();

// Initialize Three.js scene
async function initScene() {
    try {
        console.log('DEBUG: Initializing scene...');
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x2a2a2a);
        console.log('DEBUG: Scene created.');

        camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.set(5, 5, 5);
        console.log('DEBUG: Camera created.');

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        console.log('DEBUG: Renderer created.');

        const viewer = document.querySelector('.viewer');
        viewer.addEventListener('click', onCanvasClick);
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
        console.log('DEBUG: Lighting added.');

        // Add grid
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x444444);
        scene.add(gridHelper);
        console.log('DEBUG: Grid helper added.');

        setupOrbitControls();
        setupEventListeners();

        // Restore state from history
        const lastState = historyManager.getCurrentState();
        document.getElementById('textInput').value = lastState;
        renderSavedSessions();
        await _generateSceneFromText(lastState);
        updateUndoRedoStates();

        window.addEventListener('resize', onWindowResize);
        onWindowResize();

        animate();
        console.log('DEBUG: Scene initialization complete.');
    } catch (error) {
        console.error('FATAL: Scene initialization failed.', error);
        alert('A critical error occurred during initialization. Please check the console for details.');
    }
}

function setupEventListeners() {
    document.getElementById('generate-btn').addEventListener('click', generateCAD);
    document.getElementById('undo-btn').addEventListener('click', undoLastCommand);
    document.getElementById('redo-btn').addEventListener('click', redoLastCommand);
    document.getElementById('reset-view-btn').addEventListener('click', resetView);
    document.getElementById('clear-scene-btn').addEventListener('click', clearScene);
    document.getElementById('export-stl-btn').addEventListener('click', exportSTL);
    document.getElementById('save-session-btn').addEventListener('click', saveCurrentSession);
    document.getElementById('export-obj-btn').addEventListener('click', exportOBJ);
    document.getElementById('export-gltf-btn').addEventListener('click', exportGLTF);

    document.querySelectorAll('.example').forEach(exampleEl => {
        exampleEl.addEventListener('click', () => {
            const exampleText = exampleEl.dataset.exampleText;
            console.log(`DEBUG: Example clicked: "${exampleText}"`);
            loadExample(exampleText); // This will now trigger generation
        });
    });

    // Add listeners for the new properties panel
    setupPropertiesPanelListeners();
    document.getElementById('duplicate-btn').addEventListener('click', duplicateSelectedObject);

    console.log('DEBUG: Event listeners set up.');
}

function setupOrbitControls() {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 1.9;
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    console.log('DEBUG: Orbit controls set up.');
}

function onWindowResize() {
    const viewer = document.querySelector('.viewer');
    const width = viewer.clientWidth;
    const height = viewer.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

let frameCount = 0;
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    if (selectionHighlight && selectedObject) {
        selectionHighlight.position.copy(selectedObject.position);
        selectionHighlight.rotation.copy(selectedObject.rotation);
        selectionHighlight.scale.copy(selectedObject.scale);
    }
    renderer.render(scene, camera);
    if (frameCount < 5) { // Log first 5 frames to confirm render loop is active
        console.log('DEBUG: Animate loop running...');
        frameCount++;
    }
}

function onCanvasClick(event) {
    // Don't select if the user is dragging the camera
    if (controls.dragging) return;

    const viewer = document.querySelector('.viewer');
    const rect = viewer.getBoundingClientRect();

    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / viewer.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / viewer.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(currentObjects);

    if (intersects.length > 0) {
        // An object was clicked
        const newSelection = intersects[0].object;
        if (newSelection !== selectedObject) {
            selectObject(newSelection);
        }
    } else {
        // Nothing was clicked, deselect
        selectObject(null);
    }
}

function selectObject(object) {
    selectedObject = object;
    updateHighlight();
    updatePropertiesPanel();
}

function updateHighlight() {
    if (selectionHighlight) {
        scene.remove(selectionHighlight);
        selectionHighlight = null;
    }

    if (selectedObject) {
        const edges = new THREE.EdgesGeometry(selectedObject.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
        selectionHighlight = new THREE.LineSegments(edges, lineMaterial);
        scene.add(selectionHighlight);
        // The highlight will be updated with the object's transform in the animate loop
    }
}

function updatePropertiesPanel() {
    const panel = document.getElementById('properties-panel');
    if (!selectedObject) {
        panel.classList.add('hidden');
        return;
    }

    panel.classList.remove('hidden');

    // Populate fields
    document.getElementById('prop-name').textContent = selectedObject.name || 'Unnamed Object';
    
    document.getElementById('prop-pos-x').value = selectedObject.position.x.toFixed(2);
    document.getElementById('prop-pos-y').value = selectedObject.position.y.toFixed(2);
    document.getElementById('prop-pos-z').value = selectedObject.position.z.toFixed(2);

    document.getElementById('prop-rot-x').value = THREE.MathUtils.radToDeg(selectedObject.rotation.x).toFixed(1);
    document.getElementById('prop-rot-y').value = THREE.MathUtils.radToDeg(selectedObject.rotation.y).toFixed(1);
    document.getElementById('prop-rot-z').value = THREE.MathUtils.radToDeg(selectedObject.rotation.z).toFixed(1);

    document.getElementById('prop-scale-x').value = selectedObject.scale.x.toFixed(2);
    document.getElementById('prop-scale-y').value = selectedObject.scale.y.toFixed(2);
    document.getElementById('prop-scale-z').value = selectedObject.scale.z.toFixed(2);
}

function setupPropertiesPanelListeners() {
    const inputs = {
        'prop-pos-x': (val) => { selectedObject.position.x = val; },
        'prop-pos-y': (val) => { selectedObject.position.y = val; },
        'prop-pos-z': (val) => { selectedObject.position.z = val; },
        'prop-rot-x': (val) => { selectedObject.rotation.x = THREE.MathUtils.degToRad(val); },
        'prop-rot-y': (val) => { selectedObject.rotation.y = THREE.MathUtils.degToRad(val); },
        'prop-rot-z': (val) => { selectedObject.rotation.z = THREE.MathUtils.degToRad(val); },
        'prop-scale-x': (val) => { selectedObject.scale.x = val; },
        'prop-scale-y': (val) => { selectedObject.scale.y = val; },
        'prop-scale-z': (val) => { selectedObject.scale.z = val; },
    };

    for (const [id, updater] of Object.entries(inputs)) {
        const inputElement = document.getElementById(id);
        inputElement.addEventListener('input', (e) => {
            if (selectedObject) {
                updater(parseFloat(e.target.value));
            }
        });
    }
}

function duplicateSelectedObject() {
    if (!selectedObject) {
        console.log('DEBUG: Duplicate clicked, but no object selected.');
        return;
    }
    console.log(`DEBUG: Duplicating object: ${selectedObject.name || 'Unnamed Object'}`);

    // clone() creates a new mesh sharing the same geometry and material.
    // This is efficient and sufficient for transform-based modifications.
    const newMesh = selectedObject.clone();

    // Create a unique name for the duplicate
    let baseName = selectedObject.name ? selectedObject.name.replace(/_copy(_\d+)?$/, '') : 'Unnamed';
    let newName = `${baseName}_copy`;
    let counter = 1;
    while (namedMeshMap.has(newName)) {
        counter++;
        newName = `${baseName}_copy_${counter}`;
    }
    newMesh.name = newName;

    // Offset the new object slightly so it's visible
    newMesh.position.x += 1;

    // Add to scene and trackers, then select it
    addMeshToScene(newMesh, -1); // -1 index signifies it wasn't from a text command
    selectObject(newMesh);
}

// Text parsing and CAD generation
function parseText(text) {
    const commands = [];
    const sentences = text.toLowerCase().split(/[.!?]+/).filter(s => s.trim());
    
    sentences.forEach(sentence => {
        // Try parsing modification commands first
        let modificationCommand = Transforms.extractColorChange(sentence) || 
                              Transforms.extractMove(sentence) ||
                              Transforms.extractRotationChange(sentence) ||
                              Transforms.extractScaleChange(sentence);
        
        if (modificationCommand) {
            if (modificationCommand.action === 'color') {
                modificationCommand.color = extractColor(`a ${modificationCommand.colorName} object`);
                if (modificationCommand.color) {
                     commands.push(modificationCommand);
                     return;
                }
            } else {
                commands.push(modificationCommand);
                return;
            }
        }

        // If not a modification, parse shape creation commands
        let commandCreated = false;
        for (const [shapeName, shapeConfig] of Object.entries(SHAPES)) {
            const allNames = [shapeName, ...shapeConfig.aliases];
            if (allNames.some(name => sentence.includes(name))) {
                const cmd = {
                    type: shapeName,
                    color: 'blue',
                    position: null,
                    rotation: null,
                    relative: null,
                    name: null,
                    subtract: null,
                    union: null,
                    intersection: null
                };

                shapeConfig.parseParams(sentence, cmd);

                // Parse common attributes
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
                break;
            }
        }

        // Handle multiple objects
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

function renderSavedSessions() {
    const savedList = document.getElementById('saved-sessions-list');
    savedList.innerHTML = ''; // Clear existing list

    const sessions = historyManager.getSavedSessions();
    const sessionNames = Object.keys(sessions).sort();

    if (sessionNames.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No saved sessions.';
        li.classList.add('history-empty');
        savedList.appendChild(li);
        return;
    }

    sessionNames.forEach(name => {
        const li = document.createElement('li');
        li.classList.add('session-item');

        const nameSpan = document.createElement('span');
        nameSpan.textContent = name;
        nameSpan.classList.add('session-item-name');

        const buttonsDiv = document.createElement('div');
        buttonsDiv.classList.add('session-item-buttons');

        const loadBtn = document.createElement('button');
        loadBtn.textContent = 'Load';
        loadBtn.classList.add('control-btn-small');
        loadBtn.addEventListener('click', async () => {
            console.log(`DEBUG: Loading session: "${name}"`);
            const content = sessions[name];
            if (content !== null) {
                document.getElementById('textInput').value = content;
                await generateCAD();
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('control-btn-small', 'delete');
        deleteBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete the session "${name}"?`)) {
                console.log(`DEBUG: Deleting session: "${name}"`);
                historyManager.deleteSession(name);
                renderSavedSessions(); // Re-render the list
            }
        });

        buttonsDiv.appendChild(loadBtn);
        buttonsDiv.appendChild(deleteBtn);
        li.appendChild(nameSpan);
        li.appendChild(buttonsDiv);
        savedList.appendChild(li);
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

async function generateCAD() {
    console.log('DEBUG: generateCAD called.');
    const text = document.getElementById('textInput').value;
    historyManager.push(text);
    await _generateSceneFromText(text);
    updateUndoRedoStates();
}

async function _generateSceneFromText(text) {
    console.log('DEBUG: Starting scene generation from text.');
    updateHistory(text);

    // Clear existing objects
    currentObjects.forEach(obj => scene.remove(obj));
    currentObjects = [];
    selectObject(null); // Deselect any object when regenerating
    
    if (!text.trim()) {
        console.log('DEBUG: Text is empty, clearing scene and resetting view.');
        fitCameraToObjects();
        return;
    }

    const commands = parseText(text);
    console.log(`DEBUG: Parsed ${commands.length} commands.`);
    const meshMap = new Map();
    namedMeshMap.clear();
    
    for (const [index, cmd] of commands.entries()) {
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
            continue;
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
            
            // Apply transforms
            Transforms.applyRotation(mesh, cmd);
            Transforms.applyPositioning(mesh, cmd, { index, i, count, commands, meshMap });

            // Check for CSG operations (simplified)
            const csgOperation = cmd.subtract ? 'subtract' : (cmd.union ? 'union' : (cmd.intersection ? 'intersection' : null));
            const csgTargetInfo = cmd.subtract || cmd.union || cmd.intersection;

            if (csgOperation) {
                let targetMesh = null;
                let targetCmdIndex = -1;

                // Find target mesh
                if (csgTargetInfo.target.type === 'name') {
                    if (namedMeshMap.has(csgTargetInfo.target.value)) {
                        const targetData = namedMeshMap.get(csgTargetInfo.target.value);
                        targetMesh = targetData.mesh;
                        targetCmdIndex = targetData.index;
                    }
                } else {
                    for (let j = index - 1; j >= 0; j--) {
                        if (commands[j].type === csgTargetInfo.target.value && meshMap.has(j)) {
                            targetMesh = meshMap.get(j)[0];
                            targetCmdIndex = j;
                            break;
                        }
                    }
                }

                if (targetMesh) {
                    if (typeof THREE.CSG === 'undefined') {
                        console.error("THREE.CSGMesh.js is not loaded. Cannot perform CSG operations.");
                        // Fallback: just add the tool mesh as a normal object
                        scene.add(mesh);
                        createdMeshes.push(mesh);
                        continue; // to the next command
                    }
                    // Show ghost and perform CSG operation
                    const ghostMaterial = new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.5
                    });
                    mesh.material = ghostMaterial;
                    scene.add(mesh);

                    const loadingIndicator = document.getElementById('loading-indicator');
                    loadingIndicator.classList.remove('hidden');

                    await new Promise(resolve => setTimeout(resolve, 50));

                        try {
                            let resultMesh;
                            console.log(`DEBUG: Performing CSG operation: ${csgOperation}`);
                            if (csgOperation === 'subtract') {
                                resultMesh = Transforms.performSubtraction(mesh, targetMesh);
                            } else if (csgOperation === 'union') {
                                resultMesh = Transforms.performUnion(mesh, targetMesh);
                            } else if (csgOperation === 'intersection') {
                                resultMesh = Transforms.performIntersection(mesh, targetMesh);
                            }

                            resultMesh.name = targetMesh.name;
                            scene.remove(targetMesh);
                            scene.remove(mesh);
                            scene.add(resultMesh);

                            const targetIndexInCurrentObjects = currentObjects.indexOf(targetMesh);
                            if (targetIndexInCurrentObjects > -1) {
                                currentObjects.splice(targetIndexInCurrentObjects, 1, resultMesh);
                            }

                            meshMap.set(targetCmdIndex, [resultMesh]);
                            if (resultMesh.name) {
                                namedMeshMap.set(resultMesh.name, { mesh: resultMesh, index: targetCmdIndex });
                            }
                        } catch (error) {
                            console.warn('CSG operation failed. The tool shape will be added to the scene instead.', error);
                            // If CSG fails, just add the tool shape as a normal object
                            mesh.material = material; // Revert from ghost material
                            scene.add(mesh);
                            createdMeshes.push(mesh);
                        }

                    loadingIndicator.classList.add('hidden');
                } else {
                    scene.add(mesh);
                    createdMeshes.push(mesh);
                }
            } else {
                scene.add(mesh);
                createdMeshes.push(mesh);
            }
        }

        if (createdMeshes.length > 0) {
            meshMap.set(index, createdMeshes);
            if (cmd.name) {
                addNamedMesh(createdMeshes[0], cmd.name, index);
            }
            currentObjects.push(...createdMeshes);
        }
    }

    console.log('DEBUG: Scene generation finished.');
    if (currentObjects.length > 0) {
        fitCameraToObjects();
    }
}

function addMeshToScene(mesh, commandIndex) {
    scene.add(mesh);
    currentObjects.push(mesh);
    if (mesh.name) {
        addNamedMesh(mesh, mesh.name, commandIndex);
    }
}

function addNamedMesh(mesh, name, commandIndex) {
    mesh.name = name;
    namedMeshMap.set(name, { mesh: mesh, index: commandIndex });
}

function fitCameraToObjects() {
    console.log(`DEBUG: Fitting camera to ${currentObjects.length} objects.`);
    if (currentObjects.length === 0) {
        resetView();
        return;
    }
    
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
    
    controls.target.copy(center);
    controls.update();
}

async function loadExample(text) {
    document.getElementById('textInput').value = text;
    await generateCAD();
}

function resetView() {
    console.log('DEBUG: Resetting view.');
    controls.reset();
}

async function clearScene() {
    console.log('DEBUG: Clear Scene clicked.');
    document.getElementById('textInput').value = '';
    await generateCAD();
}

function saveCurrentSession() {
    const nameInput = document.getElementById('session-name-input');
    const sessionName = nameInput.value.trim();
    const content = document.getElementById('textInput').value;

    if (!sessionName) {
        alert('Please enter a name for the session.');
        return;
    }

    console.log(`DEBUG: Saving session: "${sessionName}"`);
    historyManager.saveSession(sessionName, content);
    renderSavedSessions();
    nameInput.value = ''; // Clear input after saving
}

async function undoLastCommand() {
    console.log('DEBUG: Undo clicked.');
    const previousText = historyManager.undo();
    if (previousText !== null) {
        document.getElementById('textInput').value = previousText;
        await _generateSceneFromText(previousText);
        updateUndoRedoStates();
    }
}

async function redoLastCommand() {
    console.log('DEBUG: Redo clicked.');
    const nextState = historyManager.redo();
    if (nextState !== null) {
        document.getElementById('textInput').value = nextState;
        await _generateSceneFromText(nextState);
        updateUndoRedoStates();
    }
}

function updateUndoRedoStates() {
    document.getElementById('undo-btn').disabled = !historyManager.canUndo();
    document.getElementById('redo-btn').disabled = !historyManager.canRedo();
}

function exportSTL() {
    try {
        console.log('DEBUG: Exporting to STL...');
        const objectsToExport = currentObjects.filter(obj => obj.isMesh);
        if (objectsToExport.length === 0) {
            alert('No objects to export! Please generate a model first.');
            return;
        }

        const exporter = new THREE.STLExporter();
        const result = exporter.parse(scene);
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model.stl';
        a.click();
        URL.revokeObjectURL(url);
        console.log('DEBUG: STL export successful.');
    } catch (error) {
        console.error('STL Export failed:', error);
        alert('STL export failed. The STLExporter might not be loaded correctly. Check the console for details.');
    }
}

function exportOBJ() {
    try {
        console.log('DEBUG: Exporting to OBJ...');
        const objectsToExport = currentObjects.filter(obj => obj.isMesh);
        if (objectsToExport.length === 0) {
            alert('No objects to export! Please generate a model first.');
            return;
        }

        const exporter = new THREE.OBJExporter();
        const result = exporter.parse(scene);
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model.obj';
        a.click();
        URL.revokeObjectURL(url);
        console.log('DEBUG: OBJ export successful.');
    } catch (error) {
        console.error('OBJ Export failed:', error);
        alert('OBJ export failed. The OBJExporter might not be loaded correctly. Check the console for details.');
    }
}

function exportGLTF() {
    try {
        console.log('DEBUG: Exporting to GLTF...');
        const objectsToExport = currentObjects.filter(obj => obj.isMesh);
        if (objectsToExport.length === 0) {
            alert('No objects to export! Please generate a model first.');
            return;
        }

        const exporter = new THREE.GLTFExporter();

        exporter.parse(
            scene,
            function (gltf) { // onCompleted callback
                const output = JSON.stringify(gltf, null, 2);
                const blob = new Blob([output], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'model.gltf';
                a.click();
                URL.revokeObjectURL(url);
                console.log('DEBUG: GLTF export successful.');
            },
            function (error) { // onError callback
                console.error('GLTF Export failed:', error);
                alert('GLTF export failed. Check the console for details.');
            }
        );
    } catch (error) {
        console.error('GLTF Export failed:', error);
        alert('GLTF export failed. The GLTFExporter might not be loaded correctly. Check the console for details.');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initScene);