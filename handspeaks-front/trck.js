    import * as THREE from 'three';
    import { GLTFLoader } from 'GLTFLoader';

    const watch = new TouchSDK.Watch();
    const mainContent = document.createElement('main');

    // Configuration with Apple design system and ElevenLabs integration
    const CONFIG = {
        sequenceLength: 120,
        inactivityTimeout: 3000,
        modelPath: '../3dmodel/arm.glb',
        apiEndpoint: 'http://127.0.0.1:5000',
        colors: {
            primary: '#007AFF',       // Apple Blue
            primaryDark: '#0066CC',   // Darker Blue for pressed states
            secondary: '#34C759',     // Apple Green
            secondaryDark: '#2DBE4F', // Darker Green
            accent: '#FF3B30',        // Apple Red
            accentDark: '#E63329',    // Darker Red
            background: '#F2F2F7',    // System Gray 6
            cardBackground: '#FFFFFF', // White for cards
            text: '#1C1C1E',          // Label
            secondaryText: '#636366',  // Secondary Label
            tertiaryText: '#AEAEB2',   // Tertiary Label
            separator: '#D1D1D6',     // Separator
            systemFill: '#78788033'    // System Fill with 20% opacity
        },
        tones: [
            { id: 'friendly', label: 'Friendly', icon: '😊', color: '#007AFF' },
            { id: 'professional', label: 'Professional', icon: '📝', color: '#5856D6' },
            { id: 'casual', label: 'Casual', icon: '👕', color: '#FF9500' },
            { id: 'persuasive', label: 'Persuasive', icon: '💬', color: '#FF2D55' }
        ],
        typography: {
            largeTitle: '28px',
            title1: '22px',
            title2: '20px',
            title3: '18px',
            headline: '17px',
            body: '16px',
            callout: '15px',
            subhead: '14px',
            footnote: '13px',
            caption1: '12px',
            caption2: '11px'
        },
        spacing: {
            small: '8px',
            medium: '16px',
            large: '24px',
            xLarge: '32px'
        },
        cornerRadius: {
            small: '6px',
            medium: '12px',
            large: '16px'
        },
        elevenLabs: {
            apiKey: 'sk_54a1f2fe7f949692dd39c14b33824298f75a8956d1d77554',
            voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
            modelId: 'eleven_monolingual_v1',
            apiEndpoint: 'https://api.elevenlabs.io/v1/text-to-speech'
        }
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
        selectedTone: 'friendly',
        isSpeaking: false
    };

    // Helper function for Apple-style press animations
    function applyPressAnimation(element, darkColor) {
        element.addEventListener('mousedown', () => {
            element.style.transition = 'none';
            element.style.backgroundColor = darkColor;
        });
        
        element.addEventListener('mouseup', () => {
            element.style.transition = 'background-color 0.3s ease';
            element.style.backgroundColor = '';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transition = 'background-color 0.3s ease';
            element.style.backgroundColor = '';
        });
    }

    // Initialize the application
    function initializeApp() {
        setupUI();
        setupThreeJS();
        setupEventListeners();
        startDataCollection();
    }

    // Set up the user interface with Apple design
    function setupUI() {
        // Reset body styles
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.fontFamily = "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif";
        document.body.style.backgroundColor = CONFIG.colors.background;
        document.body.style.color = CONFIG.colors.text;
        document.body.style.minHeight = '100vh';
        document.body.style.display = 'flex';
        document.body.style.flexDirection = 'column';
        document.body.style.overflowX = 'hidden';

        // Create header with Apple-style navigation bar
        const header = document.createElement('header');
        header.style.position = 'sticky';
        header.style.top = '0';
        header.style.zIndex = '1000';
        header.style.backgroundColor = 'rgba(242, 242, 247, 0.6)';
        header.style.backdropFilter = 'blur(20px)';
        header.style.padding = '12px 0';
        header.style.borderBottom = `1px solid ${CONFIG.colors.separator}`;
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
        headerContainer.style.padding = `0 ${CONFIG.spacing.medium}`;
        header.appendChild(headerContainer);

        // Title with Apple-style typography
        const title = document.createElement('h1');
        title.textContent = 'Gesture Tracking';
        title.style.margin = '0';
        title.style.color = CONFIG.colors.text;
        title.style.fontSize = CONFIG.typography.title3;
        title.style.fontWeight = '600';
        title.style.letterSpacing = '-0.2px';

        // Connect Button with Apple-style design
        const connectButton = watch.createConnectButton();
        connectButton.style.backgroundColor = CONFIG.colors.primary;
        connectButton.style.color = 'white';
        connectButton.style.border = 'none';
        connectButton.style.borderRadius = CONFIG.cornerRadius.medium;
        connectButton.style.padding = `${CONFIG.spacing.small} ${CONFIG.spacing.medium}`;
        connectButton.style.fontSize = CONFIG.typography.subhead;
        connectButton.style.fontWeight = '500';
        connectButton.style.cursor = 'pointer';
        connectButton.style.transition = 'background-color 0.3s ease, transform 0.3s ease';
        connectButton.style.boxShadow = 'none';
        connectButton.style.webkitAppearance = 'none';
        connectButton.style.fontFamily = 'inherit';

        // Apple-style button interactions
        connectButton.addEventListener('mouseover', () => {
            connectButton.style.backgroundColor = CONFIG.colors.primaryDark;
        });

        connectButton.addEventListener('mouseout', () => {
            connectButton.style.backgroundColor = CONFIG.colors.primary;
        });

        watch.addEventListener('connected', () => {
            connectButton.textContent = 'Connected';
            connectButton.style.backgroundColor = CONFIG.colors.secondary;
            connectButton.addEventListener('mouseover', () => {
                connectButton.style.backgroundColor = CONFIG.colors.secondary;
            });
        });

        headerContainer.appendChild(title);
        headerContainer.appendChild(connectButton);

        // Main content area
        const mainContent = document.createElement('main');
        mainContent.style.flex = '1';
        mainContent.style.width = '100%';
        mainContent.style.padding = `${CONFIG.spacing.medium} 0`;
        mainContent.style.marginTop = '0';
        document.body.appendChild(mainContent);

        // Center container with Apple-style layout
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = CONFIG.spacing.large;
        container.style.width = '100%';
        container.style.maxWidth = '1200px';
        container.style.margin = '0 auto';
        container.style.padding = `0 ${CONFIG.spacing.medium}`;
        mainContent.appendChild(container);

        // 3D Viewer Container with Apple-style card
        const viewerContainer = document.createElement('div');
        viewerContainer.id = 'viewer-container';
        viewerContainer.style.width = '100%';
        viewerContainer.style.height = '400px';
        viewerContainer.style.backgroundColor = '#000';
        viewerContainer.style.borderRadius = CONFIG.cornerRadius.large;
        viewerContainer.style.overflow = 'hidden';
        viewerContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        container.appendChild(viewerContainer);

        // Tone Selection Menu with Apple-style segmented control
        const toneMenuContainer = document.createElement('div');
        toneMenuContainer.style.width = '100%';
        toneMenuContainer.style.display = 'flex';
        toneMenuContainer.style.flexDirection = 'column';
        toneMenuContainer.style.gap = CONFIG.spacing.small;
        
        const toneLabel = document.createElement('div');
        toneLabel.textContent = 'SELECT TONE';
        toneLabel.style.fontWeight = '600';
        toneLabel.style.fontSize = CONFIG.typography.footnote;
        toneLabel.style.color = CONFIG.colors.secondaryText;
        toneLabel.style.letterSpacing = '0.5px';
        toneLabel.style.textTransform = 'uppercase';
        toneMenuContainer.appendChild(toneLabel);
        
        const toneButtonsContainer = document.createElement('div');
        toneButtonsContainer.style.display = 'flex';
        toneButtonsContainer.style.gap = CONFIG.spacing.small;
        toneButtonsContainer.style.flexWrap = 'wrap';
        toneButtonsContainer.style.width = '100%';
        
        // Create Apple-style segmented control
        const segmentedControl = document.createElement('div');
        segmentedControl.style.display = 'flex';
        segmentedControl.style.backgroundColor = CONFIG.colors.systemFill;
        segmentedControl.style.borderRadius = CONFIG.cornerRadius.medium;
        segmentedControl.style.padding = '3px';
        segmentedControl.style.width = '100%';
        
        CONFIG.tones.forEach((tone, index) => {
            const segment = document.createElement('button');
            segment.textContent = `${tone.icon} ${tone.label}`;
            segment.dataset.tone = tone.id;
            segment.style.flex = '1';
            segment.style.padding = '8px 12px';
            segment.style.border = 'none';
            segment.style.borderRadius = '7px';
            segment.style.backgroundColor = appState.selectedTone === tone.id ? tone.color : 'transparent';
            segment.style.color = appState.selectedTone === tone.id ? 'white' : CONFIG.colors.text;
            segment.style.cursor = 'pointer';
            segment.style.transition = 'background-color 0.3s ease, color 0.3s ease';
            segment.style.fontSize = CONFIG.typography.subhead;
            segment.style.fontWeight = '500';
            segment.style.textAlign = 'center';
            segment.style.whiteSpace = 'nowrap';
            segment.style.overflow = 'hidden';
            segment.style.textOverflow = 'ellipsis';
            segment.style.webkitAppearance = 'none';
            segment.style.fontFamily = 'inherit';
            
            segment.addEventListener('click', () => {
                appState.selectedTone = tone.id;
                document.querySelectorAll('[data-tone]').forEach(btn => {
                    const currentTone = CONFIG.tones.find(t => t.id === btn.dataset.tone);
                    btn.style.backgroundColor = btn.dataset.tone === tone.id ? currentTone.color : 'transparent';
                    btn.style.color = btn.dataset.tone === tone.id ? 'white' : CONFIG.colors.text;
                });
            });
            
            segmentedControl.appendChild(segment);
        });
        
        toneButtonsContainer.appendChild(segmentedControl);
        toneMenuContainer.appendChild(toneButtonsContainer);
        container.appendChild(toneMenuContainer);

        // Info Panel with Apple-style cards
        const infoPanel = document.createElement('div');
        infoPanel.style.width = '100%';
        infoPanel.style.display = 'flex';
        infoPanel.style.flexDirection = 'column';
        infoPanel.style.gap = CONFIG.spacing.medium;
        container.appendChild(infoPanel);

        // Prediction Display with Apple-style callout
        const predictionCard = document.createElement('div');
        predictionCard.style.backgroundColor = CONFIG.colors.cardBackground;
        predictionCard.style.borderRadius = CONFIG.cornerRadius.medium;
        predictionCard.style.padding = CONFIG.spacing.medium;
        predictionCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        
        const predictionHeader = document.createElement('div');
        predictionHeader.textContent = 'Current Gesture';
        predictionHeader.style.fontWeight = '600';
        predictionHeader.style.fontSize = CONFIG.typography.subhead;
        predictionHeader.style.color = CONFIG.colors.secondaryText;
        predictionHeader.style.marginBottom = CONFIG.spacing.small;
        predictionCard.appendChild(predictionHeader);
        
        const predictionDisplay = document.createElement('div');
        predictionDisplay.id = 'prediction';
        predictionDisplay.style.color = CONFIG.colors.primary;
        predictionDisplay.style.fontSize = CONFIG.typography.headline;
        predictionDisplay.style.fontWeight = '600';
        predictionDisplay.style.textAlign = 'center';
        predictionDisplay.textContent = 'Waiting for gesture...';
        predictionCard.appendChild(predictionDisplay);
        
        infoPanel.appendChild(predictionCard);

        // Time Display with Apple-style caption
        const timeCard = document.createElement('div');
        timeCard.style.backgroundColor = CONFIG.colors.cardBackground;
        timeCard.style.borderRadius = CONFIG.cornerRadius.medium;
        timeCard.style.padding = CONFIG.spacing.medium;
        timeCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        
        const timeHeader = document.createElement('div');
        timeHeader.textContent = 'Processing Time';
        timeHeader.style.fontWeight = '600';
        timeHeader.style.fontSize = CONFIG.typography.subhead;
        timeHeader.style.color = CONFIG.colors.secondaryText;
        timeHeader.style.marginBottom = CONFIG.spacing.small;
        timeCard.appendChild(timeHeader);
        
        const timeDisplay = document.createElement('div');
        timeDisplay.id = 'timeTaken';
        timeDisplay.style.color = CONFIG.colors.text;
        timeDisplay.style.fontSize = CONFIG.typography.body;
        timeDisplay.style.textAlign = 'center';
        timeDisplay.textContent = '—';
        timeCard.appendChild(timeDisplay);
        
        infoPanel.appendChild(timeCard);

        // Sentence Display with Apple-style list
        const sentenceCard = document.createElement('div');
        sentenceCard.style.backgroundColor = CONFIG.colors.cardBackground;
        sentenceCard.style.borderRadius = CONFIG.cornerRadius.medium;
        sentenceCard.style.padding = CONFIG.spacing.medium;
        sentenceCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
        
        const sentenceHeader = document.createElement('div');
        sentenceHeader.textContent = 'Sentence Builder';
        sentenceHeader.style.fontWeight = '600';
        sentenceHeader.style.fontSize = CONFIG.typography.subhead;
        sentenceHeader.style.color = CONFIG.colors.secondaryText;
        sentenceHeader.style.marginBottom = CONFIG.spacing.small;
        sentenceCard.appendChild(sentenceHeader);
        
        const currentSentenceContainer = document.createElement('div');
        currentSentenceContainer.style.marginBottom = CONFIG.spacing.medium;
        
        const currentSentenceLabel = document.createElement('div');
        currentSentenceLabel.textContent = 'Current';
        currentSentenceLabel.style.fontWeight = '500';
        currentSentenceLabel.style.fontSize = CONFIG.typography.footnote;
        currentSentenceLabel.style.color = CONFIG.colors.secondaryText;
        currentSentenceLabel.style.marginBottom = '4px';
        currentSentenceContainer.appendChild(currentSentenceLabel);
        
        const currentSentenceEl = document.createElement('div');
        currentSentenceEl.id = 'current-sentence';
        currentSentenceEl.style.fontSize = CONFIG.typography.body;
        currentSentenceEl.style.color = CONFIG.colors.text;
        currentSentenceEl.style.minHeight = '24px';
        currentSentenceContainer.appendChild(currentSentenceEl);
        
        sentenceCard.appendChild(currentSentenceContainer);
        
        // Separator
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.backgroundColor = CONFIG.colors.separator;
        separator.style.margin = `${CONFIG.spacing.medium} 0`;
        sentenceCard.appendChild(separator);
        
        const historyHeader = document.createElement('div');
        historyHeader.textContent = 'History';
        historyHeader.style.fontWeight = '600';
        historyHeader.style.fontSize = CONFIG.typography.subhead;
        historyHeader.style.color = CONFIG.colors.secondaryText;
        historyHeader.style.marginBottom = CONFIG.spacing.small;
        sentenceCard.appendChild(historyHeader);
        
        const historyContainer = document.createElement('div');
        historyContainer.id = 'sentence-history';
        historyContainer.style.display = 'flex';
        historyContainer.style.flexDirection = 'column';
        historyContainer.style.gap = CONFIG.spacing.medium;
        sentenceCard.appendChild(historyContainer);
        
        infoPanel.appendChild(sentenceCard);
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
            
            // Store all sensor data including orientation (for visualization)
            // But we'll only send the first 9 values (excluding orientation) to backend
            appState.sensorDataBuffer.push([
                ...appState.sensorData.acceleration,
                ...appState.sensorData.gravity,
                ...appState.sensorData.angularVelocity,
                ...appState.sensorData.orientation.slice(0, 3)  // only used for visualization
            ]);

            if (appState.sensorDataBuffer.length >= CONFIG.sequenceLength) {
                processDataBuffer();
            }
        }, 20);
    }

    // Process collected sensor data (excluding orientation)
    function processDataBuffer() {
        appState.isCollectingData = false;
        const timeTaken = (Date.now() - appState.startTime) / 1000;
        document.getElementById('timeTaken').textContent = `${timeTaken.toFixed(2)}s`;
        
        // Only send acceleration, gravity, and angular velocity (9 values per frame)
        const dataToSend = appState.sensorDataBuffer.slice(0, CONFIG.sequenceLength).map(frame => {
            return [
                frame[0], frame[1], frame[2],  // acceleration x,y,z
                frame[3], frame[4], frame[5],  // gravity x,y,z
                frame[6], frame[7], frame[8]   // angular velocity x,y,z
            ];
        });
        
        sendDataToFlask(dataToSend.flat());
        appState.sensorDataBuffer = [];
        setTimeout(() => { appState.isCollectingData = true; }, 1000);
    }

    // Send data to Flask backend for prediction
    async function sendDataToFlask(dataToSend) {
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sensor_data: dataToSend })
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
        document.getElementById('prediction').textContent = prediction;

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

    // ElevenLabs text-to-speech function
    async function speak(text) {
        if (!text.trim() || appState.isSpeaking) return;
        appState.isSpeaking = true;
        
        try {
            const response = await fetch(`${CONFIG.elevenLabs.apiEndpoint}/${CONFIG.elevenLabs.voiceId}`, {
                method: 'POST',
                headers: {
                    'xi-api-key': CONFIG.elevenLabs.apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    model_id: CONFIG.elevenLabs.modelId,
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                        ...(appState.selectedTone === 'professional' && { stability: 0.7, similarity_boost: 0.8 }),
                        ...(appState.selectedTone === 'persuasive' && { stability: 0.6, similarity_boost: 0.85 }),
                        ...(appState.selectedTone === 'casual' && { stability: 0.4, similarity_boost: 0.7 })
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`ElevenLabs API error: ${response.status}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.addEventListener('ended', () => {
                appState.isSpeaking = false;
            });
            
            audio.addEventListener('error', () => {
                appState.isSpeaking = false;
                fallbackSpeak(text);
            });
            
            audio.play();
        } catch (error) {
            console.error('Error with ElevenLabs TTS:', error);
            appState.isSpeaking = false;
            fallbackSpeak(text);
        }
    }

    // Fallback to browser speech synthesis
    function fallbackSpeak(text) {
        if (!window.speechSynthesis) return;
        
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
            case 'casual':
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                break;
            default: // friendly
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
        }
        
        utterance.addEventListener('end', () => {
            appState.isSpeaking = false;
        });
        
        speechSynthesis.speak(utterance);
    }

    // Finalize the current sentence and send for grammar correction
    async function finalizeSentence() {
        if (appState.currentSentence.length === 0 || appState.isSpeaking) return;
        
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
            
            if (!result.success) {
                throw new Error(result.error || 'Enhancement failed');
            }
            
            // Add to history with original and enhanced versions
            addToHistory(result.original, result.enhanced);
            
            // Only speak the enhanced version
            await speak(result.enhanced);
            
        } catch (error) {
            console.error('Text enhancement failed:', error);
            // Add original as both versions when failed
            addToHistory(originalSentence, originalSentence);
            await speak(originalSentence);
        }
        
        appState.currentSentence = [];
        updateSentenceDisplay();
    }

    function addToHistory(original, enhanced) {
        const historyContainer = document.getElementById('sentence-history');
        
        // Check for existing duplicate
        const existingItem = appState.sentenceHistory.find(
            item => item.original === original && item.enhanced === enhanced
        );
        
        if (existingItem) return;  // Skip duplicates
        
        // Create history item
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-original">${original}</div>
            <div class="history-enhanced" style="color: ${CONFIG.tones.find(t => t.id === appState.selectedTone).color}">
                ${enhanced}
            </div>
        `;
        
        // Add to beginning
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
        appState.sentenceHistory.unshift({ original, enhanced });
        
        // Limit history
        if (appState.sentenceHistory.length > 5) {
            appState.sentenceHistory.pop();
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }
    // Start the application
    initializeApp();