import { SHAPES, SHAPE_NAMES_REGEX_PART } from './shapes.js';
import * as Transforms from './transforms.js';
import { historyManager } from './history.js';

let scene, camera, renderer, controls;
let currentObjects = [];
let selectedObject = null;
let selectionHighlight = null;
let namedMeshMap = new Map();
let pendingBlueprintText = null;

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
    // A more robust way to add listeners. It checks if the element exists first.
    const addListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`DEBUG: Element with ID "${id}" not found. Cannot attach event listener.`);
        }
    };

    addListener('generate-btn', 'click', generateBlueprint);
    addListener('undo-btn', 'click', undoLastCommand);
    addListener('redo-btn', 'click', redoLastCommand);
    addListener('reset-view-btn', 'click', resetView);
    addListener('clear-scene-btn', 'click', clearScene);
    addListener('export-stl-btn', 'click', exportSTL);
    addListener('save-session-btn', 'click', saveCurrentSession);
    addListener('export-obj-btn', 'click', exportOBJ);
    addListener('confirm-blueprint-btn', 'click', confirmAndGenerate3D);
    addListener('cancel-blueprint-btn', 'click', cancelBlueprint);
    addListener('export-gltf-btn', 'click', exportGLTF);
    addListener('duplicate-btn', 'click', duplicateSelectedObject);

    document.querySelectorAll('.example').forEach(exampleEl => {
        exampleEl.addEventListener('click', () => {
            const exampleText = exampleEl.dataset.exampleText;
            console.log(`DEBUG: Example clicked: "${exampleText}"`);
            loadExample(exampleText);
        });
    });

    setupPropertiesPanelListeners();

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

