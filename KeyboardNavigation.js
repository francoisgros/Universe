export class KeyboardNavigation {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.originalCamera = camera;
        this.options = {
            moveSpeed: options.moveSpeed || 50,
            rotationSpeed: options.rotationSpeed || 2,
            speedMultiplier: options.speedMultiplier || 3, // For shift key
            smoothing: options.smoothing || 0.9
        };
        
        // Movement state
        this.keys = {};
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.rotationVelocity = new BABYLON.Vector2(0, 0);
        this.isShiftPressed = false;
        
        // Convert to FreeCamera for true spatial navigation
        this.convertToFreeCamera();
        
        // Store original camera position for reset
        this.originalPosition = this.camera.position.clone();
        this.originalTarget = this.camera.getTarget().clone();
        
        // Setup keyboard event listeners
        this.setupKeyboardEvents();
        
        // Register update loop
        this.scene.registerBeforeRender(() => this.update());
        
        console.log('KeyboardNavigation: Initialized with FPV drone controls (Mode 2):');
        console.log('- F: Toggle FPV mode (mouse lock)');
        console.log('- Mouse: Crosshair mode / FPV look (when locked)');
        console.log('- Arrow Keys: Move forward/backward/left/right');
        console.log('- Page Up/Down: Move up/down');
        console.log('- Shift: Speed boost');
        console.log('- R: Reset position');
        console.log('- Space: Stop movement');
        console.log('- H: Toggle help HUD');
        console.log('- I: Toggle star info HUD');
    }
    
    convertToFreeCamera() {
        if (this.originalCamera instanceof BABYLON.ArcRotateCamera) {
            console.log('KeyboardNavigation: Converting ArcRotateCamera to FreeCamera for spatial navigation');
            
            // Get current position and target from ArcRotateCamera
            const currentPos = this.originalCamera.position.clone();
            const currentTarget = this.originalCamera.getTarget();
            
            // Detach original camera controls
            this.originalCamera.detachControl();
            
            // Create a new FreeCamera
            this.camera = new BABYLON.FreeCamera("spatialCamera", currentPos, this.scene);
            this.camera.setTarget(currentTarget);
            this.camera.minZ = this.originalCamera.minZ;
            this.camera.maxZ = this.originalCamera.maxZ;
            
            // Set as active camera
            this.scene.activeCamera = this.camera;
            
            console.log('KeyboardNavigation: Successfully converted to FreeCamera for spatial navigation');
        } else {
            // Already a FreeCamera or compatible
            this.camera = this.originalCamera;
        }
    }
    
    setupKeyboardEvents() {
        // Keyboard event handlers
        window.addEventListener('keydown', (event) => {
            this.keys[event.code.toLowerCase()] = true;
            
            // Handle special keys
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isShiftPressed = true;
            }
            
            // Reset position - ONLY for KeyR
            if (event.code === 'KeyR') {
                this.resetPosition();
                event.preventDefault();
                return; // Exit early to prevent other processing
            }
            
            // Stop movement
            if (event.code === 'Space') {
                this.stopMovement();
                event.preventDefault();
                return; // Exit early to prevent other processing
            }
            
            // Prevent default for movement keys and log them
            if (this.isMovementKey(event.code)) {
                console.log('KeyboardNavigation: Movement key pressed:', event.code);
                event.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.keys[event.code.toLowerCase()] = false;
            
            if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
                this.isShiftPressed = false;
            }
        });
        
        // FPV Drone mouse controls with F key toggle
        let isMouseLocked = false;
        this.fpvMode = false; // Track FPV mode state
        
        const canvas = this.scene.getEngine().getRenderingCanvas();
        
        // Toggle FPV mode with F key
        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyF') {
                this.toggleFPVMode();
                event.preventDefault();
            }
            if (event.code === 'Escape' && isMouseLocked) {
                this.exitFPVMode();
            }
        });
        
        // Handle pointer lock changes
        document.addEventListener('pointerlockchange', () => {
            isMouseLocked = document.pointerLockElement === canvas;
            if (!isMouseLocked && this.fpvMode) {
                this.fpvMode = false;
                console.log('FPV Mode: OFF (pointer lock lost)');
            }
        });
        
        // Mouse movement handling
        window.addEventListener('mousemove', (event) => {
            if (this.fpvMode && isMouseLocked) {
                // FPV mode: free look with pointer lock
                const deltaX = event.movementX || 0;
                const deltaY = event.movementY || 0;
                
                this.rotationVelocity.x += deltaY * 0.002;
                this.rotationVelocity.y += deltaX * 0.002;
            }
            // When not in FPV mode, mouse acts as crosshair for star targeting
            // This will be handled by UnifiedHUD for star detection
        });
        
        // Prevent context menu
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    isMovementKey(code) {
        const movementKeys = [
            // FPV Drone controls
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'PageUp', 'PageDown',
            'Space'
        ];
        return movementKeys.includes(code);
    }
    
    update() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;
        const currentSpeed = this.isShiftPressed ?
            this.options.moveSpeed * this.options.speedMultiplier :
            this.options.moveSpeed;
        
        // Always use FreeCamera logic for spatial navigation
        this.updateSpatialNavigation(deltaTime, currentSpeed);
        
        // DIAGNOSTIC LOGGING - Add comprehensive monitoring
        this.logDiagnostics();
    }
    
    updateSpatialNavigation(deltaTime, currentSpeed) {
        // Calculate movement direction based on camera orientation
        const forward = this.camera.getForwardRay().direction;
        const right = BABYLON.Vector3.Cross(forward, BABYLON.Vector3.Up()).normalize();
        const up = BABYLON.Vector3.Up();
        
        // Reset movement for this frame
        let movement = new BABYLON.Vector3(0, 0, 0);
        
        // Debug: Log active keys every 60 frames to see what's being detected
        if (!this.debugCounter) this.debugCounter = 0;
        this.debugCounter++;
        if (this.debugCounter % 60 === 0) {
            const activeKeys = Object.keys(this.keys).filter(key => this.keys[key]);
            if (activeKeys.length > 0) {
                console.log('KeyboardNavigation: Active keys:', activeKeys);
            }
        }
        
        // FPV Drone movement controls
        // Forward/Backward movement with arrow keys
        if (this.keys['arrowup']) {
            console.log('KeyboardNavigation: Moving forward (ArrowUp)');
            movement.addInPlace(forward);
        }
        if (this.keys['arrowdown']) {
            console.log('KeyboardNavigation: Moving backward (ArrowDown)');
            movement.subtractInPlace(forward);
        }
        
        // Left/Right strafe movement with arrow keys
        if (this.keys['arrowleft']) {
            console.log('KeyboardNavigation: Moving left (ArrowLeft)');
            movement.addInPlace(right);
        }
        if (this.keys['arrowright']) {
            console.log('KeyboardNavigation: Moving right (ArrowRight)');
            movement.subtractInPlace(right);
        }
        
        // Up/Down movement with Page Up/Down
        if (this.keys['pageup']) {
            movement.addInPlace(up);
        }
        if (this.keys['pagedown']) {
            movement.subtractInPlace(up);
        }
        
        // Normalize movement vector and apply speed
        if (movement.length() > 0) {
            movement.normalize();
            movement.scaleInPlace(currentSpeed * deltaTime);
            
            // Apply smoothing for fluid movement
            this.velocity.scaleInPlace(this.options.smoothing);
            this.velocity.addInPlace(movement.scale(1 - this.options.smoothing));
        } else {
            // Apply deceleration when no keys are pressed
            this.velocity.scaleInPlace(this.options.smoothing);
        }
        
        // Apply movement to camera position with galaxy boundary constraints
        const newPosition = this.camera.position.clone().addInPlace(this.velocity);
        
        // Check distance from galaxy center (optional boundary enforcement)
        const distanceFromCenter = Math.sqrt(newPosition.x * newPosition.x + newPosition.y * newPosition.y + newPosition.z * newPosition.z);
        const maxDistanceFromCenter = 1000; // Increased for deep space exploration
        
        if (distanceFromCenter <= maxDistanceFromCenter) {
            // Within bounds - apply movement normally
            this.camera.position.addInPlace(this.velocity);
        } else {
            // Beyond bounds - constrain to boundary
            const constrainedPosition = newPosition.normalize().scale(maxDistanceFromCenter);
            this.camera.position = constrainedPosition;
            // Reduce velocity to prevent bouncing at boundary
            this.velocity.scaleInPlace(0.5);
            console.log('Navigation: Constrained to galaxy boundary at distance', maxDistanceFromCenter);
        }
        
        // Handle rotation (mouse look) - rotate camera view direction
        if (this.rotationVelocity.length() > 0.001) {
            // Get current camera rotation
            const currentRotation = this.camera.rotation.clone();
            
            // Apply rotation changes
            currentRotation.y += this.rotationVelocity.y * this.options.rotationSpeed * deltaTime;
            currentRotation.x += this.rotationVelocity.x * this.options.rotationSpeed * deltaTime;
            
            // Clamp vertical rotation to prevent flipping
            currentRotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, currentRotation.x));
            
            // Apply the rotation
            this.camera.rotation = currentRotation;
            
            // Apply rotation smoothing
            this.rotationVelocity.scaleInPlace(0.8);
        }
    }
    
    
    toggleFPVMode() {
        if (this.fpvMode) {
            this.exitFPVMode();
        } else {
            // Handle async enterFPVMode
            this.enterFPVMode().catch(error => {
                console.error('FPV Mode: Toggle failed:', error);
            });
        }
    }
    
    async enterFPVMode() {
        const canvas = this.scene.getEngine().getRenderingCanvas();
        
        // Check if canvas is properly attached to document
        if (!canvas || !document.contains(canvas)) {
            console.error('FPV Mode: Canvas not found or not attached to document');
            return;
        }
        
        // Check if pointer lock is supported
        if (!canvas.requestPointerLock) {
            console.error('FPV Mode: Pointer lock not supported');
            return;
        }
        
        // Add proper async error handling for pointer lock request
        try {
            const pointerLockPromise = canvas.requestPointerLock();
            
            // Handle both Promise-based and callback-based implementations
            if (pointerLockPromise && typeof pointerLockPromise.then === 'function') {
                await pointerLockPromise;
            }
            
            this.fpvMode = true;
            console.log('FPV Mode: ON - Mouse locked for free look');
        } catch (error) {
            console.error('FPV Mode: Failed to request pointer lock:', error);
            this.fpvMode = false;
        }
    }
    
    exitFPVMode() {
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        this.fpvMode = false;
        console.log('FPV Mode: OFF - Mouse acts as crosshair');
    }

    resetPosition() {
        console.log('KeyboardNavigation: Resetting camera position');
        this.camera.position = this.originalPosition.clone();
        this.camera.setTarget(this.originalTarget.clone());
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.rotationVelocity = new BABYLON.Vector2(0, 0);
    }
    
    stopMovement() {
        console.log('KeyboardNavigation: Stopping all movement');
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.rotationVelocity = new BABYLON.Vector2(0, 0);
    }
    
    logDiagnostics() {
        // Only log every 60 frames (approximately once per second at 60fps) to avoid spam
        if (!this.diagnosticCounter) this.diagnosticCounter = 0;
        this.diagnosticCounter++;
        
        if (this.diagnosticCounter % 60 !== 0) return;
        
        const pos = this.camera.position;
        const distanceFromOrigin = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
        
        // Camera clipping plane analysis
        const nearClip = this.camera.minZ;
        const farClip = this.camera.maxZ;
        const clippingRatio = distanceFromOrigin / farClip;
        
        // Check if we're approaching clipping limits
        const nearClippingWarning = distanceFromOrigin < nearClip * 2;
        const farClippingWarning = distanceFromOrigin > farClip * 0.8;
        
        // Find nearest stars for distance analysis
        let nearestStarDistance = Infinity;
        let visibleStarsCount = 0;
        
        // Get star mesh from scene
        const starMesh = this.scene.meshes.find(mesh => mesh.name === 'starTemplate');
        if (starMesh && starMesh.metadata && starMesh.metadata.stars) {
            const stars = starMesh.metadata.stars;
            
            stars.forEach(star => {
                const starDistance = BABYLON.Vector3.Distance(pos, star.position);
                if (starDistance < nearestStarDistance) {
                    nearestStarDistance = starDistance;
                }
                
                // Count stars within reasonable viewing distance
                if (starDistance < farClip * 0.5) {
                    visibleStarsCount++;
                }
            });
        }
        
        // LOD factor calculation (matching star factory logic)
        const lodFactor = Math.max(0.3, Math.min(1.0, 100 / Math.max(nearestStarDistance, 50)));
        
        // Galaxy bounds analysis
        const galaxyRadius = 200;
        const haloRadius = 300;
        const distanceFromGalaxyCenter = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        const isInGalaxyDisk = distanceFromGalaxyCenter <= galaxyRadius;
        const isInHalo = distanceFromGalaxyCenter <= haloRadius;
        const isOutsideGalaxy = distanceFromGalaxyCenter > haloRadius;
        
        console.group('🪲 BLACK ZONE DIAGNOSTICS');
        console.log('📍 Camera Position:', `(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)})`);
        console.log('📏 Distance from Origin:', distanceFromOrigin.toFixed(1));
        console.log('🎯 Nearest Star Distance:', nearestStarDistance === Infinity ? 'No stars found' : nearestStarDistance.toFixed(1));
        console.log('👁️ Visible Stars Count:', visibleStarsCount);
        console.log('🔍 LOD Factor:', lodFactor.toFixed(3));
        
        console.group('🎬 Camera Clipping Analysis');
        console.log('Near Clip (minZ):', nearClip);
        console.log('Far Clip (maxZ):', farClip);
        console.log('Clipping Ratio (distance/farClip):', clippingRatio.toFixed(3));
        if (nearClippingWarning) console.warn('⚠️ NEAR CLIPPING WARNING: Too close to near plane!');
        if (farClippingWarning) console.warn('⚠️ FAR CLIPPING WARNING: Approaching far clipping plane!');
        if (clippingRatio > 1.0) console.error('🚨 FAR CLIPPING VIOLATION: Beyond far clipping plane!');
        console.groupEnd();
        
        console.group('🌌 Galaxy Position Analysis');
        console.log('Distance from Galaxy Center (XZ):', distanceFromGalaxyCenter.toFixed(1));
        console.log('Galaxy Region:', isInGalaxyDisk ? '🌀 Disk' : isInHalo ? '☁️ Halo' : '🌑 Outside Galaxy');
        if (isOutsideGalaxy) console.warn('⚠️ OUTSIDE GALAXY: No stars expected in this region!');
        console.groupEnd();
        
        // Check for potential black zone conditions
        const potentialBlackZone = (
            farClippingWarning ||
            clippingRatio > 1.0 ||
            isOutsideGalaxy ||
            nearestStarDistance > farClip * 0.5 ||
            visibleStarsCount < 10
        );
        
        if (potentialBlackZone) {
            console.group('🚨 BLACK ZONE RISK DETECTED');
            if (farClippingWarning || clippingRatio > 1.0) {
                console.error('CAUSE: Camera far clipping plane insufficient');
                console.log('RECOMMENDATION: Increase camera.maxZ from', farClip, 'to at least', Math.ceil(distanceFromOrigin * 1.5));
            }
            if (isOutsideGalaxy) {
                console.error('CAUSE: Camera outside galaxy bounds');
                console.log('RECOMMENDATION: Increase galaxy haloRadius or add boundary constraints');
            }
            if (nearestStarDistance > farClip * 0.5) {
                console.error('CAUSE: No stars within reasonable viewing distance');
                console.log('RECOMMENDATION: Increase star density or camera far clipping');
            }
            if (visibleStarsCount < 10) {
                console.error('CAUSE: Very few visible stars (LOD culling or distance)');
                console.log('RECOMMENDATION: Adjust LOD parameters or increase star visibility range');
            }
            console.groupEnd();
        }
        
        console.groupEnd();
    }
    
    dispose() {
        console.log('KeyboardNavigation: Disposing keyboard navigation');
        // Remove event listeners would go here if we stored references
        // For now, the window event listeners will persist
    }
}