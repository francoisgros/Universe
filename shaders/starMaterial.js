// Embedded shader code as JavaScript strings
const STAR_VERTEX_SHADER = `
precision highp float;

// Attributes
attribute vec3 position;
attribute vec2 uv;

#ifdef INSTANCES
attribute mat4 world;
#else
uniform mat4 world;
#endif

// Uniforms
uniform mat4 viewProjection;

// Varying
varying vec2 vUv;
varying float vInstanceId;

void main() {
    mat4 finalWorld = world;
    
    vec4 worldPos = finalWorld * vec4(position, 1.0);
    gl_Position = viewProjection * worldPos;
    
    vUv = uv;
    
    // Simple instance ID based on world position
    vInstanceId = worldPos.x + worldPos.y * 100.0 + worldPos.z * 10000.0;
}
`;

const STAR_FRAGMENT_SHADER = `
precision highp float;

// Uniforms
uniform float time;

// Varying
varying vec2 vUv;
varying float vInstanceId;

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float radius = length(uv);
    
    // Ultra-simple bright colors
    float seed = vInstanceId * 0.001;
    float colorVariation = fract(sin(seed * 12.9898) * 43758.5453);
    
    // Bright, saturated colors
    vec3 baseColor;
    if (colorVariation < 0.33) {
        baseColor = vec3(1.0, 0.3, 0.1); // Bright orange
    } else if (colorVariation < 0.66) {
        baseColor = vec3(0.1, 0.3, 1.0); // Bright blue
    } else {
        baseColor = vec3(1.0, 1.0, 0.1); // Bright yellow
    }
    
    // Simple glow - very bright in center
    float glow = 1.0 - radius;
    glow = max(glow, 0.0);
    
    // Simple pulsing
    float pulse = 0.7 + 0.3 * sin(time * 3.0 + seed * 20.0);
    
    // Final color - very bright
    vec3 finalColor = baseColor * glow * pulse * 2.0;
    
    // Ensure high minimum brightness
    finalColor = max(finalColor, vec3(0.3));
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;

export class ShaderManager {
    constructor(scene) {
        this.scene = scene;
        this.materials = new Set();
        this.startTime = Date.now();
        
        this.scene.onBeforeRenderObservable.add(() => {
            const currentTime = (Date.now() - this.startTime) / 1000.0;
            this.updateMaterials(currentTime);
        });
    }
    
    registerMaterial(material) {
        this.materials.add(material);
    }
    
    unregisterMaterial(material) {
        this.materials.delete(material);
    }
    
    updateMaterials(currentTime) {
        this.materials.forEach(material => {
            if (material.getClassName() === "ShaderMaterial") {
                material.setFloat("time", currentTime);
            }
        });
    }
}

export class StarMaterial {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.options = options;

        if (!scene.starShaderManager) {
            scene.starShaderManager = new ShaderManager(scene);
        }

        this.colors = options.colors || ['#ff3300', '#ff9900', '#ffff00'];
        this.colorSpeed = options.colorSpeed || 0.5;
        this.name = options.name || "StarMaterial";
    }

    async initialize() {
        try {
            console.log('StarMaterial: Starting initialization with embedded shaders');
            
            // Register embedded shaders in BABYLON.Effect.ShadersStore
            if (!BABYLON.Effect.ShadersStore["StarMaterialVertexShader"]) {
                console.log('StarMaterial: Registering embedded vertex shader');
                BABYLON.Effect.ShadersStore["StarMaterialVertexShader"] = STAR_VERTEX_SHADER;
            }

            if (!BABYLON.Effect.ShadersStore["StarMaterialFragmentShader"]) {
                console.log('StarMaterial: Registering embedded fragment shader');
                BABYLON.Effect.ShadersStore["StarMaterialFragmentShader"] = STAR_FRAGMENT_SHADER;
            }

            console.log('StarMaterial: Creating shader material');
            // Validate BABYLON availability
            if (!BABYLON || !BABYLON.ShaderMaterial) {
                throw new Error('BABYLON or ShaderMaterial not available');
            }
            
            console.log('StarMaterial: Creating material with params:', {
                name: this.name,
                scene: this.scene ? 'scene available' : 'scene missing',
            });
            
            this.material = new BABYLON.ShaderMaterial(this.name, this.scene, {
                vertex: "StarMaterial",
                fragment: "StarMaterial",
            }, {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "viewProjection", "view", "projection", "time"],
                needAlphaBlending: false,  // FIXED: Disable alpha blending that might cause invisibility
                needAlphaTesting: false,
            });
            
            // FIXED: Ensure proper material settings for visibility
            this.material.backFaceCulling = false;  // Render both sides
            this.material.depthWrite = true;        // Write to depth buffer

            // Wait for initial compilation using polling approach
            await new Promise((resolve, reject) => {
                if (this.material.isReady()) {
                    console.log('StarMaterial: Material ready immediately');
                    resolve();
                } else {
                    console.log('StarMaterial: Waiting for material to be ready');
                    
                    let attempts = 0;
                    const maxAttempts = 100; // Maximum 10 seconds at 100ms intervals
                    
                    const checkReady = () => {
                        attempts++;
                        
                        if (this.material.isReady()) {
                            console.log(`StarMaterial: Material ready after ${attempts} attempts`);
                            resolve();
                        } else if (attempts >= maxAttempts) {
                            console.error('StarMaterial: Timeout waiting for material to be ready');
                            reject(new Error('Material compilation timeout'));
                        } else {
                            // Poll every 100ms
                            setTimeout(checkReady, 100);
                        }
                    };
                    
                    // Start polling
                    setTimeout(checkReady, 100);
                }
            });

            // FIXED: Don't set color uniforms - colors come from per-instance attributes
            console.log('StarMaterial: Configuring material - colors handled by per-instance attributes');
            
            // Only set non-color uniforms
            this.material.setFloat("time", 0);
            
            console.log('StarMaterial: Material configured correctly for per-instance rendering');

            // Register with shader manager
            this.scene.starShaderManager.registerMaterial(this.material);

            console.log('StarMaterial: Initialization complete with embedded shaders');
            return this.material;
        } catch (error) {
            console.error("Failed to initialize star material:", error);
            throw error;
        }
    }

    dispose() {
        if (this.material) {
            this.scene.starShaderManager.unregisterMaterial(this.material);
            this.material.dispose();
        }
    }

    getMaterial() {
        return this.material;
    }
}
