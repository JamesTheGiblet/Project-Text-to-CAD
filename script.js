class CADObject {
    constructor(mesh, type, name) {
        this.mesh = mesh;
        this.geometry = mesh.geometry;
        this.material = mesh.material;
        this.type = type;
        this.name = name;
        this.originalGeometry = this.geometry.clone();
        this.faces = [];
        this.edges = [];
        this.vertices = [];
        this.setupSubElements();
    }
    
    setupSubElements() {
        // Setup face, edge, and vertex tracking
        const position = this.geometry.attributes.position;
        const index = this.geometry.index;
        
        if (position && index) {
            for (let i = 0; i < index.count; i += 3) {
                this.faces.push({
                    id: this.faces.length,
                    indices: [index.getX(i), index.getX(i + 1), index.getX(i + 2)],
                    selected: false
                });
            }
            
            for (let i = 0; i < position.count; i++) {
                this.vertices.push({
                    id: i,
                    position: new THREE.Vector3(
                        position.getX(i),
                        position.getY(i),
                        position.getZ(i)
                    ),
                    selected: false
                });
            }
        }
    }
}

class TextToCAD {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('previewCanvas'), 
            antialias: true 
        });
        
        this.objects = [];
        this.selectedObject = null;
        this.selectedElements = { faces: [], edges: [], vertices: [] };
        this.selectionMode = 'object'; // object, face, edge, vertex
        this.objectCounter = 0;
        this.wireframeMode = false;
        this.transformMode = 'none'; // move, rotate, scale
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.gltfLoader = new THREE.GLTFLoader();

        this.setupScene();
        this.setupEventListeners();
        this.animate();
    }
    
    setupScene() {
        this.scene.background = new THREE.Color(0x2a2a2a);
        
        // Enhanced lighting setup
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight1.position.set(50, 50, 50);
        directionalLight1.castShadow = true;
        this.scene.add(directionalLight1);
        
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-50, 50, -50);
        this.scene.add(directionalLight2);
        
        // Enhanced grid
        const gridHelper = new THREE.GridHelper(200, 20, 0x888888, 0x444444);
        this.scene.add(gridHelper);
        
        const axesHelper = new THREE.AxesHelper(50);
        this.scene.add(axesHelper);
        
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);
        
        this.setupMouseControls();
        this.resizeRenderer();
    }
    
    setupMouseControls() {
        const canvas = this.renderer.domElement;
        let isMouseDown = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
            
            // Handle selection
            this.handleSelection(e);
        });
        
        canvas.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            const deltaMove = {
                x: e.clientX - previousMousePosition.x,
                y: e.clientY - previousMousePosition.y
            };
            
            if (e.shiftKey) {
                // Pan
                const panSpeed = 0.5;
                this.camera.position.x -= deltaMove.x * panSpeed;
                this.camera.position.y += deltaMove.y * panSpeed;
            } else {
                // Rotate
                const rotationSpeed = 0.005;
                const spherical = new THREE.Spherical();
                spherical.setFromVector3(this.camera.position);
                spherical.theta -= deltaMove.x * rotationSpeed;
                spherical.phi += deltaMove.y * rotationSpeed;
                spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
                
                this.camera.position.setFromSpherical(spherical);
                this.camera.lookAt(0, 0, 0);
            }
            
            previousMousePosition = { x: e.clientX, y: e.clientY };
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 1.1 : 0.9;
            this.camera.position.multiplyScalar(scale);
        });
    }
    
    handleSelection(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        if (this.selectionMode === 'object') {
            const intersects = this.raycaster.intersectObjects(this.objects.map(obj => obj.mesh));
            if (intersects.length > 0) {
                const selectedMesh = intersects[0].object;
                this.selectedObject = this.objects.find(obj => obj.mesh === selectedMesh);
                this.updateSelectionDisplay();
            }
        }
    }
    
    setupEventListeners() {
        const commandInput = document.getElementById('commandInput');
        const submitButton = document.getElementById('submitButton');
        const examplesSelect = document.getElementById('examplesSelect');
        const modeButtons = document.querySelectorAll('.mode-btn');
        
        submitButton.addEventListener('click', () => {
            this.executeCommand(commandInput.value);
            commandInput.value = '';
        });
        
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.executeCommand(commandInput.value);
                commandInput.value = '';
            }
        });
        
        examplesSelect.addEventListener('change', () => {
            if (examplesSelect.value) {
                commandInput.value = examplesSelect.value;
                examplesSelect.value = '';
                commandInput.focus();
            }
        });
        
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectionMode = btn.getAttribute('data-mode');
                this.updateSelectionDisplay();
            });
        });
        
        // Control buttons
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        document.getElementById('clearScene').addEventListener('click', () => this.clearScene());
        document.getElementById('wireframe').addEventListener('click', () => this.toggleWireframe());
        document.getElementById('topView').addEventListener('click', () => this.setView('top'));
        document.getElementById('frontView').addEventListener('click', () => this.setView('front'));
        document.getElementById('isoView').addEventListener('click', () => this.setView('iso'));
        
        window.addEventListener('resize', () => this.resizeRenderer());
    }
    
    async executeCommand(command) {
        if (!command.trim()) return;

        this.addCommandToHistory(command, 'pending', 'Sending to backend...');

        try {
            const response = await fetch('http://127.0.0.1:5000/process_command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ command: command }),
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                this.addCommandToHistory(command, true, result.message);
                // The backend sends model data, let's load it.
                if (result.model_data) {
                    this.loadModelFromData(result.model_data, result.format);
                }
            } else {
                throw new Error(result.message || `Server responded with status ${response.status}`);
            }
        } catch (error) {
            console.error('Error communicating with backend:', error);
            this.addCommandToHistory(command, false, `Network or Backend Error: ${error.message}`);
        }
    }
    
    clearSelection() {
        if (this.selectedObject) {
            this.selectedObject.faces.forEach(face => face.selected = false);
            this.selectedObject.vertices.forEach(vertex => vertex.selected = false);
        }
        this.selectedElements = { faces: [], edges: [], vertices: [] };
    }
    
    highlightSelection() {
        // Visual feedback for selection would go here
        // In a real implementation, you'd highlight selected elements
    }
    
    updateSelectionDisplay() {
        const selectionInfo = document.getElementById('selectionInfo');
        const selectionProperties = document.getElementById('selectionProperties');
        
        let info = `Mode: ${this.selectionMode.charAt(0).toUpperCase() + this.selectionMode.slice(1)}`;
        
        if (this.selectedObject) {
            info += ` | Object: ${this.selectedObject.name}`;
            
            if (this.selectedElements.faces.length > 0) {
                info += ` | Faces: ${this.selectedElements.faces.length}`;
            }
            if (this.selectedElements.edges.length > 0) {
                info += ` | Edges: ${this.selectedElements.edges.length}`;
            }
            if (this.selectedElements.vertices.length > 0) {
                info += ` | Vertices: ${this.selectedElements.vertices.length}`;
            }
            
            // Update properties panel
            selectionProperties.innerHTML = `
                <div><strong>Object:</strong> ${this.selectedObject.name}</div>
                <div><strong>Type:</strong> ${this.selectedObject.type}</div>
                <div><strong>Position:</strong> (${this.selectedObject.mesh.position.x.toFixed(1)}, ${this.selectedObject.mesh.position.y.toFixed(1)}, ${this.selectedObject.mesh.position.z.toFixed(1)})</div>
                <div><strong>Rotation:</strong> (${(this.selectedObject.mesh.rotation.x * 180/Math.PI).toFixed(1)}°, ${(this.selectedObject.mesh.rotation.y * 180/Math.PI).toFixed(1)}°, ${(this.selectedObject.mesh.rotation.z * 180/Math.PI).toFixed(1)}°)</div>
                <div><strong>Scale:</strong> (${this.selectedObject.mesh.scale.x.toFixed(2)}, ${this.selectedObject.mesh.scale.y.toFixed(2)}, ${this.selectedObject.mesh.scale.z.toFixed(2)})</div>
                <div><strong>Faces:</strong> ${this.selectedObject.faces.length}</div>
                <div><strong>Vertices:</strong> ${this.selectedObject.vertices.length}</div>
            `;
        } else {
            info += ' | Selected: None';
            selectionProperties.innerHTML = '<p>No selection</p>';
        }
        
        selectionInfo.textContent = info;
    }
    
    addCommandToHistory(command, status, message) { // status can be true, false, or 'pending'
        const commandList = document.getElementById('commandList');

        // Find if there's a pending item for this command to update it
        let commandItem = Array.from(commandList.querySelectorAll('.command-item'))
            .find(item => item.dataset.command === command && item.classList.contains('pending'));

        if (!commandItem) {
            // If not updating a pending item, create a new one
            commandItem = document.createElement('div');
            commandList.prepend(commandItem);
        }

        const statusClass = status === 'pending' ? 'pending' : (status ? 'success' : 'error');
        const icon = status === 'pending' ? '⏳' : (status ? '✅' : '❌');

        commandItem.className = `command-item ${statusClass}`;
        commandItem.dataset.command = command; // Use a data attribute to track the command

        commandItem.innerHTML = `
            <div class="command-icon">${icon}</div>
            <div class="command-text">
                <strong>${command}</strong><br>
                <small>${message}</small>
            </div>
        `;
        
        if (commandList.children.length > 15) {
            commandList.removeChild(commandList.lastChild);
        }
    }
    
    updateObjectsList() {
        const objectsList = document.getElementById('objectsList');
        objectsList.innerHTML = '';
        
        this.objects.forEach((obj, index) => {
            const objectItem = document.createElement('div');
            objectItem.className = `object-item ${this.selectedObject === obj ? 'selected' : ''}`;
            objectItem.innerHTML = `
                <span>${obj.name}</span>
                <button class="delete-btn" onclick="cad.deleteObjectByIndex(${index})">×</button>
            `;
            objectItem.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-btn')) return;
                this.selectedObject = obj;
                this.clearSelection();
                this.updateSelectionDisplay();
                this.updateObjectsList();
            });
            objectsList.appendChild(objectItem);
        });
    }
    
    loadModelFromData(modelData, format) {
        if (format.toLowerCase() !== 'gltf') {
            this.addCommandToHistory('Model Loading', false, `Unsupported model format from backend: ${format}`);
            return;
        }

        this.gltfLoader.parse(modelData, '', (gltf) => {
            // For this example, we clear the scene to load the new object.
            // A more advanced version would add to the scene.
            this.clearScene();

            const sceneObject = gltf.scene;
            
            // The object from CadQuery might be nested. Find the first mesh.
            let mesh;
            sceneObject.traverse(child => {
                if (child.isMesh && !mesh) {
                    mesh = child;
                }
            });

            if (!mesh) {
                this.addCommandToHistory('Model Loading', false, 'No mesh found in model data from server.');
                return;
            }

            // Apply a standard material
            mesh.material = new THREE.MeshLambertMaterial({ color: 0xcccccc, wireframe: this.wireframeMode });

            const cadObject = new CADObject(mesh, 'imported', `Object ${++this.objectCounter}`);
            this.scene.add(cadObject.mesh);
            this.objects.push(cadObject);
            this.selectedObject = cadObject;

            this.updateObjectsList();
            this.updateSelectionDisplay();
            this.resetView(); // Frame the new object

        }, (error) => {
            console.error('An error happened during GLTF parsing:', error);
            this.addCommandToHistory('Model Loading', false, 'Failed to parse model from server.');
        });
    }

    deleteObjectByIndex(index) {
        if (this.objects[index]) {
            const obj = this.objects[index];
            this.scene.remove(obj.mesh);
            this.objects.splice(index, 1);
            
            if (this.selectedObject === obj) {
                this.selectedObject = null;
                this.clearSelection();
            }
            
            this.updateObjectsList();
            this.updateSelectionDisplay();
            this.addCommandToHistory(`Delete ${obj.name}`, true, `Deleted ${obj.name}`);
        }
    }
    
    clearScene() {
        this.objects.forEach(obj => {
            this.scene.remove(obj.mesh);
        });
        this.objects = [];
        this.selectedObject = null;
        this.clearSelection();
        this.updateObjectsList();
        this.updateSelectionDisplay();
    }
    
    resetView() {
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);
    }
    
    setView(viewType) {
        switch(viewType) {
            case 'top':
                this.camera.position.set(0, 150, 0);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'front':
                this.camera.position.set(0, 0, 150);
                this.camera.lookAt(0, 0, 0);
                break;
            case 'iso':
                this.camera.position.set(100, 100, 100);
                this.camera.lookAt(0, 0, 0);
                break;
        }
    }
    
    toggleWireframe() {
        this.wireframeMode = !this.wireframeMode;
        this.objects.forEach(obj => {
            obj.material.wireframe = this.wireframeMode;
        });
        
        const wireframeBtn = document.getElementById('wireframe');
        wireframeBtn.classList.toggle('active', this.wireframeMode);
    }
    
    resizeRenderer() {
        const canvas = this.renderer.domElement;
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the CAD system
let cad;
document.addEventListener('DOMContentLoaded', function() {
    cad = new TextToCAD();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'input') return;
        
        switch(e.key.toLowerCase()) {
            case 'g':
                cad.transformMode = 'move';
                cad.addCommandToHistory('Keyboard: G', true, 'Activated move mode');
                break;
            case 'r':
                cad.transformMode = 'rotate';
                cad.addCommandToHistory('Keyboard: R', true, 'Activated rotate mode');
                break;
            case 's':
                cad.transformMode = 'scale';
                cad.addCommandToHistory('Keyboard: S', true, 'Activated scale mode');
                break;
            case 'delete':
            case 'x':
                if (cad.selectedObject) {
                    const name = cad.selectedObject.name;
                    cad.deleteObjectByIndex(cad.objects.indexOf(cad.selectedObject));
                }
                break;
            case 'a':
                if (e.ctrlKey) {
                    e.preventDefault();
                    // Select all
                }
                break;
        }
    });
});