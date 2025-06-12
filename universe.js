import { StarInteraction } from './StarInteraction.js';
import { StarFactory } from './star-factory-simple-reliable.js';
import { KeyboardNavigation } from './KeyboardNavigation.js';
import { UnifiedHUD } from './ControlsHUD.js';

export class UniverseScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }
        
        console.log('UniverseScene: Creating main Babylon.js engine');
        try {
            this.engine = new BABYLON.Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                powerPreference: "high-performance"
            });
            console.log('UniverseScene: Main engine created successfully');
        } catch (error) {
            console.error('UniverseScene: Failed to create main engine:', error);
            throw error;
        }
        this.initPromise = this.init();
    }

    async init() {
        try {
            // Create and initialize the scene
            this.scene = new BABYLON.Scene(this.engine);
            this.scene.clearColor = new BABYLON.Color3(0, 0, 0);
            
            // Camera setup
            this.camera = new BABYLON.ArcRotateCamera(
                "camera",
                Math.PI / 4, // Angle horizontal initial
                Math.PI / 3, // Angle vertical initial
                200,        // Distance réduite pour commencer dans le halo de la galaxie
                BABYLON.Vector3.Zero(),
                this.scene
            );
            
            // Adjust camera settings for better navigation
            this.camera.minZ = 0.1;
            this.camera.maxZ = 10000; // Increased for deep space navigation
            this.camera.lowerRadiusLimit = 10;
            this.camera.upperRadiusLimit = 1000;
            
            // Initially attach arc rotate controls (will be managed by KeyboardNavigation)
            this.camera.attachControl(this.canvas, true);
            this.camera.inputs.attached.mousewheel.detachControl();
            
            // Lighting
            const light = new BABYLON.HemisphericLight(
                "light",
                new BABYLON.Vector3(1, 1, 0),
                this.scene
            );
            light.intensity = 1.5;
            light.groundColor = new BABYLON.Color3(0.2, 0.2, 0.4);
            
            // Post-processing setup
            const pipeline = new BABYLON.DefaultRenderingPipeline(
                "defaultPipeline",
                true,
                this.scene,
                [this.camera]
            );
            pipeline.imageProcessing.contrast = 1.5;
            pipeline.imageProcessing.exposure = 1.2;
            pipeline.bloomEnabled = true;
            pipeline.bloomThreshold = 0.3;
            pipeline.bloomWeight = 2.5;
            pipeline.bloomKernel = 64;
            pipeline.bloomScale = 0.5;
            
            // Initialize StarFactory
            const starFactory = new StarFactory(this.scene);
            
            // Generate stars
            console.log('UniverseScene: Starting realistic galaxy generation...');
            const stars = await starFactory.generateGalaxy(10000); // Realistic galaxy with 10k stars
            console.log('UniverseScene: Galaxy generation completed, stars:', stars ? stars.length : 'null');
            
            if (stars && stars.length > 0) {
                console.log('UniverseScene: Applying gravity adjustments...');
                starFactory.adjustPositionsByGravity(stars);
                console.log('UniverseScene: Gravity adjustments completed');
                
                // Store stars in mesh metadata for HUD access - preserve existing metadata
                if (starFactory.starMesh) {
                    // Don't overwrite existing metadata, just ensure stars are accessible
                    if (!starFactory.starMesh.metadata) {
                        starFactory.starMesh.metadata = {};
                    }
                    // The star factory already set metadata.stars, so we don't need to overwrite
                    console.log('UniverseScene: Stars metadata preserved on mesh');
                    console.log('UniverseScene: Mesh metadata keys:', Object.keys(starFactory.starMesh.metadata));
                    console.log('UniverseScene: Stars count in metadata:', starFactory.starMesh.metadata.stars?.length);
                }
            } else {
                console.error('UniverseScene: No stars generated - this may cause display issues');
            }
            
            // Adjust camera to start inside the galaxy halo for immediate star visibility
            this.camera.setPosition(new BABYLON.Vector3(150, 75, 150));
            this.camera.setTarget(BABYLON.Vector3.Zero());
            this.camera.upperRadiusLimit = 400; // Reduced to prevent navigation into empty space
            
            // Initialize star systems only after stars are generated
            console.log('UniverseScene: Initializing UnifiedHUD, StarInteraction, and KeyboardNavigation');
            try {
                // Initialize keyboard navigation first
                this.keyboardNavigation = new KeyboardNavigation(this.scene, this.camera, {
                    moveSpeed: 75,
                    rotationSpeed: 1.5,
                    speedMultiplier: 2.5,
                    smoothing: 0.85
                });
                console.log('UniverseScene: KeyboardNavigation initialized successfully');
                
                // Initialize star interaction first
                this.starInteraction = new StarInteraction(this.scene, this.camera, this.keyboardNavigation);
                console.log('UniverseScene: StarInteraction initialized successfully');
                
                // Initialize unified HUD system with StarInteraction reference
                this.unifiedHUD = new UnifiedHUD(this.scene, this.camera, this.keyboardNavigation, this.starInteraction);
                console.log('UniverseScene: UnifiedHUD initialized successfully');
                
                // Ensure canvas has focus for keyboard events
                this.canvas.focus();
                this.canvas.tabIndex = 1; // Make canvas focusable
            } catch (error) {
                console.error('UniverseScene: Failed to initialize star systems:', error);
                // Continue without HUD/Interaction if they fail
            }
            
            // Start rendering loop
            this.engine.runRenderLoop(() => {
                this.scene.render();
            });

            // Hide loading screen with fade out
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.transition = 'opacity 1s';
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to initialize universe:', error);
            throw error; // Re-throw to be caught by main.js
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        
        // Handle page unload to prevent runtime errors
        window.addEventListener('beforeunload', () => {
            this.dispose();
        });
        
        // Handle visibility change to pause/resume rendering
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('UniverseScene: Page hidden, pausing render loop');
                this.engine.stopRenderLoop();
            } else {
                console.log('UniverseScene: Page visible, resuming render loop');
                this.engine.runRenderLoop(() => {
                    this.scene.render();
                });
            }
        });
    }
    
    dispose() {
        console.log('UniverseScene: Disposing all resources');
        
        try {
            // Stop render loop
            if (this.engine) {
                this.engine.stopRenderLoop();
            }
            
            // Dispose star systems
            if (this.unifiedHUD) {
                this.unifiedHUD.dispose();
                this.unifiedHUD = null;
            }
            
            if (this.starInteraction) {
                this.starInteraction.dispose();
                this.starInteraction = null;
            }
            
            if (this.keyboardNavigation) {
                this.keyboardNavigation.dispose();
                this.keyboardNavigation = null;
            }
            
            // Dispose scene
            if (this.scene) {
                this.scene.dispose();
                this.scene = null;
            }
            
            // Dispose engine last
            if (this.engine) {
                this.engine.dispose();
                this.engine = null;
            }
            
            console.log('UniverseScene: All resources disposed successfully');
        } catch (error) {
            console.error('UniverseScene: Error during disposal:', error);
        }
    }
}

// Remove duplicate initialization - main.js handles this
