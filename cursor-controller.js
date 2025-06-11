export class CursorController {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.cursorMesh = this.createCursor();
        this.rayHelper = this.createRayHelper();
        this.currentStar = null;
        
        // Update cursor position on pointer move
        scene.onPreRender = () => this.updateCursorPosition();
    }
    
    createCursor() {
        const cursorParent = new BABYLON.TransformNode("cursorParent", this.scene);
        
        // Outer ring
        const outerRing = BABYLON.MeshBuilder.CreateTorus("outerRing", {
            diameter: 0.13,
            thickness: 0.005,
            tessellation: 32
        }, this.scene);
        outerRing.parent = cursorParent;
        outerRing.material = this.createCursorMaterial();
        
        // Inner ring
        const innerRing = BABYLON.MeshBuilder.CreateTorus("innerRing", {
            diameter: 0.08,
            thickness: 0.002,
            tessellation: 32
        }, this.scene);
        innerRing.parent = cursorParent;
        innerRing.material = this.createCursorMaterial();
        
        // Cardinal points
        for (let i = 0; i < 4; i++) {
            const point = BABYLON.MeshBuilder.CreateBox("cardinalPoint" + i, {
                height: 0.004,
                width: 0.02,
                depth: 0.001
            }, this.scene);
            point.parent = cursorParent;
            point.material = this.createCursorMaterial();
            point.rotation.z = (Math.PI / 2) * i;
            point.position.x = Math.cos((Math.PI / 2) * i) * 0.05;
            point.position.y = Math.sin((Math.PI / 2) * i) * 0.05;
        }
        
        // Center point
        const centerPoint = BABYLON.MeshBuilder.CreateDisc("centerPoint", {
            radius: 0.003
        }, this.scene);
        centerPoint.parent = cursorParent;
        centerPoint.material = this.createCursorMaterial();
        
        // Animations
        this.createCursorAnimations(outerRing, innerRing, centerPoint);
        
        return cursorParent;
    }
    
    createCursorMaterial() {
        const material = new BABYLON.StandardMaterial("cursorMaterial", this.scene);
        material.emissiveColor = BABYLON.Color3.FromHexString("#00fff7");
        material.alpha = 0.9;
        return material;
    }
    
    createCursorAnimations(outerRing, innerRing, centerPoint) {
        // Rotation animations
        const rotationAnimation1 = new BABYLON.Animation(
            "rotationAnimation",
            "rotation.z",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const rotationAnimation2 = new BABYLON.Animation(
            "rotationAnimation",
            "rotation.z",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const rotationKeys1 = [];
        rotationKeys1.push({ frame: 0, value: 0 });
        rotationKeys1.push({ frame: 480, value: 2 * Math.PI });
        
        const rotationKeys2 = [];
        rotationKeys2.push({ frame: 0, value: 0 });
        rotationKeys2.push({ frame: 720, value: -2 * Math.PI });
        
        rotationAnimation1.setKeys(rotationKeys1);
        rotationAnimation2.setKeys(rotationKeys2);
        
        outerRing.animations.push(rotationAnimation1);
        innerRing.animations.push(rotationAnimation2);
        
        // Pulse animation for center point
        const pulseAnimation = new BABYLON.Animation(
            "pulseAnimation",
            "scaling",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const pulseKeys = [];
        pulseKeys.push({ frame: 0, value: new BABYLON.Vector3(0.8, 0.8, 0.8) });
        pulseKeys.push({ frame: 30, value: new BABYLON.Vector3(1.2, 1.2, 1.2) });
        pulseKeys.push({ frame: 60, value: new BABYLON.Vector3(0.8, 0.8, 0.8) });
        
        pulseAnimation.setKeys(pulseKeys);
        centerPoint.animations.push(pulseAnimation);
        
        // Start animations
        this.scene.beginAnimation(outerRing, 0, 480, true);
        this.scene.beginAnimation(innerRing, 0, 720, true);
        this.scene.beginAnimation(centerPoint, 0, 60, true);
    }
    
    createRayHelper() {
        const rayHelper = new BABYLON.RayHelper(new BABYLON.Ray());
        rayHelper.show(this.scene, new BABYLON.Color3.FromHexString("#00fff7"));
        return rayHelper;
    }
    
    updateCursorPosition() {
        const ray = this.scene.createPickingRay(
            this.scene.pointerX,
            this.scene.pointerY,
            BABYLON.Matrix.Identity(),
            this.camera
        );
        
        const hit = this.scene.pickWithRay(ray);
        const distance = 2;
        
        // Position the cursor
        const cursorPosition = ray.direction.scale(distance).add(ray.origin);
        this.cursorMesh.position = cursorPosition;
        
        // Update ray visualization
        this.rayHelper.attachToMesh(
            this.camera,
            ray.direction,
            ray.origin,
            ray.length
        );
        
        return hit;
    }
    
    dispose() {
        this.cursorMesh.dispose();
        this.rayHelper.dispose();
    }
}