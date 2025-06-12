export class StarHUD {
    constructor(scene, camera, keyboardNavigation) {
        this.scene = scene;
        this.camera = camera;
        this.keyboardNavigation = keyboardNavigation; // Reference to check FPV mode
        this.currentStar = null;
        this.isVisible = true; // HUD visible by default
        
        // Get HUD elements from DOM
        this.hudContainer = document.getElementById('hud'); // Correct HUD container
        this.hudPreview = document.querySelector('.star-preview');
        this.labelElement = document.querySelector('.star-name');
        this.distanceElement = document.querySelector('.star-distance');
        
        // Setup toggle key for HUD visibility
        this.setupToggleKey();
        
        if (this.hudPreview) {
            // Use CSS-based preview instead of second Babylon.js engine to avoid runtime conflicts
            console.log('StarHUD: Using CSS-based preview to avoid engine conflicts');
            this.hudPreview.style.background = 'radial-gradient(circle, #ffaa00 0%, #ff6600 50%, transparent 100%)';
            this.hudPreview.style.borderRadius = '50%';
            this.hudPreview.style.animation = 'starPulse 2s ease-in-out infinite alternate';
            
            // Add CSS animation if not already present
            if (!document.getElementById('starHudStyles')) {
                const style = document.createElement('style');
                style.id = 'starHudStyles';
                style.textContent = `
                    @keyframes starPulse {
                        0% { opacity: 0.7; transform: scale(0.9); }
                        100% { opacity: 1.0; transform: scale(1.1); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        // Handle picking - only when not in FPV mode (crosshair mode)
        scene.onPointerMove = (evt) => {
            // Only detect stars when not in FPV mode (mouse acts as crosshair)
            if (this.keyboardNavigation && this.keyboardNavigation.fpvMode) {
                return; // Skip star detection in FPV mode
            }
            
            // Only process if HUD is visible
            if (!this.isVisible) {
                return;
            }
            
            // FIXED: Use the same ray-casting logic as StarInteraction for consistency
            const closestStar = this.findClosestStarToPointer();
            
            if (closestStar) {
                // FIXED: Always update distance in real-time, even for the same star
                // This ensures distance updates when camera moves while hovering the same star
                const starChanged = this.currentStar !== closestStar.star;
                
                if (starChanged) {
                    console.log('StarHUD: Star detected:', closestStar.star.name);
                    this.currentStar = closestStar.star;
                }
                
                // ALWAYS recalculate distance in real-time using current camera position
                // FIX: Use scene.activeCamera to ensure we get the correct camera reference
                const activeCamera = this.scene.activeCamera;
                const realTimeDistance = BABYLON.Vector3.Distance(activeCamera.position, closestStar.star.position);
                
                // ENHANCED DIAGNOSTIC LOGGING: Track distance changes over time
                const currentTime = performance.now();
                console.log('🔍 STARHUD DISTANCE DIAGNOSIS:');
                console.log('  - Timestamp:', currentTime);
                console.log('  - Star:', closestStar.star.name);
                console.log('  - Real-time distance:', realTimeDistance);
                console.log('  - Star position:', closestStar.star.position);
                console.log('  - Active camera position:', activeCamera.position);
                console.log('  - Active camera reference:', activeCamera.name || 'unnamed');
                console.log('  - Scene active camera:', this.scene.activeCamera.name || 'unnamed');
                console.log('  - Camera match:', activeCamera === this.scene.activeCamera);
                console.log('  - Star changed:', starChanged);
                
                // Check if camera position is actually changing
                if (!this.lastCameraPosition) {
                    this.lastCameraPosition = activeCamera.position.clone();
                    this.lastDistance = realTimeDistance;
                } else {
                    const cameraMovement = BABYLON.Vector3.Distance(this.lastCameraPosition, activeCamera.position);
                    const distanceChange = Math.abs(this.lastDistance - realTimeDistance);
                    console.log('  - Camera movement since last check:', cameraMovement);
                    console.log('  - Distance change since last check:', distanceChange);
                    console.log('  - Expected correlation:', cameraMovement > 0.1 ? 'Distance should change' : 'Distance should be stable');
                    
                    this.lastCameraPosition = activeCamera.position.clone();
                    this.lastDistance = realTimeDistance;
                }
                
                // Update info panel with real-time distance calculation
                this.updateInfoPanel(closestStar.star, realTimeDistance);
            } else {
                this.clearInfoPanel();
            }
        };
    }
    
    findClosestStarToPointer() {
        // Get all star meshes in the scene
        const starMeshes = this.scene.meshes.filter(mesh =>
            mesh.name === 'starTemplate' && mesh.metadata && mesh.metadata.stars
        );
        
        if (starMeshes.length === 0) {
            return null;
        }
        
        const starMesh = starMeshes[0];
        const stars = starMesh.metadata.stars;
        
        if (!stars || stars.length === 0) {
            return null;
        }
        
        // FIXED: Use the same ray-casting logic as StarInteraction for consistency
        const ray = this.scene.createPickingRay(this.scene.pointerX, this.scene.pointerY, BABYLON.Matrix.Identity(), this.scene.activeCamera);
        
        // Manual intersection testing with each star (same as StarInteraction)
        let closestStar = null;
        let closestDistance = Infinity;
        
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            const starPos = star.position;
            
            // Calculate distance from ray to star position
            const rayToStar = starPos.subtract(ray.origin);
            const projectionLength = BABYLON.Vector3.Dot(rayToStar, ray.direction);
            
            // FIXED: Skip stars behind the camera (same as click method)
            if (projectionLength < 0) continue;
            
            // Find closest point on ray to star
            const closestPointOnRay = ray.origin.add(ray.direction.scale(projectionLength));
            const distanceToRay = BABYLON.Vector3.Distance(closestPointOnRay, starPos);
            
            // Calculate effective star radius for hovering (same logic as click)
            const distanceFromCamera = BABYLON.Vector3.Distance(starPos, this.scene.activeCamera.position);
            const baseRadius = star.scale || 1;
            // Make stars easier to hover when far away (same as click)
            const effectiveRadius = Math.max(baseRadius * 2, Math.min(10, distanceFromCamera * 0.02));
            
            // FIXED: Check if ray passes close enough to star AND prioritize by distance from camera
            if (distanceToRay <= effectiveRadius && projectionLength < closestDistance) {
                closestStar = star;
                closestDistance = projectionLength;
            }
        }
        
        if (closestStar) {
            const worldDistance = BABYLON.Vector3.Distance(closestStar.position, this.camera.position);
            return {
                star: closestStar,
                worldDistance: worldDistance
            };
        }
        
        return null;
    }
    
    setupToggleKey() {
        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyP') {
                this.toggleVisibility();
                event.preventDefault();
            }
        });
    }
    
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        if (this.hudContainer) {
            this.hudContainer.style.display = this.isVisible ? 'block' : 'none';
        }
        console.log('StarHUD: Visibility toggled -', this.isVisible ? 'ON' : 'OFF');
    }
    
    show() {
        this.isVisible = true;
        if (this.hudContainer) {
            this.hudContainer.style.display = 'block';
        }
    }
    
    hide() {
        this.isVisible = false;
        if (this.hudContainer) {
            this.hudContainer.style.display = 'none';
        }
    }

    updateInfoPanel(starData, distance) {
        if (!this.isVisible) return; // Don't update if HUD is hidden
        
        if (!starData) {
            this.clearInfoPanel();
            return;
        }

        // DIAGNOSTIC LOGGING: Verify the distance calculation
        console.log('🎯 DISTANCE UPDATE:');
        console.log('  - Star:', starData.name);
        console.log('  - Calculated distance:', distance);
        console.log('  - Distance formula used: sqrt((x2-x1)² + (y2-y1)² + (z2-z1)²)');
        console.log('  - Star position:', starData.position);
        console.log('  - Camera position:', this.scene.activeCamera.position);
        
        // Verify calculation manually
        const activeCamera = this.scene.activeCamera;
        const dx = starData.position.x - activeCamera.position.x;
        const dy = starData.position.y - activeCamera.position.y;
        const dz = starData.position.z - activeCamera.position.z;
        const manualDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        console.log('  - Manual verification:', manualDistance);
        console.log('  - Match:', Math.abs(distance - manualDistance) < 0.001 ? '✅ CORRECT' : '❌ MISMATCH');

        // Update name and distance with CORRECTED calculation
        this.labelElement.textContent = `[ ${starData.name} ]`;
        this.distanceElement.textContent = `${Math.round(distance * 10) / 10} AU`;
        this.labelElement.style.color = '#00fff7';
        this.distanceElement.style.color = '#00fff7';

        // Update CSS-based preview with star colors
        if (this.hudPreview && starData.colors && starData.colors.length > 0) {
            const color1 = starData.colors[0];
            const color2 = starData.colors[1] || color1;
            
            // Convert BABYLON.Color3 to CSS color
            const toHex = (color) => {
                if (color.r !== undefined) {
                    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
                    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
                    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
                    return `#${r}${g}${b}`;
                }
                return color;
            };
            
            const hex1 = toHex(color1);
            const hex2 = toHex(color2);
            
            this.hudPreview.style.background = `radial-gradient(circle, ${hex1} 0%, ${hex2} 50%, transparent 100%)`;
        }
    }

    clearInfoPanel() {
        this.currentStar = null;
        this.labelElement.textContent = '[ NO TARGET ]';
        this.distanceElement.textContent = '---';
        this.labelElement.style.color = '#445566';
        this.distanceElement.style.color = '#445566';
    }

    dispose() {
        console.log('StarHUD: Disposing resources');
        
        // Clear references - no Babylon.js resources to dispose anymore
        this.currentStar = null;
        this.scene = null;
        this.camera = null;
        
        // Reset preview to default state
        if (this.hudPreview) {
            this.hudPreview.style.background = '';
            this.hudPreview.style.animation = '';
        }
        
        console.log('StarHUD: Resources disposed successfully');
    }
}