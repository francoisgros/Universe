export class StarHUD {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.currentStar = null;
        
        // Get HUD elements from DOM
        this.hudPreview = document.querySelector('.star-preview');
        this.labelElement = document.querySelector('.star-name');
        this.distanceElement = document.querySelector('.star-distance');
        
        // Setup ray helper for hover detection
        const ray = new BABYLON.Ray();
        this.rayHelper = new BABYLON.RayHelper(ray);
        this.rayHelper.attachToMesh(camera, 
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
            1000
        );
        
        // Handle picking
        scene.onPointerMove = (evt) => {
            const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
            if (pickInfo.hit && pickInfo.pickedMesh) {
                const star = pickInfo.pickedMesh;
                if (star.metadata && star.metadata.name) {
                    if (this.currentStar !== star) {
                        this.currentStar = star;
                        this.updateInfoPanel(star, pickInfo.distance);
                    }
                } else {
                    this.clearInfoPanel();
                }
            } else {
                this.clearInfoPanel();
            }
        };
    }

    updateInfoPanel(star, distance) {
        if (!star || !star.metadata) {
            this.clearInfoPanel();
            return;
        }

        // Update name and distance
        this.labelElement.textContent = `[ ${star.metadata.name} ]`;
        this.distanceElement.textContent = `${Math.round(distance * 10) / 10} AU`;
        this.labelElement.style.color = '#00fff7';
        this.distanceElement.style.color = '#00fff7';

        // Update preview (using the star's material)
        if (this.hudPreview) {
            const previewEngine = new BABYLON.Engine(this.hudPreview, true);
            const previewScene = new BABYLON.Scene(previewEngine);
            
            // Create preview sphere with star's material
            const sphere = BABYLON.MeshBuilder.CreateSphere("preview", {
                segments: 32,
                diameter: 1
            }, previewScene);
            
            // Clone the star's material for preview
            sphere.material = star.material.clone();
            
            // Preview camera and light
            const camera = new BABYLON.ArcRotateCamera("camera", 0, Math.PI / 3, 2,
                BABYLON.Vector3.Zero(), previewScene);
            const light = new BABYLON.HemisphericLight("light",
                new BABYLON.Vector3(0, 1, 0), previewScene);
            
            // Render preview
            previewEngine.runRenderLoop(() => {
                previewScene.render();
            });
        }
    }

    clearInfoPanel() {
        this.currentStar = null;
        this.labelElement.textContent = '[ NO TARGET ]';
        this.distanceElement.textContent = '---';
        this.labelElement.style.color = '#445566';
        this.distanceElement.style.color = '#445566';
        
        // Clear preview canvas
        if (this.hudPreview) {
            const ctx = this.hudPreview.getContext('2d');
            ctx.clearRect(0, 0, this.hudPreview.width, this.hudPreview.height);
        }
    }

    dispose() {
        if (this.rayHelper) {
            this.rayHelper.dispose();
        }
    }
}
