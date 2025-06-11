export class StarInteraction {
    constructor(scene, camera, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.options = {
            maxSpeed: options.maxSpeed || 25,
            acceleration: options.acceleration || 10,
            decelDistance: options.decelDistance || 20,
            minDistance: options.minDistance || 0.5
        };
        
        this.moving = false;
        this.targetPos = null;
        this.velocity = 0;
        this.direction = new BABYLON.Vector3();
        this.lastTime = null;
        
        // Setup click handling
        this.scene.onPointerDown = (evt) => {
            if (evt.button !== 0) return; // Left click only
            
            const pickInfo = scene.pick(scene.pointerX, scene.pointerY);
            if (pickInfo.hit && pickInfo.pickedMesh) {
                const star = pickInfo.pickedMesh;
                if (star.metadata && star.metadata.name) {
                    this.moveToStar(star);
                }
            }
        };
        
        // Register before render loop
        scene.registerBeforeRender(() => this.update());
    }
    
    moveToStar(star) {
        // Get star position
        const starPos = star.position.clone();
        
        // Calculate radius from mesh bounding box
        const boundingBox = star.getBoundingInfo().boundingBox;
        const radius = (boundingBox.maximumWorld.subtract(boundingBox.minimumWorld)).length() * 0.5;
        
        // Calculate camera position and direction
        const camPos = this.camera.position.clone();
        this.direction = starPos.subtract(camPos);
        const dist = this.direction.length();
        this.direction.normalize();
        
        // Set target position at comfortable distance from star
        this.targetPos = starPos.subtract(this.direction.scale(Math.max(2.5 * radius, 2)));
        
        // Initialize movement
        this.moving = true;
        this.velocity = 0;
        this.lastTime = null;
        
        console.log(`Moving to star: ${star.metadata.name}, distance: ${dist}`);
    }
    
    update() {
        if (!this.moving || !this.targetPos) return;
        
        const camPos = this.camera.position;
        const toTarget = this.targetPos.subtract(camPos);
        const dist = toTarget.length();
        
        // Calculate time delta
        const currentTime = performance.now();
        let dt = 0.016;
        if (this.lastTime !== null) {
            dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
        }
        this.lastTime = currentTime;
        
        // Adjust velocity based on distance
        if (dist > this.options.decelDistance) {
            this.velocity = Math.min(
                this.options.maxSpeed,
                this.velocity + this.options.acceleration * dt
            );
        } else {
            this.velocity = Math.max(
                2,
                this.velocity - this.options.acceleration * dt * 1.5
            );
        }
        
        // Apply movement
        const moveDist = Math.min(dist, this.velocity * dt);
        if (moveDist < 0.01 || dist < this.options.minDistance) {
            this.moving = false;
            return;
        }
        
        const moveVec = toTarget.normalize().scale(moveDist);
        this.camera.position.addInPlace(moveVec);
    }
    
    dispose() {
        // Clean up any resources
        this.moving = false;
        this.targetPos = null;
    }
}
