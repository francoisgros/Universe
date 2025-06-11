import { StarMaterial } from './shaders/starMaterial.js';
import { StarHUD } from './StarHUD.js';
import { StarInteraction } from './StarInteraction.js';
import { StarFactory } from './star-factory.js';

class UniverseScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = this.createScene();
        
        // Start rendering loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
    }
    
    createScene() {
        const scene = new BABYLON.Scene(this.engine);
        scene.clearColor = BABYLON.Color3.FromHexString("#000000");
        
        // Camera setup
        this.camera = new BABYLON.ArcRotateCamera(
            "camera",
            0, Math.PI / 3,
            100,
            BABYLON.Vector3.Zero(),
            scene
        );
        this.camera.attachControl(this.canvas, true);
        this.camera.inputs.attached.mousewheel.detachControl();
        
        // Lighting
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            scene
        );
        light.intensity = 0.7;
        
        // Post-processing
        const pipeline = new BABYLON.DefaultRenderingPipeline(
            "defaultPipeline",
            true,
            scene,
            [this.camera]
        );
        pipeline.bloomEnabled = true;
        pipeline.bloomThreshold = 0.5;
        pipeline.bloomWeight = 2.0;
        pipeline.bloomKernel = 64;
        
        // Initialize star systems
        this.starHUD = new StarHUD(scene, this.camera);
        this.starInteraction = new StarInteraction(scene, this.camera);
        
        // Generate stars
        this.generateStars(scene);
        
        return scene;
    }
    
    generateStars(scene) {
        const starFactory = new StarFactory(scene);
        const stars = starFactory.generateGalaxy(10000);
        starFactory.adjustPositionsByGravity(stars);
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const universe = new UniverseScene('renderCanvas');
});
