/**
 * ATOMIC PARTICLE SYSTEM PRO v2.5
 * High-End 3D Visualization with Neural Gestures & Audio Reactivity
 */

// ============================================================================
// PARTICLE SYSTEM ENGINE - PRO VERSION
// ============================================================================

class ParticleSystemEngine {
    constructor(config = {}) {
        this.config = {
            particleCount: 10000,
            ...config
        };

        // Clock for frame-rate independent physics
        this.clock = new THREE.Clock();
        this.deltaTime = 0;

        // Scene setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.bloomPass = null;
        this.useComposer = false;

        // Particles
        this.particles = null;
        this.particlePositions = null;
        this.particleVelocities = null;
        this.particleColors = null;
        this.targetPositions = null;

        // Physics
        this.springForce = 0.05;  // Lower = bouncier
        this.dampening = 0.92;    // Friction

        // Audio reactivity
        this.audioContext = null;
        this.analyser = null;
        this.audioData = new Uint8Array(256);
        this.bassEnergy = 0;
        this.trebleEnergy = 0;
        this.dominantFrequency = 0;

        // State
        this.currentShape = 'heart';
        this.currentRotation = { x: 0, y: 0, z: 0 };
        this.shapeRotationSpeed = 0.001;
        this.transitionProgress = 0;

        this.init();
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    init() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initPostProcessing();
        this.addLighting();
        this.createParticleSystem();
        this.setupEvents();
        this.initAudioAnalyzer();
    }

