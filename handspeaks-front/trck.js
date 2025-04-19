import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';

const watch = new TouchSDK.Watch();
const mainContent = document.createElement('main');

// Configuration
const CONFIG = {
    sequenceLength: 120,
    inactivityTimeout: 3000,
    modelPath: '../3dmodel/arm.glb',
    apiEndpoint: 'http://127.0.0.1:5000',
    colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
        accent: '#e74c3c',
        background: '#f5f5f5',
        text: '#333333'
    },
    tones: [
        { id: 'friendly', label: 'Friendly', icon: '😊' },
        { id: 'professional', label: 'Professional', icon: '📝' },
        { id: 'casual', label: 'Casual', icon: '👕' },
        { id: 'persuasive', label: 'Persuasive', icon: '💬' }
    ]
};

// Application State
const appState = {
    sensorData: {
        acceleration: [0, 0, 0],
        gravity: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        orientation: [0, 0, 0, 0]
    },
    sensorDataBuffer: [],
    isCollectingData: true,
    currentSentence: [],
    sentenceHistory: [],
    inactivityTimer: null,
    startTime: null,
    handModel: null,
    scene: null,
    camera: null,
    renderer: null,
    selectedTone: 'friendly'
};

// Initialize the application
function initializeApp() {
    setupUI();
    setupThreeJS();
    setupEventListeners();
    startDataCollection();
}

