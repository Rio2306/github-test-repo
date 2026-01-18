/* ============================================================================
   PARTICLE SYSTEM ENGINE
   ============================================================================ */

class ParticleSystemEngine {
    constructor(config) {
        this.config = config;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.targetPositions = new Float32Array(config.particleCount * 3);
        this.currentPositions = new Float32Array(config.particleCount * 3);
        this.particleColors = new Float32Array(config.particleCount * 3);
        this.velocities = new Float32Array(config.particleCount * 3);
        this.particleScale = new Float32Array(config.particleCount);
    }

    /* ========================================================================
       INITIALIZATION
       ======================================================================== */

    init() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
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
            size: 1, // Much smaller for atomic theme
            map: glowTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            sizeAttenuation: true,
            depthWrite: false,
            fog: false
        });

        // Create points
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);

        this.velocities.fill(0);
    }

    createGlowTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Create deep blue atom core glow
        const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
        gradient.addColorStop(0, 'rgba(100, 180, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(50, 150, 255, 0.95)');
        gradient.addColorStop(0.5, 'rgba(0, 100, 200, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 50, 150, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);

        // Add tiny bright blue core
        ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(64, 64, 3, 0, Math.PI * 2);
        ctx.fill();

        return new THREE.CanvasTexture(canvas);
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onWindowResize());
    }

    /* ========================================================================
       SHAPE GENERATION
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
        }
    }

    generateHeart() {
        const particleCount = this.config.particleCount;
        const scale = 1.2; // Smaller scale for atomic theme

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

        // Planet (Fibonacci Sphere) - Smaller atomic core
        const phi = Math.PI * (3 - Math.sqrt(5));
        const planetRadius = 2.5; // Reduced for atomic feel

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

        // Electron Rings (Disc) - Orbital paths
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
        const radius = 8; // Smaller for atomic theme

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

    /* ========================================================================
       ANIMATION & UPDATE
       ======================================================================== */

    updatePositions(handData) {
        for (let i = 0; i < this.config.particleCount; i++) {
            const idx = i * 3;

            // Lerp towards target position
            this.currentPositions[idx] += (this.targetPositions[idx] - this.currentPositions[idx]) * this.config.lerpFactor;
            this.currentPositions[idx + 1] += (this.targetPositions[idx + 1] - this.currentPositions[idx + 1]) * this.config.lerpFactor;
            this.currentPositions[idx + 2] += (this.targetPositions[idx + 2] - this.currentPositions[idx + 2]) * this.config.lerpFactor;

            // Explosion effect
            if (handData.power > 0.3) {
                const dx = this.currentPositions[idx] - handData.centerX;
                const dy = this.currentPositions[idx + 1] - handData.centerY;
                const dz = this.currentPositions[idx + 2];

                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
                const force = handData.power * 0.5;

                this.currentPositions[idx] += (dx / dist) * force;
                this.currentPositions[idx + 1] += (dy / dist) * force;
                this.currentPositions[idx + 2] += (dz / dist) * force;
            }

            // UNZOOM OUT - Reverse zoom with pinch-out gesture
            if (handData.unzoomFactor > 0) {
                // Expand particles away from center
                const unzoomPower = handData.unzoomFactor * 0.12;
                
                const distToCenter = Math.sqrt(
                    this.currentPositions[idx] ** 2 +
                    this.currentPositions[idx + 1] ** 2 +
                    this.currentPositions[idx + 2] ** 2
                );
                
                // Direction away from center
                if (distToCenter > 0.01) {
                    const nx = this.currentPositions[idx] / distToCenter;
                    const ny = this.currentPositions[idx + 1] / distToCenter;
                    const nz = this.currentPositions[idx + 2] / distToCenter;
                    
                    // Push outward
                    this.currentPositions[idx] += nx * unzoomPower;
                    this.currentPositions[idx + 1] += ny * unzoomPower;
                    this.currentPositions[idx + 2] += nz * unzoomPower;
                    
                    // Gentle expansion (scale up)
                    const expandFactor = 1 + unzoomPower * 0.08;
                    this.currentPositions[idx] *= expandFactor;
                    this.currentPositions[idx + 1] *= expandFactor;
                    this.currentPositions[idx + 2] *= expandFactor;
                }
            }
            if (handData.zoomFactor > 0) {
                // Controlled acceleration toward center
                const zoomPower = handData.zoomFactor * 0.12; // Reduced from 0.3 for smoothness
                
                // Pull toward origin (center)
                const distToCenter = Math.sqrt(
                    this.currentPositions[idx] ** 2 +
                    this.currentPositions[idx + 1] ** 2 +
                    this.currentPositions[idx + 2] ** 2
                );
                
                // Direction toward center
                if (distToCenter > 0.1) {
                    const nx = -this.currentPositions[idx] / distToCenter;
                    const ny = -this.currentPositions[idx + 1] / distToCenter;
                    const nz = -this.currentPositions[idx + 2] / distToCenter;
                    
                    // Apply smooth inward force
                    this.currentPositions[idx] += nx * zoomPower;
                    this.currentPositions[idx + 1] += ny * zoomPower;
                    this.currentPositions[idx + 2] += nz * zoomPower;
                    
                    // Gentle scaling (compress toward center)
                    const scaleFactor = 1 - zoomPower * 0.08;  // Reduced from 0.15
                    this.currentPositions[idx] *= scaleFactor;
                    this.currentPositions[idx + 1] *= scaleFactor;
                    this.currentPositions[idx + 2] *= scaleFactor;
                }
            }
        }
    }

    applyBrownianMotion() {
        for (let i = 0; i < this.config.particleCount; i++) {
            const idx = i * 3;
            this.currentPositions[idx] += (Math.random() - 0.5) * this.config.brownianMotion;
            this.currentPositions[idx + 1] += (Math.random() - 0.5) * this.config.brownianMotion;
            this.currentPositions[idx + 2] += (Math.random() - 0.5) * this.config.brownianMotion;
        }
    }

    updateColors(hue) {
        // Deep blue glowing atomic theme - fixed colors
        for (let i = 0; i < this.config.particleCount; i++) {
            const idx = i * 3;
            
            // Subtle variation in blue intensity
            const variation = Math.sin(i * 0.01) * 0.2 + 0.8;
            
            // Deep blue color with slight variation
            this.particleColors[idx] = 0.4 * variation;      // R
            this.particleColors[idx + 1] = 0.7 * variation;  // G
            this.particleColors[idx + 2] = 1.0 * variation;  // B (strong blue)
        }
    }

    updateRotation(handData) {
        if (!this.particles) return;

        const rotationSpeed = this.config.autoRotationSpeed * 0.5; // Slower rotation for atoms
        const handVelocityFactor = handData.power * 0.01;

        // Less aggressive rotation
        this.particles.rotation.x += rotationSpeed + handVelocityFactor * 0.5;
        this.particles.rotation.y += rotationSpeed * 1.2 + handVelocityFactor * 0.5;
        this.particles.rotation.z += rotationSpeed * 0.3;
    }

    render() {
        if (this.particles) {
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.color.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    changeShape(shape) {
        this.generateShape(shape);
        this.currentPositions.set(this.targetPositions);
    }
}

/* ============================================================================
   HAND TRACKING MANAGER
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
            unzoomFactor: 0  // For pinch-out reverse zoom
        };
        this.prevHandSeparation = 0;  // Track previous hand separation
        this.prevPinchDistance = 0;   // Track previous pinch distance
        this.hands = null;
        this.camera_obj = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            const Hands = window.Hands;
            const Camera = window.Camera;

            if (!Hands || !Camera) {
                console.warn('MediaPipe not loaded');
                return false;
            }

            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 2,  // Detect both hands
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults(this.onHandsResults.bind(this));

            const video = document.getElementById('video');
            this.camera_obj = new Camera(video, {
                onFrame: async () => {
                    await this.hands.send({ image: video });
                },
                width: 640,
                height: 480
            });

            await this.camera_obj.start();
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.warn('Hand tracking initialization failed:', error);
            return false;
        }
    }

    onHandsResults(results) {
        const handStatus = document.getElementById('handStatus');

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const handCount = results.multiHandLandmarks.length;
            this.handData.detected = true;
            
            // Show hand count
            if (handCount === 2) {
                handStatus.textContent = '✓ Both Hands (ZOOM)';
                handStatus.style.color = '#00ff00';
            } else {
                handStatus.textContent = '✓ One Hand';
                handStatus.style.color = '#00ffaa';
            }

            const landmarks = results.multiHandLandmarks[0];

            // Landmark 9: Middle Finger MCP
            const middleMcp = landmarks[9];
            this.handData.centerX = (1 - middleMcp.x) * 30 - 15;
            this.handData.centerY = (1 - middleMcp.y) * 30 - 15;

            // Landmark 4: Thumb tip, Landmark 8: Index finger tip (Pinch)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];

            const dx = thumbTip.x - indexTip.x;
            const dy = thumbTip.y - indexTip.y;
            const dz = thumbTip.z - indexTip.z;
            this.handData.pinchDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            this.handData.power = Math.max(0, Math.min(1, this.handData.pinchDistance * 3));

            // Hand Y-coordinate
            this.handData.hue = (1 - middleMcp.y) * 360;

            // DUAL HAND ZOOM DETECTION - CONTROLLED & GRADUAL
            // Both hands must be close to each other (pinching motion between hands)
            if (handCount === 2) {
                const landmarks2 = results.multiHandLandmarks[1];
                const middleMcp2 = landmarks2[9];
                
                // Distance between two hands' midpoints
                const handSeparation = Math.sqrt(
                    Math.pow(middleMcp.x - middleMcp2.x, 2) +
                    Math.pow(middleMcp.y - middleMcp2.y, 2)
                );
                
                // Average position of both hands
                const avgHandX = (middleMcp.x + middleMcp2.x) / 2;
                const avgHandY = (middleMcp.y + middleMcp2.y) / 2;
                
                // Distance to camera (right-bottom corner)
                const distToCamera = Math.sqrt(
                    Math.pow(1 - avgHandX, 2) +
                    Math.pow(1 - avgHandY, 2)
                );
                
                if (handSeparation < 0.4) {
                    // BASE ZOOM: Just pinching hands together
                    const baseZoom = Math.max(0, (0.4 - handSeparation) / 0.4) * 0.6;
                    
                    // ULTRA ZOOM 150%: Pinching + Moving toward camera simultaneously
                    // If hands are also near camera area (right-bottom)
                    if (avgHandX > 0.65 && avgHandY > 0.55) {
                        // Ultra zoom bonus based on camera proximity
                        const cameraProximityBonus = Math.max(0, (1 - distToCamera / 0.6)) * 0.4;
                        this.handData.zoomFactor = Math.min(1.0, baseZoom + cameraProximityBonus);
                        
                        // Update status when ultra zoom is active
                        if (this.handData.zoomFactor > 0.8) {
                            handStatus.textContent = '⚡ ULTRA ZOOM 150%';
                            handStatus.style.color = '#ffff00';
                        }
                    } else {
                        // Normal zoom (just pinching)
                        this.handData.zoomFactor = baseZoom;
                    }
                } else {
                    this.handData.zoomFactor = 0;
                }
            } else {
                // SINGLE HAND ZOOM & UNZOOM
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
                    // Spreading fingers = unzoom
                    const spreadAmount = Math.min(0.2, this.handData.pinchDistance - 0.15);
                    this.handData.unzoomFactor = (spreadAmount / 0.2) * 0.5;  // Up to 50% unzoom power
                    this.handData.zoomFactor = 0;
                    
                    if (this.handData.unzoomFactor > 0.4) {
                        handStatus.textContent = '💥 SINGLE UNZOOM 150%';
                        handStatus.style.color = '#ff6600';
                    }
                } else {
                    this.handData.zoomFactor = 0;
                    this.handData.unzoomFactor = 0;
                }
                
                // Store for next frame
                this.prevPinchDistance = this.handData.pinchDistance;
            }

        } else {
            this.handData.detected = false;
            handStatus.textContent = '✗ No Hands';
            handStatus.style.color = '#ff6b6b';
            this.handData.zoomFactor = 0;
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
    constructor(particleCount) {
        this.particleCount = particleCount;
        this.frameCount = 0;
        this.lastTime = Date.now();
        this.fps = 0;
    }

    update(handData) {
        this.frameCount++;
        const currentTime = Date.now();
        const elapsed = currentTime - this.lastTime;

        if (elapsed > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        document.getElementById('particleCount').textContent = this.particleCount.toLocaleString();
        document.getElementById('fps').textContent = this.fps;
        document.getElementById('handPower').textContent = (handData.power * 100).toFixed(0) + '%';
    }
}