    initScene() {
        this.scene = new THREE.Scene();
        
        // Deep dark background with subtle gradient effect
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 100, 250);
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 35;
    }

    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('canvas'),
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
    }

    initPostProcessing() {
        // Check if THREE.EffectComposer exists
        if (typeof THREE.EffectComposer === 'undefined') {
            console.warn('Bloom effects not available, rendering without post-processing');
            this.composer = null;
            this.useComposer = false;
            return;
        }

        this.useComposer = true;
        this.composer = new THREE.EffectComposer(this.renderer);
        
        const renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Enhanced bloom with higher parameters
        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            2.0,   // bloomStrength (increased for "WOW" factor)
            0.5,   // bloomRadius
            0.1    // bloomThreshold
        );
        this.composer.addPass(this.bloomPass);
    }

    addLighting() {
        // Deep blue ambient light
        const ambientLight = new THREE.AmbientLight(0x001a4d, 0.5);
        this.scene.add(ambientLight);

        // Core glow - electric blue
        const coreGlow = new THREE.PointLight(0x0033ff, 0.8);
        coreGlow.position.set(0, 0, 0);
        coreGlow.distance = 150;
        this.scene.add(coreGlow);

        // Orbital lights for depth
        const orbitalLight1 = new THREE.PointLight(0x00ffff, 0.4);
        orbitalLight1.position.set(50, 50, 50);
        orbitalLight1.distance = 200;
        this.scene.add(orbitalLight1);

        const orbitalLight2 = new THREE.PointLight(0xff00ff, 0.3);
        orbitalLight2.position.set(-50, -50, 50);
        orbitalLight2.distance = 200;
        this.scene.add(orbitalLight2);
    }

    initAudioAnalyzer() {
        if (this.audioContext) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;

        // Try to get microphone input
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const source = this.audioContext.createMediaStreamAudioSource(stream);
                    source.connect(this.analyser);
                    console.log('Audio analyzer connected to microphone');
                })
                .catch(err => console.log('Microphone not available:', err));
        }
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    // ========================================================================
    // PARTICLE SYSTEM CREATION
    // ========================================================================

    createParticleSystem() {
        if (this.particles) {
            this.scene.remove(this.particles);
        }

        const geometry = new THREE.BufferGeometry();

        // Initialize arrays
        this.particlePositions = new Float32Array(this.config.particleCount * 3);
        this.particleVelocities = new Float32Array(this.config.particleCount * 3);
        this.particleColors = new Float32Array(this.config.particleCount * 3);
        this.targetPositions = new Float32Array(this.config.particleCount * 3);

        // Fill with initial shape
        this.generateShape(this.currentShape);

        // Set initial velocities to zero
        this.particleVelocities.fill(0);

        // Create buffer geometry
        geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

        // Create glow texture
        const glowTexture = this.createGlowTexture();

        // Material with additive blending (pure energy effect)
        const material = new THREE.PointsMaterial({
            size: 1.5,
            map: glowTexture,
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        material.vertexColors = true;

        // Create points mesh
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        // Initialize color
        this.updateColorByFrequency(0);
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;

        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // ========================================================================
    // SHAPE GENERATION
    // ========================================================================

    generateShape(shapeName) {
        this.currentShape = shapeName;
        this.transitionProgress = 0;

        switch (shapeName) {
            case 'heart':
                this.generateHeart();
                break;
            case 'saturn':
                this.generateSaturn();
                break;
            case 'flower':
                this.generateFlower();
                break;
            case 'fireworks':
                this.generateFireworks();
                break;
            case 'sphere':
                this.generateFibonacciSphere();
                break;
            case 'dna':
                this.generateDNA();
                break;
            case 'torus':
                this.generateTorus();
                break;
            default:
                this.generateHeart();
        }
    }

    changeShape(shapeName) {
        // Smoothly transition to new shape
        this.generateShape(shapeName);
    }

    generateHeart() {
        const count = this.config.particleCount;
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const z = (Math.random() - 0.5) * 5;

            this.targetPositions[i * 3] = x * 1.5;
            this.targetPositions[i * 3 + 1] = y * 1.5;
            this.targetPositions[i * 3 + 2] = z;

            this.particlePositions[i * 3] = x * 1.5;
            this.particlePositions[i * 3 + 1] = y * 1.5;
            this.particlePositions[i * 3 + 2] = z;
        }
    }

    generateSaturn() {
        const count = this.config.particleCount;
        const planetCount = Math.floor(count * 0.7);
        const ringCount = count - planetCount;

        // Planet
        for (let i = 0; i < planetCount; i++) {
            const pos = this.fibonacci_sphere(i, planetCount, 4);
            this.targetPositions[i * 3] = pos.x;
            this.targetPositions[i * 3 + 1] = pos.y;
            this.targetPositions[i * 3 + 2] = pos.z;

            this.particlePositions[i * 3] = pos.x;
            this.particlePositions[i * 3 + 1] = pos.y;
            this.particlePositions[i * 3 + 2] = pos.z;
        }

        // Rings
        for (let i = planetCount; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 5 + Math.random() * 3;
            const z = (Math.random() - 0.5) * 0.4;

            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;

            this.particlePositions[i * 3] = x;
            this.particlePositions[i * 3 + 1] = y;
            this.particlePositions[i * 3 + 2] = z;
        }
    }

    generateFlower() {
        const count = this.config.particleCount;
        const k = 5;

        for (let i = 0; i < count; i++) {
            const theta = (i / count) * Math.PI * 2;
            const r = Math.cos(k * theta) * 10;

            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            const z = (Math.random() - 0.5) * 3;

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;

            this.particlePositions[i * 3] = x;
            this.particlePositions[i * 3 + 1] = y;
            this.particlePositions[i * 3 + 2] = z;
        }
    }

    generateFireworks() {
        const count = this.config.particleCount;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const elevation = Math.random() * Math.PI - Math.PI / 2;
            const radius = Math.random() * 20;

            const x = radius * Math.cos(elevation) * Math.cos(angle);
            const y = radius * Math.cos(elevation) * Math.sin(angle);
            const z = radius * Math.sin(elevation);

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;

            this.particlePositions[i * 3] = x;
            this.particlePositions[i * 3 + 1] = y;
            this.particlePositions[i * 3 + 2] = z;
        }
    }

    generateFibonacciSphere() {
        const count = this.config.particleCount;
        for (let i = 0; i < count; i++) {
            const pos = this.fibonacci_sphere(i, count, 12);
            this.targetPositions[i * 3] = pos.x;
            this.targetPositions[i * 3 + 1] = pos.y;
            this.targetPositions[i * 3 + 2] = pos.z;

            this.particlePositions[i * 3] = pos.x;
            this.particlePositions[i * 3 + 1] = pos.y;
            this.particlePositions[i * 3 + 2] = pos.z;
        }
    }

    generateDNA() {
        const count = this.config.particleCount;
        const helixTurns = 3;

        for (let i = 0; i < count; i++) {
            const progress = (i / count) * helixTurns * Math.PI * 2;
            const height = (i / count) * 30 - 15;

            const x = 5 * Math.cos(progress);
            const y = height;
            const z = 5 * Math.sin(progress);

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;

            this.particlePositions[i * 3] = x;
            this.particlePositions[i * 3 + 1] = y;
            this.particlePositions[i * 3 + 2] = z;
        }
    }

    generateTorus() {
        const count = this.config.particleCount;
        const majorRadius = 8;
        const minorRadius = 3;

        for (let i = 0; i < count; i++) {
            const u = (i / count) * Math.PI * 2;
            const v = (Math.random() * Math.PI * 2);

            const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u);
            const y = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u);
            const z = minorRadius * Math.sin(v);

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;

            this.particlePositions[i * 3] = x;
            this.particlePositions[i * 3 + 1] = y;
            this.particlePositions[i * 3 + 2] = z;
        }
    }

    fibonacci_sphere(i, count, radius) {
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const y = 1 - (i / (count - 1)) * 2;
        const radiusAtY = Math.sqrt(1 - y * y);

        const theta = goldenAngle * i;

        const x = Math.cos(theta) * radiusAtY * radius;
        const z = Math.sin(theta) * radiusAtY * radius;

        return { x, y: y * radius, z };
    }

    // ========================================================================
    // PHYSICS & MOVEMENT
    // ========================================================================

    updatePositions(handData) {
        this.deltaTime = Math.min(this.clock.getDelta(), 0.016); // Cap at 60FPS

        // Update audio analysis
        if (this.analyser) {
            this.analyser.getByteFrequencyData(this.audioData);
            this.updateAudioReactivity();
        }

        // Handle neural gestures
        this.handleNeuralGestures(handData);

        // Update particle positions with spring physics
        for (let i = 0; i < this.config.particleCount; i++) {
            const idx = i * 3;

            // Current position
            let px = this.particlePositions[idx];
            let py = this.particlePositions[idx + 1];
            let pz = this.particlePositions[idx + 2];

            // Target position
            const tx = this.targetPositions[idx];
            const ty = this.targetPositions[idx + 1];
            const tz = this.targetPositions[idx + 2];

            // Spring force towards target
            const dx = tx - px;
            const dy = ty - py;
            const dz = tz - pz;

            this.particleVelocities[idx] += dx * this.springForce;
            this.particleVelocities[idx + 1] += dy * this.springForce;
            this.particleVelocities[idx + 2] += dz * this.springForce;

            // Apply dampening (friction)
            this.particleVelocities[idx] *= this.dampening;
            this.particleVelocities[idx + 1] *= this.dampening;
            this.particleVelocities[idx + 2] *= this.dampening;

            // Update position
            this.particlePositions[idx] += this.particleVelocities[idx] * this.deltaTime * 60;
            this.particlePositions[idx + 1] += this.particleVelocities[idx + 1] * this.deltaTime * 60;
            this.particlePositions[idx + 2] += this.particleVelocities[idx + 2] * this.deltaTime * 60;

            // Add Brownian motion
            this.particlePositions[idx] += (Math.random() - 0.5) * 0.1;
            this.particlePositions[idx + 1] += (Math.random() - 0.5) * 0.1;
            this.particlePositions[idx + 2] += (Math.random() - 0.5) * 0.1;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // ========================================================================
    // NEURAL GESTURE HANDLING
    // ========================================================================

    handleNeuralGestures(handData) {
        if (!handData || !handData.detected) return;

        switch (handData.handState) {
            case 'FIST':
                this.applyBlackHoleEffect(handData);
                break;
            case 'OPEN_PALM':
                this.applyFingertipMagnetism(handData);
                break;
            case 'VICTORY':
                // Auto-morph to Saturn
                if (this.currentShape !== 'saturn') {
                    this.changeShape('saturn');
                }
                break;
        }
    }

    applyBlackHoleEffect(handData) {
        // All particles violently accelerate to center with white-hot color
        const count = this.config.particleCount;
        const centerX = 0;
        const centerY = 0;
        const centerZ = 0;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;

            const dx = centerX - this.particlePositions[idx];
            const dy = centerY - this.particlePositions[idx + 1];
            const dz = centerZ - this.particlePositions[idx + 2];

            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            const force = Math.max(0.1, 1 / (distance + 0.1));

            // Violent acceleration
            this.particleVelocities[idx] += dx * force * 0.3;
            this.particleVelocities[idx + 1] += dy * force * 0.3;
            this.particleVelocities[idx + 2] += dz * force * 0.3;

            // White-hot color
            this.particleColors[idx] = 1.0;
            this.particleColors[idx + 1] = 1.0;
            this.particleColors[idx + 2] = 1.0;
        }

        this.particles.geometry.attributes.color.needsUpdate = true;
    }

    applyFingertipMagnetism(handData) {
        // Divide particles into 5 groups targeting 5 fingertips
        if (!handData.fingertips || handData.fingertips.length < 5) return;

        const count = this.config.particleCount;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const groupIdx = i % 5;

            const fingertip = handData.fingertips[groupIdx];
            if (!fingertip) continue;

            // Convert screen coords to world coords (with mirroring for webcam)
            const targetX = (1 - fingertip.x) * 20 - 10;  // Mirror X
            const targetY = (1 - fingertip.y) * 20 - 10;  // Flip Y
            const targetZ = 0;

            const dx = targetX - this.particlePositions[idx];
            const dy = targetY - this.particlePositions[idx + 1];
            const dz = targetZ - this.particlePositions[idx + 2];

            this.particleVelocities[idx] += dx * 0.1;
            this.particleVelocities[idx + 1] += dy * 0.1;
            this.particleVelocities[idx + 2] += dz * 0.1;
        }
    }

    // ========================================================================
    // AUDIO REACTIVITY
    // ========================================================================

    updateAudioReactivity() {
        if (!this.audioData) return;

        // Split frequency data
        const bass = this.audioData.slice(0, 85).reduce((a, b) => a + b) / 85;
        const mids = this.audioData.slice(85, 170).reduce((a, b) => a + b) / 85;
        const treble = this.audioData.slice(170, 256).reduce((a, b) => a + b) / 86;

        this.bassEnergy = bass / 255;
        this.trebleEnergy = treble / 255;

        // BASS: Shockwave expansion
        if (this.bassEnergy > 0.6) {
            const count = this.config.particleCount;
            for (let i = 0; i < count; i++) {
                const idx = i * 3;

                const px = this.particlePositions[idx];
                const py = this.particlePositions[idx + 1];
                const pz = this.particlePositions[idx + 2];

                const distance = Math.sqrt(px * px + py * py + pz * pz);
                const direction = distance > 0.1 ? distance : 0.1;

                this.particleVelocities[idx] += (px / direction) * this.bassEnergy * 0.5;
                this.particleVelocities[idx + 1] += (py / direction) * this.bassEnergy * 0.5;
                this.particleVelocities[idx + 2] += (pz / direction) * this.bassEnergy * 0.5;
            }
        }

        // TREBLE: High-frequency vibration
        if (this.trebleEnergy > 0.5) {
            const count = this.config.particleCount;
            for (let i = 0; i < count; i++) {
                const idx = i * 3;

                this.particlePositions[idx] += (Math.random() - 0.5) * this.trebleEnergy * 0.5;
                this.particlePositions[idx + 1] += (Math.random() - 0.5) * this.trebleEnergy * 0.5;
                this.particlePositions[idx + 2] += (Math.random() - 0.5) * this.trebleEnergy * 0.5;
            }
        }

        // Update color based on dominant frequency
        this.updateColorByFrequency(mids);

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    updateColorByFrequency(frequency) {
        // Map frequency to hue (0-360)
        const hue = (frequency / 255) * 360;
        const count = this.config.particleCount;

        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const color = new THREE.Color().setHSL(hue / 360, 1.0, 0.5);

            this.particleColors[idx] = color.r;
            this.particleColors[idx + 1] = color.g;
            this.particleColors[idx + 2] = color.b;
        }

        this.particles.geometry.attributes.color.needsUpdate = true;
    }

    // ========================================================================
    // RENDERING
    // ========================================================================

    render() {
        if (this.particles) {
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.color.needsUpdate = true;

            // Auto-rotate
            this.particles.rotation.x += 0.0003;
            this.particles.rotation.y += 0.0005;
        }

        if (this.useComposer && this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (this.composer) {
            this.composer.setSize(window.innerWidth, window.innerHeight);
        }
    }
}