// Set up the user interface
function setupUI() {
    // Reset body styles
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.fontFamily = "'Poppins', sans-serif";
    document.body.style.backgroundColor = CONFIG.colors.background;
    document.body.style.color = CONFIG.colors.text;
    document.body.style.minHeight = '100vh';
    document.body.style.display = 'flex';
    document.body.style.flexDirection = 'column';

    // Create header
    const header = document.createElement('header');
    header.style.position = 'sticky';
    header.style.top = '0';
    header.style.zIndex = '100';
    header.style.backgroundColor = CONFIG.colors.background;
    header.style.padding = '5px 0';
    header.style.margin = '0';
    document.body.appendChild(header);

    // Header container
    const headerContainer = document.createElement('div');
    headerContainer.style.display = 'flex';
    headerContainer.style.justifyContent = 'space-between';
    headerContainer.style.alignItems = 'center';
    headerContainer.style.width = '100%';
    headerContainer.style.maxWidth = '1200px';
    headerContainer.style.margin = '0 auto';
    headerContainer.style.padding = '0 20px';
    header.appendChild(headerContainer);

    // Title
    const title = document.createElement('h1');
    title.textContent = 'REAL TIME GESTURE TRACKING';
    title.style.margin = '0';
    title.style.color = CONFIG.colors.text;
    title.style.fontSize = '24px';

    // Connect Button
    const connectButton = watch.createConnectButton();
    connectButton.style.backgroundColor = CONFIG.colors.secondary;
    connectButton.style.color = 'white';
    connectButton.style.border = 'none';
    connectButton.style.borderRadius = '25px';
    connectButton.style.padding = '10px 20px';
    connectButton.style.fontSize = '14px';
    connectButton.style.cursor = 'pointer';
    connectButton.style.transition = 'all 0.3s ease';
    connectButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';

    connectButton.addEventListener('mouseover', () => {
        connectButton.style.transform = 'translateY(-2px)';
        connectButton.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
    });

    connectButton.addEventListener('mouseout', () => {
        connectButton.style.transform = 'translateY(0)';
        connectButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });

    watch.addEventListener('connected', () => {
        connectButton.textContent = 'Connected';
        connectButton.style.backgroundColor = '#27ae60';
        connectButton.style.cursor = 'default';
    });

    headerContainer.appendChild(title);
    headerContainer.appendChild(connectButton);

    // Main content
    const mainContent = document.createElement('main');
    mainContent.style.flex = '1';
    mainContent.style.width = '100%';
    mainContent.style.padding = '0';
    mainContent.style.marginTop = '0';
    document.body.appendChild(mainContent);

    // Center container
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.gap = '20px';
    container.style.width = '100%';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    mainContent.appendChild(container);

    // 3D Viewer Container
    const viewerContainer = document.createElement('div');
    viewerContainer.id = 'viewer-container';
    viewerContainer.style.width = '100%';
    viewerContainer.style.height = '500px';
    viewerContainer.style.backgroundColor = '#000';
    viewerContainer.style.borderRadius = '15px';
    viewerContainer.style.overflow = 'hidden';
    viewerContainer.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)';
    container.appendChild(viewerContainer);

    // Tone Selection Menu
    const toneMenuContainer = document.createElement('div');
    toneMenuContainer.style.width = '100%';
    toneMenuContainer.style.display = 'flex';
    toneMenuContainer.style.flexDirection = 'column';
    toneMenuContainer.style.gap = '10px';
    
    const toneLabel = document.createElement('div');
    toneLabel.textContent = 'Select Tone:';
    toneLabel.style.fontWeight = 'bold';
    toneLabel.style.fontSize = '16px';
    toneMenuContainer.appendChild(toneLabel);
    
    const toneButtonsContainer = document.createElement('div');
    toneButtonsContainer.style.display = 'flex';
    toneButtonsContainer.style.gap = '10px';
    toneButtonsContainer.style.flexWrap = 'wrap';
    
    CONFIG.tones.forEach(tone => {
        const toneButton = document.createElement('button');
        toneButton.textContent = `${tone.icon} ${tone.label}`;
        toneButton.dataset.tone = tone.id;
        toneButton.style.padding = '8px 12px';
        toneButton.style.borderRadius = '20px';
        toneButton.style.border = '1px solid #ddd';
        toneButton.style.backgroundColor = appState.selectedTone === tone.id ? CONFIG.colors.primary : 'white';
        toneButton.style.color = appState.selectedTone === tone.id ? 'white' : CONFIG.colors.text;
        toneButton.style.cursor = 'pointer';
        toneButton.style.transition = 'all 0.2s ease';
        
        toneButton.addEventListener('click', () => {
            appState.selectedTone = tone.id;
            document.querySelectorAll('[data-tone]').forEach(btn => {
                btn.style.backgroundColor = btn.dataset.tone === tone.id ? CONFIG.colors.primary : 'white';
                btn.style.color = btn.dataset.tone === tone.id ? 'white' : CONFIG.colors.text;
            });
        });
        
        toneButtonsContainer.appendChild(toneButton);
    });
    
    toneMenuContainer.appendChild(toneButtonsContainer);
    container.appendChild(toneMenuContainer);

    // Info Panel
    const infoPanel = document.createElement('div');
    infoPanel.style.width = '100%';
    infoPanel.style.display = 'flex';
    infoPanel.style.flexDirection = 'column';
    infoPanel.style.gap = '15px';
    container.appendChild(infoPanel);

    // Prediction Display
    const predictionDisplay = document.createElement('div');
    predictionDisplay.id = 'prediction';
    predictionDisplay.style.backgroundColor = CONFIG.colors.primary;
    predictionDisplay.style.color = 'white';
    predictionDisplay.style.padding = '15px';
    predictionDisplay.style.borderRadius = '10px';
    predictionDisplay.style.fontSize = '18px';
    predictionDisplay.style.textAlign = 'center';
    predictionDisplay.textContent = 'Waiting for gesture...';
    infoPanel.appendChild(predictionDisplay);

    // Time Display
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'timeTaken';
    timeDisplay.style.backgroundColor = 'rgba(0,0,0,0.05)';
    timeDisplay.style.padding = '15px';
    timeDisplay.style.borderRadius = '10px';
    timeDisplay.style.fontSize = '16px';
    timeDisplay.style.textAlign = 'center';
    timeDisplay.textContent = 'Processing time will appear here';
    infoPanel.appendChild(timeDisplay);

    // Sentence Display
    const sentenceDisplay = document.createElement('div');
    sentenceDisplay.id = 'sentence';
    sentenceDisplay.style.backgroundColor = CONFIG.colors.accent;
    sentenceDisplay.style.color = 'white';
    sentenceDisplay.style.padding = '20px';
    sentenceDisplay.style.borderRadius = '10px';
    sentenceDisplay.style.fontSize = '18px';
    sentenceDisplay.style.textAlign = 'center';
    sentenceDisplay.style.minHeight = '100px';
    sentenceDisplay.style.display = 'flex';
    sentenceDisplay.style.flexDirection = 'column';
    sentenceDisplay.style.gap = '10px';
    sentenceDisplay.innerHTML = `
        <div style="font-weight: bold;">Building Sentence</div>
        <div id="current-sentence" style="font-size: 1.2em;"></div>
        <div style="font-weight: bold; margin-top: 10px;">Sentence History</div>
        <div id="sentence-history" style="display: flex; flex-direction: column; gap: 5px;"></div>
    `;
    infoPanel.appendChild(sentenceDisplay);
}

