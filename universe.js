import { StarMaterial } from './shaders/starMaterial.js';

class UniverseScene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = this.createScene();
        
        // HUD elements
        this.hudPreview = document.querySelector('.star-preview');
        this.starName = document.querySelector('.star-name');
        this.starDistance = document.querySelector('.star-distance');
        
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
        
        // Create cursor controller
        this.cursor = new CursorController(scene, this.camera);
        
        // Setup star interaction
        this.setupStarInteraction(scene);
        
        // Generate stars
        this.generateStars(scene);
        
        return scene;
    }
    
    generateStars(scene) {
        const starCount = 10000;
        for (let i = 0; i < starCount; i++) {
            const star = this.createStar(scene);
            const pos = this.randomGalacticPosition();
            star.position = pos;
            star.scaling = new BABYLON.Vector3(
                0.05 + Math.random() * 0.12,
                0.05 + Math.random() * 0.12,
                0.05 + Math.random() * 0.12
            );
        }
    }
    
    createStar(scene) {
        const sphere = BABYLON.MeshBuilder.CreateSphere(
            "star",
            { segments: 32, diameter: 1 },
            scene
        );
        
        const material = new StarMaterial(scene, {
            colors: [
                this.randomStarColor(),
                this.randomStarColor(),
                this.randomStarColor()
            ],
            colorSpeed: 0.2 + Math.random() * 1.2,
            pattern: 8 + Math.random() * 12
        }).getMaterial();
        
        sphere.material = material;
        sphere.metadata = {
            name: this.generateStarName()
        };
        
        return sphere;
    }
    
    setupStarInteraction(scene) {
        let selectedMesh = null;
        let hoveredMesh = null;
        
        scene.onPointerMove = (evt, pickResult) => {
            if (pickResult.hit) {
                const mesh = pickResult.pickedMesh;
                if (mesh && mesh.metadata) {
                    if (hoveredMesh !== mesh) {
                        hoveredMesh = mesh;
                        this.updateHUD(mesh, pickResult.distance);
                    }
                }
            } else {
                hoveredMesh = null;
                this.clearHUD();
            }
        };
        
        scene.onPointerDown = (evt, pickResult) => {
            if (pickResult.hit) {
                const mesh = pickResult.pickedMesh;
                if (mesh && mesh.metadata) {
                    selectedMesh = mesh;
                    this.moveToStar(mesh);
                }
            }
        };
    }
    
    moveToStar(star) {
        const targetPosition = star.position.clone();
        const radius = star.scaling.x;
        const distance = 2.5 * radius;
        
        // Animation to move and rotate camera
        const Alpha = this.camera.alpha;
        const Beta = this.camera.beta;
        const Radius = this.camera.radius;
        
        BABYLON.Animation.CreateAndStartAnimation(
            "cameraMove",
            this.camera,
            "position",
            60,
            120,
            this.camera.position,
            targetPosition,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    }
    
    updateHUD(star, distance) {
        this.starName.textContent = `[ ${star.metadata.name} ]`;
        this.starDistance.textContent = `${Math.round(distance * 10) / 10} AU`;
        this.starName.style.color = '#00fff7';
        this.starDistance.style.color = '#00fff7';
        
        // Update preview canvas
        // TODO: Add star preview rendering
    }
    
    clearHUD() {
        this.starName.textContent = '[ NO TARGET ]';
        this.starDistance.textContent = '---';
        this.starName.style.color = '#445566';
        this.starDistance.style.color = '#445566';
        
        // Clear preview canvas
        const ctx = this.hudPreview.getContext('2d');
        ctx.clearRect(0, 0, this.hudPreview.width, this.hudPreview.height);
    }
    
    randomGalacticPosition() {
        const galaxyRadius = 220;
        const ySpread = 80;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = galaxyRadius * Math.pow(Math.random(), 0.5);
        return new BABYLON.Vector3(
            r * Math.sin(phi) * Math.cos(theta),
            (Math.random() - 0.5) * ySpread,
            r * Math.sin(phi) * Math.sin(theta)
        );
    }
    
    randomStarColor() {
        const h = Math.random();
        const s = 0.7 + 0.3 * Math.random();
        const l = 0.5 + 0.2 * (Math.random() - 0.5);
        return BABYLON.Color3.FromHSL(h, s, l).toHexString();
    }
    
    generateStarName() {
        const syllables = [
            'Al', 'Be', 'Ce', 'De', 'El', 'Fi', 'Ga', 'Ha', 'Io', 'Ju',
            'Ka', 'Lu', 'Me', 'No', 'Or', 'Pa', 'Qu', 'Ra', 'Si', 'Tu',
            'Ur', 'Ve', 'Wi', 'Xa', 'Yo', 'Za'
        ];
        const len = 2 + Math.floor(Math.random() * 2);
        let name = '';
        for (let i = 0; i < len; i++) {
            name += syllables[Math.floor(Math.random() * syllables.length)];
        }
        name += '-' + Math.floor(Math.random() * 10000);
        return name;
    }
}

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    const universe = new UniverseScene('renderCanvas');
});
