export class StarMaterial {
    constructor(scene, options = {}) {
        this.scene = scene;
        
        // Shader parameters
        this.colors = options.colors || ['#ff3300', '#ff9900', '#ffff00'];
        this.colorSpeed = options.colorSpeed || 0.5;
        this.patternScale = options.pattern || 10.0;
        
        // Create custom shader material
        this.material = new BABYLON.ShaderMaterial(
            "starMaterial",
            scene,
            {
                vertex: "star",
                fragment: "star",
            },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldView", "worldViewProjection", "view", "projection",
                    "time", "color1", "color2", "color3", "colorSpeed"
                ],
                defines: [],
                needAlphaBlending: true,
                needAlphaTesting: false,
            }
        );

        // Convert hex colors to RGB vectors
        const toRGB = (hex) => {
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;
            return new BABYLON.Vector3(r, g, b);
        };

        // Set initial uniforms
        this.material.setVector3("color1", toRGB(this.colors[0]));
        this.material.setVector3("color2", toRGB(this.colors[1]));
        this.material.setVector3("color3", toRGB(this.colors[2]));
        this.material.setFloat("colorSpeed", this.colorSpeed);
        this.material.setFloat("time", 0);

        // Register before render to update time uniform
        let startTime = Date.now();
        scene.registerBeforeRender(() => {
            this.material.setFloat("time", (Date.now() - startTime) / 1000.0);
        });
    }

    getMaterial() {
        return this.material;
    }
}
