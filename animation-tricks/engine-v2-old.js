/* ============================================================================
   ATOMIC PARTICLE SYSTEM PRO v2.0
   Advanced Physics, Neural Gesture Detection, Bloom Effects & Music Mode
   ============================================================================ */

class ParticleSystemEngine {
    constructor(config) {
        this.config = config;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null; // Post-processing composer
        this.particles = null;
        this.targetPositions = new Float32Array(config.particleCount * 3);
        this.currentPositions = new Float32Array(config.particleCount * 3);
        this.particleColors = new Float32Array(config.particleCount * 3);
        this.targetColors = new Float32Array(config.particleCount * 3); // For color lerping
        this.velocities = new Float32Array(config.particleCount * 3);
        this.particleScale = new Float32Array(config.particleCount);
        
        // Group assignments for fingertip magnetism (5 groups for 5 fingers)
        this.particleGroups = new Uint32Array(config.particleCount);
        
        // Current hand state and rotation
        this.currentRotation = { x: 0, y: 0, z: 0 };
        this.handVelocity = { x: 0, y: 0, z: 0 };
        this.prevHandPos = { x: 0, y: 0, z: 0 };
    }

    /* ========================================================================
       INITIALIZATION
       ======================================================================== */

    init() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initPostProcessing();
        this.addLighting();
        this.createParticleSystem();
        this.setupEvents();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e1b);
        this.scene.fog = new THREE.Fog(0x0a0e1b, 50, 200);
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
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
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

        this.bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5,  // bloomStrength
            0.4,  // bloomRadius
            0.1   // bloomThreshold
        );
        this.composer.addPass(this.bloomPass);
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    addLighting() {
        // Deep blue ambient light
        const ambientLight = new THREE.AmbientLight(0x001a4d, 0.4);
        this.scene.add(ambientLight);

        // Deep blue core glow
        const coreGlow = new THREE.PointLight(0x0033ff, 0.6);
        coreGlow.position.set(0, 0, 0);
        coreGlow.distance = 120;
        this.scene.add(coreGlow);

        // Dark blue orbital light
        const orbitalLight = new THREE.PointLight(0x0055ff, 0.3);
        orbitalLight.position.set(30, 30, 30);
        orbitalLight.distance = 150;
        this.scene.add(orbitalLight);
    }

    createParticleSystem() {
        if (this.particles) {
            this.scene.remove(this.particles);
        }

        const geometry = new THREE.BufferGeometry();

        // Initialize positions
        this.generateShape(this.config.defaultShape);
        this.currentPositions.set(this.targetPositions);

        // Create glow texture
        const glowTexture = this.createGlowTexture();

        // Set buffer attributes
        geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

        // Material with glow - smaller particles for atoms
        const material = new THREE.PointsMaterial({
            size: 1.2,
            map: glowTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            vertexColors: true,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Create radial gradient glow
        const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(100, 200, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(100, 200, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    /* ========================================================================
       SHAPE GENERATION (Original + New Advanced Shapes)
       ======================================================================== */

    generateShape(shape) {
        switch (shape) {
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
                this.generateDNAHelix();
                break;
            case 'torus':
                this.generateTorus();
                break;
        }
    }

    generateHeart() {
        const particleCount = this.config.particleCount;
        const scale = 1.2;

        for (let i = 0; i < particleCount; i++) {
            const t = (i / particleCount) * Math.PI * 2;

            let x = 16 * Math.pow(Math.sin(t), 3);
            let y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            let z = (Math.random() - 0.5) * 5;

            x *= scale * 0.5;
            y *= scale * 0.4;
            z *= scale * 0.5;

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;
        }
    }

    generateSaturn() {
        const particleCount = this.config.particleCount;
        const planetCount = Math.floor(particleCount * 0.7);
        const ringCount = particleCount - planetCount;

        // Planet (Fibonacci Sphere)
        const phi = Math.PI * (3 - Math.sqrt(5));
        const planetRadius = 2.5;

        for (let i = 0; i < planetCount; i++) {
            const y = 1 - (i / planetCount) * 2;
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = phi * i;

            const x = Math.cos(theta) * radiusAtY * planetRadius;
            const z = Math.sin(theta) * radiusAtY * planetRadius;

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y * planetRadius;
            this.targetPositions[i * 3 + 2] = z;
        }

        // Electron Rings (Disc)
        const innerRadius = 4;
        const outerRadius = 7;

        for (let i = 0; i < ringCount; i++) {
            const idx = planetCount + i;
            const angle = Math.random() * Math.PI * 2;
            const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
            const z = (Math.random() - 0.5) * 0.4;

            this.targetPositions[idx * 3] = Math.cos(angle) * radius;
            this.targetPositions[idx * 3 + 1] = 0;
            this.targetPositions[idx * 3 + 2] = Math.sin(angle) * radius + z;
        }
    }

    generateFlower() {
        const particleCount = this.config.particleCount;
        const k = 5;
        const scale = 1.5;

        for (let i = 0; i < particleCount; i++) {
            const theta = (i / particleCount) * Math.PI * 2;
            const r = Math.cos(k * theta) * 10 * scale;

            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            const z = (Math.random() - 0.5) * 3;

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;
        }
    }

    generateFireworks() {
        const particleCount = this.config.particleCount;

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = Math.random() * 20 + 5;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z;

            this.velocities[i * 3] = (Math.random() - 0.5) * 2;
            this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
            this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;
        }
    }

    generateFibonacciSphere() {
        const particleCount = this.config.particleCount;
        const phi = Math.PI * (3 - Math.sqrt(5));
        const radius = 8;

        for (let i = 0; i < particleCount; i++) {
            const y = 1 - (i / particleCount) * 2;
            const radiusAtY = Math.sqrt(1 - y * y);
            const theta = phi * i;

            const x = Math.cos(theta) * radiusAtY * radius;
            const z = Math.sin(theta) * radiusAtY * radius;

            this.targetPositions[i * 3] = x;
            this.targetPositions[i * 3 + 1] = y * radius;
            this.targetPositions[i * 3 + 2] = z;
        }
    }

    /**
     * DNA DOUBLE HELIX
     * Two intertwined spirals with base pairs
     * x = cos(t) * radius * strandSide
     * z = sin(t) * radius * strandSide
     * y = (t / total) * height
     */
    generateDNAHelix() {
        const particleCount = this.config.particleCount;
        const radius = 3;
        const height = 20;
        const turns = 4;

        for (let i = 0; i < particleCount; i++) {
            const progress = i / particleCount;
            const t = progress * Math.PI * 2 * turns;
            const strandSide = (i % 2 === 0) ? 1 : -0.7; // Two strands at different radii

            const x = Math.cos(t) * radius * strandSide;
            const z = Math.sin(t) * radius * strandSide;
            const y = progress * height - height / 2;

            // Add base pairs as slight perpendicular offset every 10th particle
            let xOffset = 0, zOffset = 0;
            if (i % 10 === 0) {
                xOffset = (Math.random() - 0.5) * 0.5;
                zOffset = (Math.random() - 0.5) * 0.5;
            }

            this.targetPositions[i * 3] = x + xOffset;
            this.targetPositions[i * 3 + 1] = y;
            this.targetPositions[i * 3 + 2] = z + zOffset;
        }
    }

    /**
     * TORUS (Donut Shape)
     * Parametric: x = (R + r*cos(v))*cos(u)
     *             y = (R + r*cos(v))*sin(u)
     *             z = r*sin(v)
     */
    generateTorus() {
        const particleCount = this.config.particleCount;
        const R = 5;   // Major radius
        const r = 2;   // Minor radius
        const uCount = Math.ceil(Math.sqrt(particleCount * 0.6));
        const vCount = Math.ceil(particleCount / uCount);

        let idx = 0;
        for (let i = 0; i < uCount && idx < particleCount; i++) {
            const u = (i / uCount) * Math.PI * 2;
            for (let j = 0; j < vCount && idx < particleCount; j++) {
                const v = (j / vCount) * Math.PI * 2;

                const x = (R + r * Math.cos(v)) * Math.cos(u);
                const y = (R + r * Math.cos(v)) * Math.sin(u);
                const z = r * Math.sin(v);

                this.targetPositions[idx * 3] = x;
                this.targetPositions[idx * 3 + 1] = y;
                this.targetPositions[idx * 3 + 2] = z;
                
                idx++;
            }
        }
    }

    /* ========================================================================
       PHYSICS & ANIMATION
       ======================================================================== */

    updatePositions(handData) {
        const lerpFactor = this.calculateDynamicLerp(handData);
        
        // Update hand velocity for vortex force
        this.handVelocity.x = handData.centerX - this.prevHandPos.x;
        this.handVelocity.y = handData.centerY - this.prevHandPos.y;
        this.prevHandPos.x = handData.centerX;
        this.prevHandPos.y = handData.centerY;
        
        const handVelocityMagnitude = Math.sqrt(
            this.handVelocity.x ** 2 + this.handVelocity.y ** 2
        );

        for (let i = 0; i < this.config.particleCount; i++) {
            const idx = i * 3;
            let targetX = this.targetPositions[idx];
            let targetY = this.targetPositions[idx + 1];
            let targetZ = this.targetPositions[idx + 2];

            // ===== FINGERTIP MAGNETISM (Open Palm State) =====
            if (handData.handState === 'OPEN_PALM' && handData.fingertips) {
                const groupId = this.particleGroups[i];
                if (groupId < handData.fingertips.length) {
                    const fingertip = handData.fingertips[groupId];
                    targetX = fingertip.x * 20 - 10;
                    targetY = fingertip.y * 20 - 10;
                    targetZ = (Math.random() - 0.5) * 5;
                }
            }

            // ===== LERP TOWARDS TARGET =====
            this.currentPositions[idx] += (targetX - this.currentPositions[idx]) * lerpFactor;
            this.currentPositions[idx + 1] += (targetY - this.currentPositions[idx + 1]) * lerpFactor;
            this.currentPositions[idx + 2] += (targetZ - this.currentPositions[idx + 2]) * lerpFactor;

            // ===== ZOOM & UNZOOM =====
            const distToCenter = Math.sqrt(
                this.currentPositions[idx] ** 2 +
                this.currentPositions[idx + 1] ** 2 +
                this.currentPositions[idx + 2] ** 2
            );

            if (distToCenter > 0.01) {
                const nx = this.currentPositions[idx] / distToCenter;
                const ny = this.currentPositions[idx + 1] / distToCenter;
                const nz = this.currentPositions[idx + 2] / distToCenter;

                // Zoom (inward)
                if (handData.zoomFactor > 0) {
                    const zoomPower = handData.zoomFactor * 0.12;
                    this.currentPositions[idx] -= nx * zoomPower * 0.5;
                    this.currentPositions[idx + 1] -= ny * zoomPower * 0.5;
                    this.currentPositions[idx + 2] -= nz * zoomPower * 0.5;
                }

                // Unzoom (outward)
                if (handData.unzoomFactor > 0) {
                    const unzoomPower = handData.unzoomFactor * 0.12;
                    this.currentPositions[idx] += nx * unzoomPower * 0.5;
                    this.currentPositions[idx + 1] += ny * unzoomPower * 0.5;
                    this.currentPositions[idx + 2] += nz * unzoomPower * 0.5;
                }
            }

            // ===== EXPLOSION (Pinch Gesture) =====
            if (handData.power > 0.3) {
                const explosionForce = handData.power * 0.5;
                const angle = (i / this.config.particleCount) * Math.PI * 2;
                const distance = (handData.power * 5) + 2;

                this.currentPositions[idx] += Math.cos(angle) * explosionForce;
                this.currentPositions[idx + 1] += Math.sin(angle) * explosionForce;
                this.currentPositions[idx + 2] += (Math.random() - 0.5) * explosionForce;
            }

            // ===== VORTEX FORCE (High Hand Velocity) =====
            if (handVelocityMagnitude > 0.1) {
                const vortexStrength = handVelocityMagnitude * 0.05;
                const vx = -this.currentPositions[idx + 1] * vortexStrength;
                const vy = this.currentPositions[idx] * vortexStrength;

                this.currentPositions[idx] += vx;
                this.currentPositions[idx + 1] += vy;
            }

            // ===== BROWNIAN MOTION =====
            this.currentPositions[idx] += (Math.random() - 0.5) * 0.002;
            this.currentPositions[idx + 1] += (Math.random() - 0.5) * 0.002;
            this.currentPositions[idx + 2] += (Math.random() - 0.5) * 0.002;
        }

        // ===== RESPONSIVE COLOR LERP =====
        this.updateColorsByHandPosition(handData);

        // ===== AUTO-ROTATION WITH HAND VELOCITY =====
        const rotationSpeed = this.config.autoRotationSpeed * 0.5;
        const handVelocityFactor = handVelocityMagnitude * 0.01;

        this.currentRotation.x += rotationSpeed + handVelocityFactor * 0.5;
        this.currentRotation.y += rotationSpeed * 1.2 + handVelocityFactor * 0.5;
        this.currentRotation.z += rotationSpeed * 0.3;

        if (this.particles) {
            this.particles.rotation.x = this.currentRotation.x;
            this.particles.rotation.y = this.currentRotation.y;
            this.particles.rotation.z = this.currentRotation.z;
        }
    }

    /**
     * DYNAMIC LERPING
     * Increase lerp when hand is moving fast, decrease when still
     * Creates organic "trailing" effect
     */
    calculateDynamicLerp(handData) {
        const baseLerp = this.config.lerpFactor;
        const handVelocityMagnitude = Math.sqrt(
            (handData.centerX - this.prevHandPos.x) ** 2 +
            (handData.centerY - this.prevHandPos.y) ** 2
        );
        
        // Increase lerp factor when hand moves fast
        const velocityInfluence = Math.min(handVelocityMagnitude * 0.02, 0.1);
        return baseLerp + velocityInfluence;
    }

    /**
     * RESPONSIVE COLOR LERP
     * Hand position maps to HSL hue
     * Hand High (top) = Warm colors (Red/Orange)
     * Hand Low (bottom) = Cool colors (Blue/Cyan)
     */
    updateColorsByHandPosition(handData) {
        // Map Y position (0-1) to hue (0-360)
        const handHue = handData.centerY * 360; // 0 = top (warm), 1 = bottom (cool)
        
        for (let i = 0; i < this.config.particleCount; i++) {
            const idx = i * 3;
            
            // HSL to RGB conversion
            const hue = handHue + (Math.sin(i * 0.01) * 30);
            const saturation = 0.8;
            const lightness = 0.5 + Math.sin(i * 0.001) * 0.2;

            const [r, g, b] = this.hslToRgb(
                (hue % 360) / 360,
                saturation,
                lightness
            );

            // Lerp towards target color
            const colorLerpFactor = 0.05;
            this.particleColors[idx] += (r - this.particleColors[idx]) * colorLerpFactor;
            this.particleColors[idx + 1] += (g - this.particleColors[idx + 1]) * colorLerpFactor;
            this.particleColors[idx + 2] += (b - this.particleColors[idx + 2]) * colorLerpFactor;
        }
    }

    /**
     * HSL to RGB conversion utility
     */
    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [r, g, b];
    }

    /**
     * Update particle system by audio frequency data
     * Scales particle size based on bass intensity
     */
    updateByAudio(frequencyData) {
        if (!frequencyData || frequencyData.length === 0) return;

        // Get average bass (low frequency) intensity
        const bassRange = Math.floor(frequencyData.length * 0.1);
        let bassAverage = 0;
        for (let i = 0; i < bassRange; i++) {
            bassAverage += frequencyData[i];
        }
        bassAverage /= bassRange;
        bassAverage /= 255; // Normalize to 0-1

        // Scale particles based on bass
        const scaleAmount = 1 + bassAverage * 0.3;
        if (this.particles && this.particles.material) {
            this.particles.material.size = 1.2 * scaleAmount;
        }

        // Optional: Add rotation boost on bass kick
        if (bassAverage > 0.7) {
            this.currentRotation.x += 0.1;
            this.currentRotation.y += 0.15;
        }
    }

    render() {
        if (this.particles) {
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.color.needsUpdate = true;
        }

        // Use composer for bloom effect if available, otherwise direct render
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

    changeShape(shape) {
        this.generateShape(shape);
        this.currentPositions.set(this.targetPositions);
    }
}

/* ============================================================================
   HAND TRACKING MANAGER WITH NEURAL GESTURE DETECTION
   ============================================================================ */

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
            handState: 'NEUTRAL', // NEUTRAL, FIST, VICTORY, OPEN_PALM
            fingertips: [] // Array of {x, y} for 5 fingertips when open palm
        };
        this.prevHandSeparation = 0;
        this.prevPinchDistance = 0;
        this.hands = null;
        this.camera_obj = null;
    }

    async init() {
        const { Hands, HAND_CONNECTIONS } = window;

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
            // Request camera permission and process video
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 } 
            });
            
            videoElement.srcObject = stream;
            console.log('Camera stream started successfully');
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });
            
            // Start processing video frames
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

    /**
     * NEURAL GESTURE DETECTION
     * Identifies: FIST (black hole), VICTORY (2-finger), OPEN_PALM (magnetism)
     */
    detectHandState(landmarks) {
        if (!landmarks || landmarks.length < 21) return 'NEUTRAL';

        const palmCenter = landmarks[9];
        const fingertips = [landmarks[4], landmarks[8], landmarks[12], landmarks[16], landmarks[20]];
        
        // Calculate distances from palm center to each fingertip
        const distances = fingertips.map(tip => {
            const dx = tip.x - palmCenter.x;
            const dy = tip.y - palmCenter.y;
            return Math.sqrt(dx * dx + dy * dy);
        });

        const avgDistance = distances.reduce((a, b) => a + b) / distances.length;
        const extendedFingers = distances.filter(d => d > 0.15).length;

        // FIST: All fingers close to palm (small distances)
        if (avgDistance < 0.12) {
            return 'FIST';
        }

        // VICTORY: Only 2 fingers extended (index & middle)
        if (extendedFingers === 2) {
            const indexDist = distances[1];
            const middleDist = distances[2];
            if (indexDist > 0.15 && middleDist > 0.15) {
                return 'VICTORY';
            }
        }

        // OPEN_PALM: All 5 fingers extended
        if (extendedFingers === 5) {
            this.handData.fingertips = fingertips;
            return 'OPEN_PALM';
        }

        return 'NEUTRAL';
    }

    onHandsResults(results) {
        const handStatus = document.getElementById('handStatus');
        const instructionLabel = document.getElementById('instructionLabel');
        
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            this.handData.detected = false;
            handStatus.textContent = '❌ No hands detected';
            handStatus.style.color = '#ff3333';
            if (instructionLabel) instructionLabel.textContent = '';
            return;
        }

        this.handData.detected = true;
        const landmarks = results.multiHandLandmarks[0];
        const middleMcp = landmarks[9];

        // Detect hand state for neural logic
        this.handData.handState = this.detectHandState(landmarks);

        // FIST = Black Hole Collapse
        if (this.handData.handState === 'FIST') {
            this.handData.zoomFactor = 1.0; // Max zoom
            this.handData.unzoomFactor = 0;
            handStatus.textContent = '🕳️ BLACK HOLE COLLAPSE';
            handStatus.style.color = '#ff00ff';
            if (instructionLabel) instructionLabel.textContent = 'FIST DETECTED: BLACK HOLE MODE';
            return;
        }

        // VICTORY = Saturn shape auto-trigger
        if (this.handData.handState === 'VICTORY') {
            // Trigger Saturn shape
            if (window.engine && window.engine.changeShape) {
                window.engine.changeShape('saturn');
            }
            handStatus.textContent = '✌️ VICTORY - SATURN MODE';
            handStatus.style.color = '#ffaa00';
            if (instructionLabel) instructionLabel.textContent = 'VICTORY SIGN: SATURN SHAPE';
            return;
        }

        // OPEN_PALM = Magnetism to fingertips
        if (this.handData.handState === 'OPEN_PALM') {
            handStatus.textContent = '🧲 OPEN PALM - MAGNETISM';
            handStatus.style.color = '#00ff88';
            if (instructionLabel) instructionLabel.textContent = 'OPEN PALM: FINGERTIP MAGNETISM ACTIVE';
        }

        // Update center position
        this.handData.centerX = middleMcp.x;
        this.handData.centerY = middleMcp.y;
        this.handData.hue = middleMcp.y * 360;

        // Calculate pinch distance (thumb to index finger)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const dx = indexTip.x - thumbTip.x;
        const dy = indexTip.y - thumbTip.y;
        this.handData.pinchDistance = Math.sqrt(dx * dx + dy * dy);
        this.handData.power = Math.max(0, Math.min(1, 1 - this.handData.pinchDistance / 0.3));

        // ===== DUAL HAND ZOOM LOGIC =====
        if (results.multiHandLandmarks.length >= 2) {
            const hand2 = results.multiHandLandmarks[1];
            const hand2Mcp = hand2[9];

            const handDx = hand2Mcp.x - middleMcp.x;
            const handDy = hand2Mcp.y - middleMcp.y;
            const handSeparation = Math.sqrt(handDx * handDx + handDy * handDy);

            // Dual hand pinch = 60% zoom
            if (handSeparation < 0.4) {
                this.handData.zoomFactor = (1 - handSeparation / 0.4) * 0.6;
                this.handData.unzoomFactor = 0;
                handStatus.textContent = '⚛️ DUAL ZOOM ' + Math.floor(this.handData.zoomFactor * 100) + '%';
                handStatus.style.color = '#00ffff';
            }
            // Dual hand spread = 300% unzoom
            else if (handSeparation > 0.45 && this.prevHandSeparation > 0 && handSeparation > this.prevHandSeparation) {
                const spreadAmount = Math.min(0.3, handSeparation - 0.45);
                this.handData.unzoomFactor = (spreadAmount / 0.3) * 1.0;
                this.handData.zoomFactor = 0;
                handStatus.textContent = '💥 DOUBLE UNZOOM 300%';
                handStatus.style.color = '#ff00ff';
            } else {
                this.handData.zoomFactor = 0;
                this.handData.unzoomFactor = 0;
            }

            this.prevHandSeparation = handSeparation;
        } else {
            // ===== SINGLE HAND ZOOM & UNZOOM =====
            const isNearCamera = middleMcp.x > 0.6 && middleMcp.y > 0.5;
            const distance = Math.sqrt(
                Math.pow(1 - middleMcp.x, 2) +
                Math.pow(1 - middleMcp.y, 2)
            );

            // Single hand pinch in = zoom
            if (this.handData.pinchDistance < 0.05) {
                this.handData.zoomFactor = isNearCamera ? Math.max(0, 1 - distance / 0.8) * 0.3 : 0;
                this.handData.unzoomFactor = 0;
            }
            // Single hand pinch out = unzoom (150%)
            else if (this.handData.pinchDistance > 0.15 && this.prevPinchDistance > 0 && this.handData.pinchDistance > this.prevPinchDistance) {
                const spreadAmount = Math.min(0.2, this.handData.pinchDistance - 0.15);
                this.handData.unzoomFactor = (spreadAmount / 0.2) * 0.5;
                this.handData.zoomFactor = 0;

                if (this.handData.unzoomFactor > 0.4) {
                    handStatus.textContent = '💥 SINGLE UNZOOM 150%';
                    handStatus.style.color = '#ff6600';
                }
            } else {
                this.handData.zoomFactor = 0;
                this.handData.unzoomFactor = 0;
            }

            this.prevPinchDistance = this.handData.pinchDistance;
        }
    }

    getHandData() {
        return this.handData;
    }
}

/* ============================================================================
   STATS MANAGER
   ============================================================================ */

class StatsManager {
    constructor() {
        this.frameCount = 0;
        this.lastTime = Date.now();
        this.fps = 0;
    }

    update(particleCount, handData) {
        this.frameCount++;
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastTime = currentTime;

            const fpsElement = document.getElementById('fps');
            const particlesElement = document.getElementById('particles');
            const powerElement = document.getElementById('power');

            if (fpsElement) fpsElement.textContent = 'FPS: ' + this.fps;
            if (particlesElement) particlesElement.textContent = 'Particles: ' + particleCount;
            if (powerElement) {
                const powerPercent = Math.floor(handData.power * 100);
                powerElement.textContent = 'Power: ' + powerPercent + '%';
            }
        }
    }
}