async function generateBlueprint() {
    console.log('DEBUG: generateBlueprint called.');
    const text = document.getElementById('textInput').value;
    if (!text.trim()) {
        alert("Please describe an object first.");
        return;
    }
    pendingBlueprintText = text;

    const blueprintModal = document.getElementById('blueprint-modal');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    loadingIndicator.classList.remove('hidden');
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const commands = parseText(pendingBlueprintText);
        const { finalMeshes } = await _buildMeshesFromCommands(commands);

        if (finalMeshes.length > 0) {
            const tempScene = new THREE.Scene();
            finalMeshes.forEach(mesh => tempScene.add(mesh.clone())); // Use clones to not affect final meshes
            renderBlueprintViews(tempScene, finalMeshes);
            blueprintModal.classList.remove('hidden');
        } else {
            alert("Could not generate a valid blueprint from the description.");
        }
    } catch (error) {
        console.error("Blueprint generation failed:", error);
        alert(`An error occurred while generating the blueprint. Please check the console for details.\n\nError: ${error.message}`);
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function renderBlueprintViews(sceneToRender, objects) {
    const boundingBox = new THREE.Box3();
    objects.forEach(obj => boundingBox.expandByObject(obj));

    const size = boundingBox.getSize(new THREE.Vector3());
    const center = boundingBox.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const camSize = maxDim * 1.2;

    const views = {
        'front': { canvasId: 'blueprint-front-view', position: new THREE.Vector3(center.x, center.y, center.z + maxDim) },
        'top':   { canvasId: 'blueprint-top-view',   position: new THREE.Vector3(center.x, center.y + maxDim, center.z), up: new THREE.Vector3(0, 0, -1) },
        'side':  { canvasId: 'blueprint-side-view',  position: new THREE.Vector3(center.x + maxDim, center.y, center.z) }
    };

    for (const config of Object.values(views)) {
        const canvas = document.getElementById(config.canvasId);
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setClearColor(0xf0f2f5, 1);
        const cam = new THREE.OrthographicCamera(-camSize / 2, camSize / 2, camSize / 2, -camSize / 2, 0.1, maxDim * 2);
        cam.position.copy(config.position);
        if (config.up) cam.up.copy(config.up);
        cam.lookAt(center);
        renderer.render(sceneToRender, cam);
        renderer.dispose();
    }
}

// Text parsing and CAD generation
function parseText(text) {
    const commands = [];
    // Split commands by periods or the word "then" for more natural sequences.
    const sentences = text.toLowerCase().split(/\s*\.\s*|\s*\bthen\b\s*/i).filter(s => s.trim());
    
    sentences.forEach(sentence => {
        // Try parsing modification commands first
        let modificationCommand = Transforms.extractColorChange(sentence) || 
                              Transforms.extractMove(sentence) ||
                              Transforms.extractRotationChange(sentence) ||
                              Transforms.extractScaleChange(sentence) ||
                              Transforms.extractStandaloneCSG(sentence); // Added new parser
        
        // If no modification command, check for a feature command
        if (!modificationCommand) {
            modificationCommand = Transforms.extractFeature(sentence);
        }
        
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
            // A more specific regex to avoid capturing numbers from parameters like "teeth" or "radius".
            // It looks for a number at the start of the sentence, optionally preceded by a creation verb.
            const countMatch = sentence.match(/^(?:create|make|add)?\s*(\d+)\s+/i);
            if (countMatch && commands.length > 0) {
                const count = parseInt(countMatch[1]); // The number is in the first capturing group
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

async function confirmAndGenerate3D() {
    console.log('DEBUG: Blueprint confirmed. Generating final 3D model.');
    const blueprintModal = document.getElementById('blueprint-modal');
    blueprintModal.classList.add('hidden');

    if (pendingBlueprintText !== null) {
        historyManager.push(pendingBlueprintText);
        await _generateSceneFromText(pendingBlueprintText);
        updateUndoRedoStates();
        pendingBlueprintText = null;
    }
}

function cancelBlueprint() {
    const blueprintModal = document.getElementById('blueprint-modal');
    blueprintModal.classList.add('hidden');
    pendingBlueprintText = null;
    console.log('DEBUG: Blueprint cancelled.');
}

async function generateCAD() { // This is now the main entry point for non-blueprint generation
    console.log('DEBUG: generateCAD called.');
    const text = document.getElementById('textInput').value;
    historyManager.push(text);
    await _generateSceneFromText(text);
    updateUndoRedoStates();
}

async function _generateSceneFromText(text) { // This populates the MAIN scene
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
    const { finalMeshes, finalNamedMeshMap } = await _buildMeshesFromCommands(commands);

    // Populate the main scene with the results
    finalMeshes.forEach(mesh => addMeshToScene(mesh, -1)); // Add to global scene and trackers
    namedMeshMap = finalNamedMeshMap;

    console.log('DEBUG: Scene generation finished.');
    if (currentObjects.length > 0) {
        fitCameraToObjects();
    }
}

async function _buildMeshesFromCommands(commands) {
    console.log(`DEBUG: Parsed ${commands.length} commands.`);
    const meshMap = new Map();
    const localNamedMeshMap = new Map();
    
    for (const [index, cmd] of commands.entries()) { // Use for...of to allow await inside
        // Handle modification commands
        if (cmd.type === 'feature') {
            const targetData = localNamedMeshMap.get(cmd.target.value);
            if (targetData) {
                const targetMesh = targetData.mesh;
                const targetBox = new THREE.Box3().setFromObject(targetMesh);
                const targetSize = targetBox.getSize(new THREE.Vector3());

                let featureGeom;
                let featureMesh;
                let operation;

                if (cmd.featureType === 'groove') {
                    // For a groove, the 'height' from the command corresponds to the cutting tool's length.
                    featureGeom = new THREE.BoxGeometry(cmd.params.width, targetSize.y * 1.2, cmd.params.depth);
                    featureMesh = new THREE.Mesh(featureGeom);
                    operation = 'subtract';
                } else if (cmd.featureType === 'tab') {
                    featureGeom = new THREE.BoxGeometry(cmd.params.width, cmd.params.height, cmd.params.depth);
                    featureMesh = new THREE.Mesh(featureGeom);
                    operation = 'union';
                }

                if (featureMesh) {
                    // Position the feature relative to the target's face
                    // This is a simplified positioning logic
                    if (cmd.face === 'top') {
                        featureMesh.position.set(targetMesh.position.x, targetBox.max.y, targetMesh.position.z);
                    } // Add other faces (bottom, front, etc.) here as needed

                    let resultMesh;
                    if (operation === 'subtract') resultMesh = Transforms.performSubtraction(featureMesh, targetMesh);
                    if (operation === 'union') resultMesh = Transforms.performUnion(featureMesh, targetMesh);

                    resultMesh.name = targetMesh.name;
                    meshMap.set(targetData.index, [resultMesh]);
                    localNamedMeshMap.set(resultMesh.name, { mesh: resultMesh, index: targetData.index });
                }
            }
            continue;
        }

        if (cmd.type === 'modify') {
            if (cmd.isStandalone) { // Handle commands like "unite it with 'cuff'"
                // Find the tool mesh (the last created object)
                let toolMesh = null;
                let toolCmdIndex = -1;
                for (let j = index - 1; j >= 0; j--) {
                    if (meshMap.has(j)) {
                        const prevMeshes = meshMap.get(j);
                        if (prevMeshes.length > 0) {
                            toolMesh = prevMeshes[prevMeshes.length - 1];
                            toolCmdIndex = j;
                            break;
                        }
                    }
                }

                // Find the target mesh
                let targetMesh = null;
                let targetCmdIndex = -1;
                if (cmd.target.type === 'name' && localNamedMeshMap.has(cmd.target.value)) {
                    const targetData = localNamedMeshMap.get(cmd.target.value);
                    targetMesh = targetData.mesh;
                    targetCmdIndex = targetData.index;
                }

                if (toolMesh && targetMesh) {
                    let resultMesh;
                    if (cmd.action === 'union') resultMesh = Transforms.performUnion(toolMesh, targetMesh);
                    else if (cmd.action === 'subtract') resultMesh = Transforms.performSubtraction(toolMesh, targetMesh);
                    else if (cmd.action === 'intersection') resultMesh = Transforms.performIntersection(toolMesh, targetMesh);

                    if (resultMesh) {
                        // The tool mesh has been consumed, remove it from its original command's list
                        const toolMeshes = meshMap.get(toolCmdIndex);
                        meshMap.set(toolCmdIndex, toolMeshes.filter(m => m !== toolMesh));

                        // The target mesh has been replaced, update it in the maps
                        resultMesh.name = targetMesh.name;
                        meshMap.set(targetCmdIndex, [resultMesh]);
                        if (resultMesh.name) {
                            localNamedMeshMap.set(resultMesh.name, { mesh: resultMesh, index: targetCmdIndex });
                        }
                    }
                } else {
                    console.warn("Could not perform standalone CSG. Tool or target not found.", { tool: toolMesh, target: targetMesh });
                }
            }
            if (cmd.action === 'color' && cmd.target.type === 'name') {
                if (localNamedMeshMap.has(cmd.target.value)) {
                    const targetData = localNamedMeshMap.get(cmd.target.value);
                    targetData.mesh.material.color.set(cmd.color);
                }
            } else if (cmd.action === 'move' && cmd.target.type === 'name') {
                if (localNamedMeshMap.has(cmd.target.value)) {
                    const targetData = localNamedMeshMap.get(cmd.target.value);
                    const mesh = targetData.mesh;
                    mesh.position.set(
                        cmd.position.x ?? mesh.position.x,
                        cmd.position.y ?? mesh.position.y,
                        cmd.position.z ?? mesh.position.z
                    );
                }
            } else if (cmd.action === 'rotate' && cmd.target.type === 'name') {
                if (localNamedMeshMap.has(cmd.target.value)) {
                    const targetData = localNamedMeshMap.get(cmd.target.value);
                    const mesh = targetData.mesh;
                    mesh.rotation.x += cmd.rotation.x || 0;
                    mesh.rotation.y += cmd.rotation.y || 0;
                    mesh.rotation.z += cmd.rotation.z || 0;
                }
            } else if (cmd.action === 'scale' && cmd.target.type === 'name') {
                if (localNamedMeshMap.has(cmd.target.value)) {
                    const targetData = localNamedMeshMap.get(cmd.target.value);
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
                    if (localNamedMeshMap.has(csgTargetInfo.target.value)) {
                        const targetData = localNamedMeshMap.get(csgTargetInfo.target.value);
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
                    if (typeof CSG === 'undefined') {
                        console.error("CSG library is not loaded. Cannot perform CSG operations.");
                        createdMeshes.push(mesh);
                        continue;
                    }
                    // Show ghost and perform CSG operation
                    const ghostMaterial = new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.5
                    });

                    await new Promise(resolve => setTimeout(resolve, 50));

                        try { // This try/catch is for the CSG operation itself
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
                            scene.remove(mesh); // Remove the ghost
                            
                            // Replace the old mesh in the map with the new one
                            meshMap.set(targetCmdIndex, [resultMesh]);
                            if (resultMesh.name) {
                                localNamedMeshMap.set(resultMesh.name, { mesh: resultMesh, index: targetCmdIndex });
                            }
                        } catch (error) {
                            console.warn('CSG operation failed. The tool shape will be added to the scene instead.', error);
                            createdMeshes.push(mesh);
                        }
                } else {
                    createdMeshes.push(mesh);
                }
            } else {
                createdMeshes.push(mesh);
            }
        }

        if (createdMeshes.length > 0) {
            meshMap.set(index, createdMeshes);
            if (cmd.name) {
                const namedMesh = createdMeshes[0];
                namedMesh.name = cmd.name;
                localNamedMeshMap.set(cmd.name, { mesh: namedMesh, index: index });
            }
        }
    }

    // Collect all final meshes from the meshMap
    const finalMeshes = Array.from(meshMap.values()).flat();
    return { finalMeshes, finalNamedMeshMap: localNamedMeshMap };
}

function addMeshToScene(mesh, commandIndex) {
    scene.add(mesh);
    currentObjects.push(mesh);
    if (mesh.name) {
        namedMeshMap.set(mesh.name, { mesh: mesh, index: commandIndex });
    }
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