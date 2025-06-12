export class UnifiedHUD {
    constructor(scene, camera, keyboardNavigation, starInteraction = null) {
        this.scene = scene;
        this.camera = camera;
        this.keyboardNavigation = keyboardNavigation;
        this.starInteraction = starInteraction; // Reference to StarInteraction for navigation state
        this.currentStar = null;
        this.currentMode = null; // 'help', 'star-info', or null
        
        this.createHUD();
        this.setupToggleKeys();
        this.setupStarDetection();
    }
    
    createHUD() {
        // Create the unified HUD container
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'unifiedHUD';
        this.hudElement.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(0, 15, 25, 0.15);
            color: #00fff7;
            font-family: 'Orbitron', 'Courier New', monospace;
            font-size: 14px;
            padding: 25px;
            border: 2px solid rgba(0, 255, 247, 0.6);
            border-radius: 12px;
            z-index: 1000;
            width: 400px;
            min-height: 300px;
            display: none;
            backdrop-filter: blur(15px) saturate(1.8);
            box-shadow:
                0 0 30px rgba(0, 255, 247, 0.4),
                inset 0 0 20px rgba(0, 255, 247, 0.1),
                0 8px 32px rgba(0, 0, 0, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateZ(0);
            will-change: transform, opacity;
            box-sizing: border-box;
        `;
        
        // Create help content
        this.helpContent = this.createHelpContent();
        
        // Create star info content
        this.starInfoContent = this.createStarInfoContent();
        
        // Add both contents to HUD (only one will be visible at a time)
        this.hudElement.appendChild(this.helpContent);
        this.hudElement.appendChild(this.starInfoContent);
        
        document.body.appendChild(this.hudElement);
    }
    
    createHelpContent() {
        const helpDiv = document.createElement('div');
        helpDiv.id = 'helpContent';
        helpDiv.style.display = 'none';
        helpDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 15px; color: #ff3366; font-size: 16px; font-weight: bold;">
                🚀 FPV CONTROLS
            </div>
            <div style="margin-bottom: 10px; color: #ffaa00; font-weight: bold;">
                MOVEMENT:
            </div>
            <div style="margin-left: 10px; margin-bottom: 8px;">
                <span style="color: #00ff88;">↑</span> - Move Forward<br>
                <span style="color: #00ff88;">↓</span> - Move Backward<br>
                <span style="color: #00ff88;">←</span> - Move Left<br>
                <span style="color: #00ff88;">→</span> - Move Right<br>
                <span style="color: #00ff88;">Page ↑</span> - Move Up<br>
                <span style="color: #00ff88;">Page ↓</span> - Move Down
            </div>
            
            <div style="margin-bottom: 10px; color: #ffaa00; font-weight: bold;">
                CAMERA:
            </div>
            <div style="margin-left: 10px; margin-bottom: 8px;">
                <span style="color: #00ff88;">F</span> - Toggle FPV Mode<br>
                <span style="color: #00ff88;">Mouse (FPV mode)</span> - Look Around<br>
                <span style="color: #00ff88;">Mouse (crosshair)</span> - Target Stars
            </div>
            
            <div style="margin-bottom: 10px; color: #ffaa00; font-weight: bold;">
                CONTROLS:
            </div>
            <div style="margin-left: 10px; margin-bottom: 8px;">
                <span style="color: #00ff88;">Shift</span> - High Speed<br>
                <span style="color: #00ff88;">Space</span> - Stop Movement<br>
                <span style="color: #00ff88;">R</span> - Reset Position<br>
                <span style="color: #00ff88;">H</span> - Show/Hide This Help<br>
                <span style="color: #00ff88;">I</span> - Show/Hide Star HUD
            </div>
            
            <div style="margin-bottom: 10px; color: #ffaa00; font-weight: bold;">
                INTERACTIONS:
            </div>
            <div style="margin-left: 10px;">
                <span style="color: #00ff88;">Star Hover</span> - Display Info in HUD<br>
                <span style="color: #00ff88;">Left Click</span> - Navigate to Star
            </div>
            
            <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #888;">
                Press <span style="color: #00ff88;">H</span> to hide
            </div>
        `;
        return helpDiv;
    }
    
    createStarInfoContent() {
        const starDiv = document.createElement('div');
        starDiv.id = 'starInfoContent';
        starDiv.style.display = 'none';
        starDiv.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px; color: #ff3366; font-size: 16px; font-weight: bold;">
                ⭐ STELLAR OBSERVATORY
            </div>
            
            <!-- Empty State Container -->
            <div id="emptyState" style="
                text-align: center;
                padding: 20px 15px;
                display: block;
                min-height: 200px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            ">
                <div style="
                    font-size: 16px;
                    color: #00fff7;
                    margin-bottom: 15px;
                    text-shadow: 0 0 10px rgba(0, 255, 247, 0.6);
                    animation: inviteGlow 3s ease-in-out infinite;
                    line-height: 1.4;
                ">
                    Point your cursor at a star to reveal its secrets...
                </div>
                <div style="
                    font-size: 13px;
                    color: #445566;
                    font-style: italic;
                    animation: invitePulse 4s ease-in-out infinite;
                    line-height: 1.3;
                ">
                    Explore the cosmos and discover stellar wonders
                </div>
                <div style="
                    margin-top: 20px;
                    width: 80px;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #00fff7, transparent);
                    margin-left: auto;
                    margin-right: auto;
                    animation: scanLine 2s ease-in-out infinite;
                "></div>
            </div>
            
            <!-- Star Details Container -->
            <div id="starDetails" style="display: none; min-height: 200px;">
                <!-- Navigation Status (shown when navigating) -->
                <div id="navigationStatus" style="
                    display: none;
                    background: rgba(0, 255, 100, 0.1);
                    border: 1px solid rgba(0, 255, 100, 0.3);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 15px;
                    animation: navigationPulse 2s ease-in-out infinite;
                ">
                    <div style="
                        color: #00ff88;
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 8px;
                        text-align: center;
                    ">🚀 NAVIGATION IN PROGRESS</div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #00fff7; font-size: 10px;">Target:</span>
                        <span id="navTargetName" style="color: #ffaa00; font-size: 10px; font-weight: bold;">---</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="color: #00fff7; font-size: 10px;">Distance:</span>
                        <span id="navCurrentDistance" style="color: #00ff88; font-size: 10px;">---</span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #00fff7; font-size: 10px;">ETA:</span>
                        <span id="navETA" style="color: #ff6600; font-size: 10px; font-weight: bold;">---</span>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div style="
                        width: 100%;
                        height: 4px;
                        background: rgba(0, 255, 247, 0.2);
                        border-radius: 2px;
                        overflow: hidden;
                        margin-bottom: 4px;
                    ">
                        <div id="navProgressBar" style="
                            height: 100%;
                            background: linear-gradient(90deg, #00ff88, #00fff7);
                            width: 0%;
                            transition: width 0.3s ease;
                            box-shadow: 0 0 8px rgba(0, 255, 247, 0.6);
                        "></div>
                    </div>
                    
                    <div style="text-align: center;">
                        <span id="navProgress" style="color: #00fff7; font-size: 9px;">0%</span>
                    </div>
                </div>

                <div style="display: flex; align-items: flex-start; margin-bottom: 18px;">
                    <div id="starPreview" style="
                        width: 45px;
                        height: 45px;
                        border-radius: 50%;
                        margin-right: 15px;
                        background: radial-gradient(circle, #ffaa00 0%, #ff6600 50%, transparent 100%);
                        animation: starPulse 2s ease-in-out infinite alternate;
                        box-shadow: 0 0 15px rgba(255, 170, 0, 0.5);
                        flex-shrink: 0;
                    "></div>
                    <div style="flex: 1; min-width: 0;">
                        <div id="starName" style="
                            color: #00fff7;
                            font-size: 16px;
                            font-weight: bold;
                            margin-bottom: 6px;
                            text-shadow: 0 0 8px rgba(0, 255, 247, 0.6);
                            word-wrap: break-word;
                            overflow-wrap: break-word;
                        ">Star Name</div>
                        <div id="starType" style="
                            color: #ffaa00;
                            font-size: 12px;
                            margin-bottom: 4px;
                            font-weight: 500;
                            line-height: 1.3;
                        ">Stellar Classification</div>
                        <div id="starDistance" style="
                            color: #00ff88;
                            font-size: 11px;
                            font-weight: 500;
                        ">Distance</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 12px;">
                    <div style="color: #ffaa00; font-weight: bold; font-size: 11px; margin-bottom: 6px;">
                        STELLAR PROPERTIES:
                    </div>
                    <div style="margin-left: 8px; font-size: 10px; line-height: 1.3;">
                        <div id="starSize" style="color: #00fff7; margin-bottom: 2px; word-wrap: break-word;">Size: ---</div>
                        <div id="starLocation" style="color: #00fff7; margin-bottom: 2px; word-wrap: break-word;">Location: ---</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 8px; color: #ffaa00; font-weight: bold; font-size: 11px;">
                    NAVIGATION:
                </div>
                <div style="margin-left: 8px; margin-bottom: 8px; font-size: 10px; line-height: 1.3;">
                    <div id="cameraPosition" style="color: #00fff7; margin-bottom: 2px; word-wrap: break-word;">Position: (---, ---, ---)</div>
                    <div style="margin-top: 6px;">
                        <span style="color: #00ff88;">Mouse Hover</span> - Detect Star<br>
                        <span style="color: #00ff88;">Left Click</span> - Navigate to Star
                    </div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #888;">
                Press <span style="color: #00ff88;">I</span> to hide
            </div>
        `;
        
        // Add CSS animation if not already present
        if (!document.getElementById('starHudStyles')) {
            const style = document.createElement('style');
            style.id = 'starHudStyles';
            style.textContent = `
                @keyframes starPulse {
                    0% {
                        opacity: 0.8;
                        transform: scale(0.95);
                        box-shadow: 0 0 15px rgba(255, 170, 0, 0.6);
                    }
                    50% {
                        opacity: 1.0;
                        transform: scale(1.05);
                        box-shadow: 0 0 25px rgba(255, 170, 0, 0.9);
                    }
                    100% {
                        opacity: 0.8;
                        transform: scale(0.95);
                        box-shadow: 0 0 15px rgba(255, 170, 0, 0.6);
                    }
                }
                
                @keyframes inviteGlow {
                    0% {
                        text-shadow: 0 0 10px rgba(0, 255, 247, 0.6);
                        opacity: 0.8;
                    }
                    50% {
                        text-shadow: 0 0 15px rgba(0, 255, 247, 0.9), 0 0 25px rgba(0, 255, 247, 0.4);
                        opacity: 1.0;
                    }
                    100% {
                        text-shadow: 0 0 10px rgba(0, 255, 247, 0.6);
                        opacity: 0.8;
                    }
                }
                
                @keyframes invitePulse {
                    0% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0.5; }
                }
                
                @keyframes scanLine {
                    0% {
                        transform: scaleX(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scaleX(1);
                        opacity: 1;
                    }
                    100% {
                        transform: scaleX(0);
                        opacity: 0;
                    }
                }
                
                @keyframes hudGlow {
                    0% { box-shadow: 0 0 30px rgba(0, 255, 247, 0.4), inset 0 0 20px rgba(0, 255, 247, 0.1); }
                    50% { box-shadow: 0 0 40px rgba(0, 255, 247, 0.6), inset 0 0 25px rgba(0, 255, 247, 0.15); }
                    100% { box-shadow: 0 0 30px rgba(0, 255, 247, 0.4), inset 0 0 20px rgba(0, 255, 247, 0.1); }
                }
                
                @keyframes textGlow {
                    0% { text-shadow: 0 0 5px rgba(0, 255, 247, 0.5); }
                    50% { text-shadow: 0 0 10px rgba(0, 255, 247, 0.8), 0 0 20px rgba(0, 255, 247, 0.3); }
                    100% { text-shadow: 0 0 5px rgba(0, 255, 247, 0.5); }
                }
                
                @keyframes navigationPulse {
                    0% {
                        border-color: rgba(0, 255, 100, 0.3);
                        box-shadow: 0 0 10px rgba(0, 255, 100, 0.2);
                    }
                    50% {
                        border-color: rgba(0, 255, 100, 0.6);
                        box-shadow: 0 0 20px rgba(0, 255, 100, 0.4);
                    }
                    100% {
                        border-color: rgba(0, 255, 100, 0.3);
                        box-shadow: 0 0 10px rgba(0, 255, 100, 0.2);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        return starDiv;
    }
    
    setupToggleKeys() {
        window.addEventListener('keydown', (event) => {
            if (event.code === 'KeyH') {
                this.toggleHelp();
                event.preventDefault();
            } else if (event.code === 'KeyI') {
                this.toggleStarInfo();
                event.preventDefault();
            }
        });
    }
    
    setupStarDetection() {
        console.log('UnifiedHUD: Setting up star detection system');
        
        // Use scene.registerBeforeRender for continuous star detection instead of onPointerMove
        this.starDetectionFunction = () => {
            // Update camera position display if star info mode is active
            if (this.currentMode === 'star-info') {
                this.updateCameraPosition();
            }
            
            // Only detect stars when not in FPV mode (mouse acts as crosshair)
            if (this.keyboardNavigation && this.keyboardNavigation.fpvMode) {
                return; // Skip star detection in FPV mode
            }
            
            // Only process if star info mode is active
            if (this.currentMode !== 'star-info') {
                return;
            }
            
            // Update navigation status if available
            this.updateNavigationStatus();
            
            // CUSTOM PICKING: Since thin instance picking is unreliable, implement manual picking
            const closestStar = this.findClosestStarToPointer();
            
            if (closestStar && closestStar.distance < 50) { // Within 50 pixels
                // FIXED: Always update distance in real-time, even for the same star
                // This ensures distance updates when camera moves while hovering the same star
                const starChanged = this.currentStar !== closestStar.star;
                
                if (starChanged) {
                    console.log('UnifiedHUD: Updating star info for:', closestStar.star.name);
                    this.currentStar = closestStar.star;
                }
                
                // ALWAYS recalculate distance in real-time using current camera position
                // FIX: Use scene.activeCamera to ensure we get the correct camera reference
                const activeCamera = this.scene.activeCamera;
                const realTimeDistance = BABYLON.Vector3.Distance(activeCamera.position, closestStar.star.position);
                
                // ENHANCED DIAGNOSTIC LOGGING: Track distance changes over time
                const currentTime = performance.now();
                console.log('🔍 UNIFIED HUD DISTANCE DIAGNOSIS:');
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
                
                // Update star info with real-time distance calculation
                this.updateStarInfo(closestStar.star, realTimeDistance);
            } else {
                if (this.currentStar) {
                    console.log('UnifiedHUD: Clearing current star info');
                    this.clearStarInfo();
                }
            }
        };
        
        // Register the detection function to run every frame
        this.scene.registerBeforeRender(this.starDetectionFunction);
        console.log('UnifiedHUD: Star detection registered with scene render loop');
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
        
        // Get pointer position in screen coordinates
        const pointerX = this.scene.pointerX;
        const pointerY = this.scene.pointerY;
        
        // FIXED: Use the same ray-casting logic as click detection for consistency
        const ray = this.scene.createPickingRay(pointerX, pointerY, BABYLON.Matrix.Identity(), this.scene.activeCamera);
        
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
            const distanceFromCamera = BABYLON.Vector3.Distance(starPos, this.camera.position);
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
                distance: 0, // Screen distance not needed for hover
                worldDistance: worldDistance
            };
        }
        
        return null;
    }
    
    toggleHelp() {
        if (this.currentMode === 'help') {
            this.hide();
        } else {
            this.showHelp();
        }
    }
    
    toggleStarInfo() {
        if (this.currentMode === 'star-info') {
            this.hide();
        } else {
            this.showStarInfo();
        }
    }
    
    showHelp() {
        this.currentMode = 'help';
        this.helpContent.style.display = 'block';
        this.starInfoContent.style.display = 'none';
        this.hudElement.style.display = 'block';
        console.log('UnifiedHUD: Help mode activated');
    }
    
    showStarInfo() {
        this.currentMode = 'star-info';
        this.helpContent.style.display = 'none';
        this.starInfoContent.style.display = 'block';
        this.hudElement.style.display = 'block';
        console.log('UnifiedHUD: Star info mode activated');
    }
    
    hide() {
        this.currentMode = null;
        this.hudElement.style.display = 'none';
        this.clearStarInfo();
        console.log('UnifiedHUD: Hidden');
    }
    
    updateStarInfo(starData, distance) {
        if (this.currentMode !== 'star-info') return;
        
        // Hide empty state and show star details
        const emptyState = document.getElementById('emptyState');
        const starDetails = document.getElementById('starDetails');
        if (emptyState) emptyState.style.display = 'none';
        if (starDetails) starDetails.style.display = 'block';
        
        const starName = document.getElementById('starName');
        const starType = document.getElementById('starType');
        const starDistance = document.getElementById('starDistance');
        const starSize = document.getElementById('starSize');
        const starLocation = document.getElementById('starLocation');
        const starPreview = document.getElementById('starPreview');
        
        if (starName && starDistance && starPreview) {
            // Update star name
            starName.textContent = starData.name;
            
            // Format distance with appropriate units
            let distanceText;
            if (distance < 1) {
                distanceText = `${Math.round(distance * 1000)} million km`;
            } else if (distance < 100) {
                distanceText = `${Math.round(distance * 10) / 10} AU`;
            } else if (distance < 1000) {
                distanceText = `${Math.round(distance)} AU`;
            } else {
                const lightYears = distance * 0.0000158; // Convert AU to light years
                distanceText = `${Math.round(lightYears * 100) / 100} light years`;
            }
            starDistance.textContent = distanceText;
            
            // Update stellar classification
            if (starType) {
                const typeMap = {
                    'blue_giant': 'Type O/B - Blue Giant',
                    'blue_star': 'Type B - Blue Main Sequence',
                    'white_star': 'Type A - White Main Sequence',
                    'yellow_star': 'Type G - Yellow Main Sequence',
                    'orange_star': 'Type K - Orange Main Sequence',
                    'red_dwarf': 'Type M - Red Dwarf',
                    'red_giant': 'Type M - Red Giant',
                    'red_supergiant': 'Type M - Red Supergiant',
                    'white_dwarf': 'White Dwarf',
                    'neutron_star': 'Neutron Star'
                };
                starType.textContent = typeMap[starData.type] || 'Unknown Classification';
            }
            
            // Update size information
            if (starSize) {
                let sizeDesc;
                if (starData.size < 0.1) {
                    sizeDesc = 'Extremely Small';
                } else if (starData.size < 0.3) {
                    sizeDesc = 'Very Small';
                } else if (starData.size < 0.6) {
                    sizeDesc = 'Small';
                } else if (starData.size < 0.8) {
                    sizeDesc = 'Medium';
                } else if (starData.size < 1.2) {
                    sizeDesc = 'Large';
                } else {
                    sizeDesc = 'Very Large';
                }
                starSize.textContent = `Size: ${sizeDesc} (${Math.round(starData.size * 100)}% solar)`;
            }
            
            // Update location information
            if (starLocation) {
                let locationDesc;
                if (starData.distanceFromCenter < 40) {
                    locationDesc = 'Galactic Core';
                } else if (starData.distanceFromCenter < 200) {
                    locationDesc = 'Galactic Disk';
                } else {
                    locationDesc = 'Galactic Halo';
                }
                starLocation.textContent = `Location: ${locationDesc}`;
            }
            
            // Update preview with star colors
            if (starData.color) {
                const color = starData.color;
                
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
                
                const hex = toHex(color);
                const darkerHex = toHex({
                    r: color.r * 0.7,
                    g: color.g * 0.7,
                    b: color.b * 0.7
                });
                
                starPreview.style.background = `radial-gradient(circle, ${hex} 0%, ${darkerHex} 50%, transparent 100%)`;
                starPreview.style.boxShadow = `0 0 20px ${hex}`;
            }
        }
    }
    
    clearStarInfo() {
        this.currentStar = null;
        
        // Show empty state and hide star details
        const emptyState = document.getElementById('emptyState');
        const starDetails = document.getElementById('starDetails');
        if (emptyState) emptyState.style.display = 'block';
        if (starDetails) starDetails.style.display = 'none';
    }
    
    updateNavigationStatus() {
        if (!this.starInteraction) return;
        
        const navState = this.starInteraction.getNavigationState();
        const navigationStatus = document.getElementById('navigationStatus');
        
        if (!navigationStatus) return;
        
        if (navState && navState.isMoving) {
            // Show navigation status
            navigationStatus.style.display = 'block';
            
            // Update navigation info
            const navTargetName = document.getElementById('navTargetName');
            const navCurrentDistance = document.getElementById('navCurrentDistance');
            const navETA = document.getElementById('navETA');
            const navProgress = document.getElementById('navProgress');
            const navProgressBar = document.getElementById('navProgressBar');
            
            if (navTargetName) {
                navTargetName.textContent = navState.targetStar.name;
            }
            
            if (navCurrentDistance) {
                let distanceText;
                const distance = navState.currentDistance;
                if (distance < 1) {
                    distanceText = `${Math.round(distance * 1000)} million km`;
                } else if (distance < 100) {
                    distanceText = `${Math.round(distance * 10) / 10} AU`;
                } else if (distance < 1000) {
                    distanceText = `${Math.round(distance)} AU`;
                } else {
                    const lightYears = distance * 0.0000158;
                    distanceText = `${Math.round(lightYears * 100) / 100} ly`;
                }
                navCurrentDistance.textContent = distanceText;
            }
            
            if (navETA) {
                const eta = navState.eta;
                if (eta < 1) {
                    navETA.textContent = `${Math.round(eta * 10) / 10}s`;
                } else {
                    navETA.textContent = `${Math.round(eta)}s`;
                }
            }
            
            if (navProgress) {
                const progressPercent = Math.round(navState.progress * 100);
                navProgress.textContent = `${progressPercent}%`;
            }
            
            if (navProgressBar) {
                const progressPercent = navState.progress * 100;
                navProgressBar.style.width = `${progressPercent}%`;
            }
        } else {
            // Hide navigation status
            navigationStatus.style.display = 'none';
        }
    }
    
    updateCameraPosition() {
        const cameraPositionElement = document.getElementById('cameraPosition');
        if (!cameraPositionElement) return;
        
        // Use scene.activeCamera to get the current camera position
        const activeCamera = this.scene.activeCamera;
        if (!activeCamera) return;
        
        const pos = activeCamera.position;
        const x = Math.round(pos.x * 10) / 10;
        const y = Math.round(pos.y * 10) / 10;
        const z = Math.round(pos.z * 10) / 10;
        
        cameraPositionElement.textContent = `Position: (${x}, ${y}, ${z})`;
        
        // Debug: Log position changes to verify real-time updates
        if (!this.lastLoggedPosition ||
            Math.abs(this.lastLoggedPosition.x - pos.x) > 0.1 ||
            Math.abs(this.lastLoggedPosition.y - pos.y) > 0.1 ||
            Math.abs(this.lastLoggedPosition.z - pos.z) > 0.1) {
            console.log('🎯 Camera position updated:', `(${x}, ${y}, ${z})`);
            this.lastLoggedPosition = pos.clone();
        }
    }
    
    // Legacy methods for compatibility
    show() {
        this.showHelp();
    }
    
    toggle() {
        this.toggleHelp();
    }
    
    dispose() {
        if (this.hudElement && this.hudElement.parentNode) {
            this.hudElement.parentNode.removeChild(this.hudElement);
        }
        
        // Unregister star detection function
        if (this.starDetectionFunction && this.scene) {
            this.scene.unregisterBeforeRender(this.starDetectionFunction);
        }
        
        // Clear references
        this.currentStar = null;
        this.starDetectionFunction = null;
        this.scene = null;
        this.camera = null;
        this.keyboardNavigation = null;
        
        console.log('UnifiedHUD: Resources disposed successfully');
    }
}