// Set up Three.js scene
function setupThreeJS() {
    const container = document.getElementById('viewer-container');
    
    appState.scene = new THREE.Scene();
    appState.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    appState.camera.position.set(0, 30, 50);
    appState.camera.lookAt(0, 0, 0);

    appState.renderer = new THREE.WebGLRenderer({ antialias: true });
    appState.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(appState.renderer.domElement);

    // Lighting
    appState.scene.add(new THREE.AmbientLight(0x404040, 2));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5).normalize();
    appState.scene.add(directionalLight);

    // Load Hand Model
    const loader = new GLTFLoader();
    loader.load(CONFIG.modelPath, (gltf) => {
        appState.handModel = gltf.scene;
        appState.scene.add(appState.handModel);
        animate();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        appState.camera.aspect = container.clientWidth / container.clientHeight;
        appState.camera.updateProjectionMatrix();
        appState.renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (appState.handModel && isSensorDataValid()) {
        updateHandModel(appState.handModel);
    }
    appState.renderer.render(appState.scene, appState.camera);
}

// Set up event listeners for sensor data
function setupEventListeners() {
    watch.addEventListener('accelerationchanged', (e) => 
        appState.sensorData.acceleration = [e.detail.x, e.detail.y, e.detail.z]);
    watch.addEventListener('angularvelocitychanged', (e) => 
        appState.sensorData.angularVelocity = [e.detail.x, e.detail.y, e.detail.z]);
    watch.addEventListener('gravityvectorchanged', (e) => 
        appState.sensorData.gravity = [e.detail.x, e.detail.y, e.detail.z]);
    watch.addEventListener('orientationchanged', (e) => 
        appState.sensorData.orientation = [e.detail.x, e.detail.y, e.detail.z, e.detail.w]);
}

// Check if sensor data is valid
function isSensorDataValid() {
    const allValues = [
        ...appState.sensorData.acceleration,
        ...appState.sensorData.gravity,
        ...appState.sensorData.angularVelocity,
        ...appState.sensorData.orientation
    ];
    return allValues.every(v => v !== 0);
}

// Update hand model rotation based on sensor data
function updateHandModel(model) {
    const [x, y, z, w] = appState.sensorData.orientation;
    const quaternion = new THREE.Quaternion(y, -z, x, -w);
    model.rotation.setFromQuaternion(quaternion);
}

// Start collecting sensor data
function startDataCollection() {
    setInterval(() => {
        if (!appState.isCollectingData || !isSensorDataValid()) return;
        
        if (appState.sensorDataBuffer.length === 0) {
            appState.startTime = Date.now();
        }
        
        appState.sensorDataBuffer.push([
            ...appState.sensorData.acceleration,
            ...appState.sensorData.gravity,
            ...appState.sensorData.angularVelocity,
            ...appState.sensorData.orientation.slice(0, 3)
        ]);

        if (appState.sensorDataBuffer.length >= CONFIG.sequenceLength) {
            processDataBuffer();
        }
    }, 20);
}

// Process collected sensor data
function processDataBuffer() {
    appState.isCollectingData = false;
    const timeTaken = (Date.now() - appState.startTime) / 1000;
    document.getElementById('timeTaken').textContent = `Processed in: ${timeTaken.toFixed(2)}s`;
    
    sendDataToFlask(appState.sensorDataBuffer.slice(0, CONFIG.sequenceLength));
    appState.sensorDataBuffer = [];
    setTimeout(() => { appState.isCollectingData = true; }, 1000);
}

// Send data to Flask backend for prediction
async function sendDataToFlask(dataToSend) {
    try {
        const response = await fetch(`${CONFIG.apiEndpoint}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sensor_data: dataToSend.flat() })
        });

        const data = await response.json();
        if (data.prediction) {
            handlePrediction(data.prediction);
        }
    } catch (error) {
        console.error('Prediction error:', error);
        document.getElementById('prediction').textContent = 'Error getting prediction';
    }
}

// Handle prediction results
function handlePrediction(prediction) {
    clearTimeout(appState.inactivityTimer);
    document.getElementById('prediction').textContent = `Current Gesture: ${prediction}`;

    if (prediction === "no gesture") {
        appState.inactivityTimer = setTimeout(finalizeSentence, CONFIG.inactivityTimeout);
    } else {
        appState.currentSentence.push(prediction);
        updateSentenceDisplay();
        speak(prediction);
    }
}

// Update the sentence display
function updateSentenceDisplay() {
    const currentSentenceEl = document.getElementById('current-sentence');
    currentSentenceEl.textContent = appState.currentSentence.join(' ');
}

// Finalize the current sentence and send for grammar correction
async function finalizeSentence() {
    if (appState.currentSentence.length > 0) {
        const originalSentence = appState.currentSentence.join(' ');
        
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/enhance-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: originalSentence,
                    tone: appState.selectedTone
                })
            });
            
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            addToHistory(
                originalSentence, 
                result.grammar_corrected, 
                result.tone_adjusted
            );
            
            speak(result.tone_adjusted);
            
        } catch (error) {
            console.error('Text enhancement failed:', error);
            addToHistory(originalSentence, originalSentence, originalSentence);
            speak(originalSentence);
        }
        
        appState.currentSentence = [];
        updateSentenceDisplay();
    }
}

// Add sentence to history display
function addToHistory(original, corrected, enhanced) {
    const historyItem = document.createElement('div');
    historyItem.style.display = 'flex';
    historyItem.style.flexDirection = 'column';
    historyItem.style.gap = '5px';
    historyItem.style.backgroundColor = 'rgb(153, 153, 255)';
    historyItem.style.padding = '10px';
    historyItem.style.borderRadius = '5px';
    historyItem.style.marginBottom = '10px';
    
    historyItem.innerHTML = `
        <div style="font-size: 0.9em; color: #000000;">Original: 
            <span style="text-decoration: line-through;">${original}</span>
        </div>
        <div style="font-size: 0.9em; color: #595959;">Grammar corrected: 
            <span>${corrected}</span>
        </div>
        <div style="font-size: 1em; font-weight: bold;">Enhanced (${appState.selectedTone}): 
            <span style="color: #fff;">${enhanced}</span>
        </div>
    `;
    
    document.getElementById('sentence-history').prepend(historyItem);
    appState.sentenceHistory.push({ original, corrected, enhanced });
}

// Text-to-speech function
function speak(text) {
    if (!window.speechSynthesis || !text.trim()) return;
    
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Adjust speech parameters based on selected tone
    switch(appState.selectedTone) {
        case 'professional':
            utterance.rate = 0.9;
            utterance.pitch = 0.9;
            break;
        case 'persuasive':
            utterance.rate = 1.1;
            utterance.pitch = 1.1;
            break;
        case 'excited':
            utterance.rate = 1.2;
            utterance.pitch = 1.2;
            break;
        case 'casual':
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            break;
        default: // friendly
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
    }
    
    speechSynthesis.speak(utterance);
}

// Start the application
initializeApp();