// ============================================================================
// HAND TRACKING MANAGER
// ============================================================================

class HandTrackingManager {
    constructor() {
        this.handData = {
            detected: false,
            centerX: 0,
            centerY: 0,
            pinchDistance: 0,
            power: 0,
            hue: 0,
            zoomFactor: 0,
            unzoomFactor: 0,
            handState: 'NEUTRAL',
            fingertips: []
        };
        this.prevHandSeparation = 0;
        this.prevPinchDistance = 0;
        this.hands = null;
    }

    async init() {
        const { Hands } = window;

        if (!Hands) {
            throw new Error('MediaPipe Hands library not loaded');
        }

        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onHandsResults.bind(this));

        const videoElement = document.getElementById('video');
        if (!videoElement) {
            throw new Error('Video element not found');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            videoElement.srcObject = stream;
            console.log('Camera stream started successfully');
            
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });
            
            const processFrame = async () => {
                try {
                    await this.hands.send({ image: videoElement });
                } catch (err) {
                    console.error('Error processing hand frame:', err);
                }
                requestAnimationFrame(processFrame);
            };
            
            processFrame();
        } catch (error) {
            console.error('Camera initialization error:', error);
            throw error;
        }
    }

    detectHandState(landmarks) {
        if (!landmarks || landmarks.length < 21) return 'NEUTRAL';

        const palmCenter = landmarks[9];
        const fingertips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
        
        const distances = fingertips.map(tip => {
            const dx = tip.x - palmCenter.x;
            const dy = tip.y - palmCenter.y;
            return Math.sqrt(dx * dx + dy * dy);
        });

        const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
        const extendedFingers = distances.filter(d => d > 0.15).length;

        if (avgDistance < 0.12) {
            return 'FIST';
        }

        if (extendedFingers === 2 || extendedFingers === 5) {
            if (extendedFingers === 2) {
                const indexDist = distances[1];
                const middleDist = distances[2];
                if (indexDist > 0.15 && middleDist > 0.15) {
                    return 'VICTORY';
                }
            } else {
                return 'OPEN_PALM';
            }
        }

        return 'NEUTRAL';
    }

    onHandsResults(results) {
        this.handData.detected = false;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            this.handData.detected = true;

            const palmCenter = landmarks[9];
            this.handData.centerX = palmCenter.x;
            this.handData.centerY = palmCenter.y;

            // Detect hand state
            this.handData.handState = this.detectHandState(landmarks);

            // Extract fingertips for magnetism
            this.handData.fingertips = [
                landmarks[4],   // Thumb
                landmarks[8],   // Index
                landmarks[12],  // Middle
                landmarks[16],  // Ring
                landmarks[20]   // Pinky
            ];

            // Calculate pinch distance
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const pinchDist = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2)
            );
            this.handData.pinchDistance = pinchDist;
            this.handData.power = Math.max(0, 1 - pinchDist * 2);

            // Hand position for hue mapping
            this.handData.hue = palmCenter.y * 360;
        }
    }

    getHandData() {
        return this.handData;
    }
}

// ============================================================================
// STATS MANAGER
// ============================================================================

class StatsManager {
    constructor(particleCount) {
        this.particleCount = particleCount;
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = Date.now();
    }

    update(particleCount, handData) {
        this.frameCount++;
        const now = Date.now();
        const elapsed = now - this.lastTime;

        if (elapsed >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;

            document.getElementById('fpsValue').textContent = this.fps;
        }

        document.getElementById('particleCount').textContent = particleCount.toLocaleString();
        
        if (handData && handData.detected) {
            document.getElementById('handStatus').textContent = `Hand Detected (${handData.handState})`;
        } else {
            document.getElementById('handStatus').textContent = 'No Hand Detected';
        }
    }
}
