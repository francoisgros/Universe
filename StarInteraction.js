export class StarInteraction {
    constructor(scene, camera, keyboardNavigation, options = {}) {
        this.scene = scene;
        this.keyboardNavigation = keyboardNavigation; // Reference to check FPV mode
        
        // CRITICAL FIX: Use the camera from KeyboardNavigation, not the original camera
        // KeyboardNavigation converts ArcRotateCamera to FreeCamera and sets it as scene.activeCamera
        this.camera = this.keyboardNavigation.camera || this.scene.activeCamera;
        
        console.log(`[FIXED] StarInteraction using camera: ${this.camera.name}`);
        console.log(`[FIXED] Scene active camera: ${this.scene.activeCamera.name}`);
        console.log(`[FIXED] Camera reference match: ${this.camera === this.scene.activeCamera}`);
        this.options = {
            maxSpeed: options.maxSpeed || 25,
            acceleration: options.acceleration || 10,
            decelDistance: options.decelDistance || 20,
            minDistance: options.minDistance || 0.5,
            rotationSpeed: options.rotationSpeed || 2.0
        };
        
        this.moving = false;
        this.targetPos = null;
        this.targetStar = null; // Store target star data for HUD
        this.velocity = 0;
        this.direction = new BABYLON.Vector3();
        this.lastTime = null;
        
        // Enhanced animation properties
        this.startPos = null;
        this.startRotation = null;
        this.targetRotation = null;
        this.animationProgress = 0;
        this.totalDistance = 0;
        this.estimatedDuration = 0;
        this.startTime = null;
        
        // Setup click handling using proper event registration
        this.clickHandler = (evt) => {
            if (evt.button !== 0) return; // Left click only
            
            console.log('StarInteraction: Click detected at:', scene.pointerX, scene.pointerY);
            console.log('StarInteraction: FPV mode:', this.keyboardNavigation?.fpvMode);
            
            // Only handle star clicks when not in FPV mode (crosshair mode)
            if (this.keyboardNavigation && this.keyboardNavigation.fpvMode) {
                console.log('StarInteraction: Skipping click - FPV mode active');
                return; // Skip star interaction in FPV mode
            }
            
            console.log('StarInteraction: Attempting custom star picking...');
            
            // SOLUTION: Custom picking for thin instances
            // Since Babylon.js thin instance picking fails, we implement manual ray-star intersection
            const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), scene.activeCamera);
            console.log('StarInteraction: Created picking ray');
            
            // Find star meshes
            const starMeshes = scene.meshes.filter(m => m.name === 'starTemplate' && m.isEnabled());
            console.log('StarInteraction: Found', starMeshes.length, 'star meshes');
            
            if (starMeshes.length === 0) {
                console.log('StarInteraction: No star meshes found');
                return;
            }
            
            const starMesh = starMeshes[0];
            if (!starMesh.metadata || !starMesh.metadata.stars) {
                console.log('StarInteraction: No star metadata found');
                return;
            }
            
            console.log('StarInteraction: Checking', starMesh.metadata.stars.length, 'stars for intersection');
            
            // Manual intersection testing with each star
            let closestStar = null;
            let closestDistance = Infinity;
            
            for (let i = 0; i < starMesh.metadata.stars.length; i++) {
                const star = starMesh.metadata.stars[i];
                const starPos = star.position;
                
                // Calculate distance from ray to star position
                const rayToStar = starPos.subtract(ray.origin);
                const projectionLength = BABYLON.Vector3.Dot(rayToStar, ray.direction);
                
                // Skip stars behind the camera
                if (projectionLength < 0) continue;
                
                // Find closest point on ray to star
                const closestPointOnRay = ray.origin.add(ray.direction.scale(projectionLength));
                const distanceToRay = BABYLON.Vector3.Distance(closestPointOnRay, starPos);
                
                // Calculate effective star radius for clicking (based on scale and distance from camera)
                const distanceFromCamera = BABYLON.Vector3.Distance(starPos, scene.activeCamera.position);
                const baseRadius = star.scale || 1;
                // FIXED: Significantly improved detection for distant stars
                // Progressive formula that adapts better to large distances
                const effectiveRadius = Math.max(baseRadius * 2, Math.min(25, distanceFromCamera * 0.05));
                
                // DIAGNOSTIC LOG: Track effective radius calculation for distant stars
                if (distanceFromCamera > 200) {
                    console.log(`🎯 DISTANT STAR DETECTION: ${star.name}`);
                    console.log(`  - Distance from camera: ${Math.round(distanceFromCamera)}AU`);
                    console.log(`  - Base radius: ${baseRadius}`);
                    console.log(`  - Effective radius: ${Math.round(effectiveRadius * 100) / 100}`);
                    console.log(`  - Old formula would give: ${Math.max(baseRadius * 2, Math.min(10, distanceFromCamera * 0.02))}`);
                }
                
                // Check if ray passes close enough to star
                if (distanceToRay <= effectiveRadius && projectionLength < closestDistance) {
                    closestStar = star;
                    closestDistance = projectionLength;
                    console.log(`StarInteraction: Found potential star hit: ${star.name} at distance ${Math.round(distanceToRay * 100) / 100} (radius: ${Math.round(effectiveRadius * 100) / 100})`);
                }
            }
            
            if (closestStar) {
                console.log(`StarInteraction: SUCCESS - Selected star: ${closestStar.name}`);
                console.log(`StarInteraction: Star position:`, closestStar.position);
                console.log(`StarInteraction: Navigating to star: ${closestStar.name}`);
                this.moveToStarInstance(closestStar, closestStar.position);
            } else {
                console.log('StarInteraction: No star found near click position');
                console.log('StarInteraction: Try clicking closer to a visible star');
            }
        };
        
        // Register click handler with canvas instead of scene
        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (canvas) {
            canvas.addEventListener('click', this.clickHandler);
            console.log('StarInteraction: Click handler registered with canvas');
        } else {
            console.error('StarInteraction: Could not get canvas for click registration');
        }
        
        // Register before render loop
        this._renderFunction = () => this.update();
        scene.registerBeforeRender(this._renderFunction);
        console.log('StarInteraction: Registered update function with scene render loop');
    }
    
    moveToStarInstance(starData, starWorldPosition) {
        // Cancel any existing movement
        if (this.moving) {
            console.log('StarInteraction: Cancelling previous navigation to start new one');
        }
        
        // Use the world position from the pick info
        const starPos = starWorldPosition.clone();
        
        // Store current camera state
        this.startPos = this.camera.position.clone();
        this.startRotation = this.camera.rotation.clone();
        
        // Calculate camera position and direction
        const camPos = this.camera.position.clone();
        this.direction = starPos.subtract(camPos);
        const dist = this.direction.length();
        this.direction.normalize();
        
        // Set target position at comfortable distance from star
        const starRadius = starData.size || 1;
        // FIXED: Optimized approach distance to avoid empty zones and improve navigation
        // Enhanced calculation considering star density and preventing black zones
        const approachDistance = Math.max(starRadius * 8, Math.min(25, dist * 0.15));
        
        // DIAGNOSTIC LOG: Track approach distance calculation
        console.log(`🎯 APPROACH DISTANCE CALCULATION for ${starData.name}:`);
        console.log(`  - Star radius: ${starRadius}`);
        console.log(`  - Total distance: ${Math.round(dist)}AU`);
        console.log(`  - Calculated approach distance: ${Math.round(approachDistance * 100) / 100}AU`);
        console.log(`  - Old formula would give: ${Math.max(starRadius * 5, 15)}AU`);
        this.targetPos = starPos.subtract(this.direction.scale(approachDistance));
        
        // Calculate target rotation to look at the star
        const lookDirection = starPos.subtract(this.targetPos).normalize();
        this.targetRotation = new BABYLON.Vector3();
        this.targetRotation.x = Math.asin(-lookDirection.y);
        this.targetRotation.y = Math.atan2(lookDirection.x, lookDirection.z);
        this.targetRotation.z = 0; // No roll
        
        // Store target star data for HUD updates
        this.targetStar = {
            ...starData,
            worldPosition: starPos.clone(),
            targetPosition: this.targetPos.clone()
        };
        
        // Calculate animation parameters - optimized for better UX
        this.totalDistance = dist;
        // Faster animation: 1-5 seconds instead of 2-10 seconds
        this.estimatedDuration = Math.max(1, Math.min(5, dist / (this.options.maxSpeed * 2)));
        this.startTime = performance.now();
        
        // Initialize movement
        this.moving = true;
        this.velocity = 0;
        this.animationProgress = 0;
        this.lastTime = null;
        
        console.log(`Moving to star: ${starData.name}, distance: ${Math.round(dist * 10) / 10} AU, ETA: ${Math.round(this.estimatedDuration * 10) / 10}s`);
    }
    
    moveToStar(star) {
        // Legacy method for backward compatibility
        const starPos = star.position.clone();
        const boundingBox = star.getBoundingInfo().boundingBox;
        const radius = (boundingBox.maximumWorld.subtract(boundingBox.minimumWorld)).length() * 0.5;
        
        const camPos = this.camera.position.clone();
        this.direction = starPos.subtract(camPos);
        const dist = this.direction.length();
        this.direction.normalize();
        
        this.targetPos = starPos.subtract(this.direction.scale(Math.max(2.5 * radius, 2)));
        
        this.moving = true;
        this.velocity = 0;
        this.lastTime = null;
        
        console.log(`Moving to star: ${star.metadata?.name || 'Unknown'}, distance: ${dist}`);
    }
    
    update() {
        if (!this.moving || !this.targetPos) return;
        
        const currentTime = performance.now();
        let dt = 0.016;
        if (this.lastTime !== null) {
            dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        }
        this.lastTime = currentTime;
        
        // Calculate animation progress (0 to 1)
        const elapsed = (currentTime - this.startTime) / 1000;
        this.animationProgress = Math.min(1, elapsed / this.estimatedDuration);
        
        // Use smooth easing function for natural movement
        const easeProgress = this.easeInOutCubic(this.animationProgress);
        
        // Interpolate position
        const currentPos = BABYLON.Vector3.Lerp(this.startPos, this.targetPos, easeProgress);
        const oldPosition = this.camera.position.clone();
        this.camera.position.copyFrom(currentPos);
        
        // DIAGNOSTIC LOGGING: Track camera movement during navigation
        const positionChange = BABYLON.Vector3.Distance(oldPosition, this.camera.position);
        if (positionChange > 0.1) { // Only log significant movements
            console.log('🚀 CAMERA MOVEMENT DURING NAVIGATION:');
            console.log('  - Progress:', Math.round(easeProgress * 100) + '%');
            console.log('  - Old position:', oldPosition);
            console.log('  - New position:', this.camera.position);
            console.log('  - Position change:', positionChange);
            console.log('  - Target star:', this.targetStar?.name);
            if (this.targetStar) {
                const distanceToTarget = BABYLON.Vector3.Distance(this.camera.position, this.targetStar.worldPosition);
                console.log('  - Current distance to target:', distanceToTarget);
            }
        }
        
        // Interpolate rotation for smooth camera turning
        if (this.startRotation && this.targetRotation) {
            const currentRotation = new BABYLON.Vector3();
            currentRotation.x = this.lerpAngle(this.startRotation.x, this.targetRotation.x, easeProgress);
            currentRotation.y = this.lerpAngle(this.startRotation.y, this.targetRotation.y, easeProgress);
            currentRotation.z = this.lerpAngle(this.startRotation.z, this.targetRotation.z, easeProgress);
            this.camera.rotation.copyFrom(currentRotation);
        }
        
        // Check if animation is complete
        if (this.animationProgress >= 1) {
            this.moving = false;
            this.animationProgress = 0;
            
            // Ensure perfect final positioning
            this.camera.position.copyFrom(this.targetPos);
            if (this.targetRotation) {
                this.camera.rotation.copyFrom(this.targetRotation);
            }
            
            console.log(`Navigation complete: Arrived at ${this.targetStar?.name || 'target'}`);
            
            // Clear target star after arrival
            this.targetStar = null;
        }
    }
    
    // Smooth easing function for natural movement
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Proper angle interpolation handling wrap-around
    lerpAngle(start, end, t) {
        let diff = end - start;
        
        // Handle wrap-around for angles
        if (diff > Math.PI) {
            diff -= 2 * Math.PI;
        } else if (diff < -Math.PI) {
            diff += 2 * Math.PI;
        }
        
        return start + diff * t;
    }
    
    // Get current navigation state for HUD
    getNavigationState() {
        if (!this.moving || !this.targetStar) {
            return null;
        }
        
        const currentDistance = BABYLON.Vector3.Distance(
            this.camera.position,
            this.targetStar.worldPosition
        );
        
        const remainingTime = this.estimatedDuration * (1 - this.animationProgress);
        
        return {
            targetStar: this.targetStar,
            currentDistance: currentDistance,
            totalDistance: this.totalDistance,
            progress: this.animationProgress,
            eta: remainingTime,
            isMoving: this.moving
        };
    }
    
    dispose() {
        this.moving = false;
        this.targetPos = null;
        
        // Remove click handler from canvas
        if (this.clickHandler && this.scene) {
            const canvas = this.scene.getEngine().getRenderingCanvas();
            if (canvas) {
                canvas.removeEventListener('click', this.clickHandler);
            }
        }
        
        this.scene.unregisterBeforeRender(this._renderFunction);
    }
}
