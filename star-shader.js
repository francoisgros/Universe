// GLSL Functions
const NOISE_GLSL = `
float random(vec2 p) { return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(mix(random(i), random(i + vec2(1,0)), f.x),
               mix(random(i + vec2(0,1)), random(i + vec2(1,1)), f.x), f.y);
}`;

const PLASMA_GLSL = `
float plasma(vec2 uv, float t) {
    float p = 0.5 + 0.5 * sin(10.0 * uv.x + t) * cos(10.0 * uv.y - t);
    p += 0.25 * sin(15.0 * uv.x * uv.y + t * 1.3);
    p += 0.15 * cos(20.0 * (uv.x + uv.y) - t * 0.7);
    p += 0.2 * noise(uv * 8.0 + t * 0.5);
    return clamp(p, 0.0, 1.0);
}`;

export class StarShader {
    constructor(scene) {
        this.scene = scene;
        
        // Register shaders
        BABYLON.Effect.ShadersStore["starVertexShader"] = this.getVertexShader();
        BABYLON.Effect.ShadersStore["starFragmentShader"] = this.getFragmentShader();
    }
    
    createMaterial(options = {}) {
        const material = new BABYLON.ShaderMaterial(
            "starMaterial",
            this.scene,
            {
                vertex: "star",
                fragment: "star",
            },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "time", "color1", "color2", "color3", "colorSpeed"],
                defines: []
            }
        );

        // Convert hex colors to RGB
        const colors = (options.colors || '#ff3300,#ff9900,#ffff00').split(',').map(hex => {
            return BABYLON.Color3.FromHexString(hex.trim());
        });

        material.setVector3("color1", colors[0]);
        material.setVector3("color2", colors[1] || colors[0]);
        material.setVector3("color3", colors[2] || colors[1] || colors[0]);
        material.setFloat("colorSpeed", options.colorSpeed || 0.5);
        material.setFloat("time", 0);

        // Update time uniform
        let startTime = Date.now();
        this.scene.registerBeforeRender(() => {
            material.setFloat("time", (Date.now() - startTime) / 1000.0);
        });

        return material;
    }
    
    getVertexShader() {
        return `
            precision highp float;
            
            // Attributes
            attribute vec3 position;
            attribute vec2 uv;
            attribute vec3 normal;
            
            // Uniforms
            uniform mat4 world;
            uniform mat4 worldViewProjection;
            
            // Varying
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main(void) {
                vUv = uv;
                vNormal = (world * vec4(normal, 0.0)).xyz;
                gl_Position = worldViewProjection * vec4(position, 1.0);
            }
        `;
    }
    
    getFragmentShader() {
        return `
            precision highp float;
            
            // Functions
            ${NOISE_GLSL}
            ${PLASMA_GLSL}
            
            // Uniforms
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform vec3 color3;
            uniform float colorSpeed;
            
            // Varying
            varying vec2 vUv;
            varying vec3 vNormal;
            
            void main(void) {
                vec2 uv = vUv * 2.0 - 1.0;
                float radius = length(uv);
                
                // Color animation
                float t = time * colorSpeed;
                vec3 baseColor = mix(
                    mix(color1, color2, 0.5 + 0.5*sin(t)),
                    color3,
                    0.5 + 0.5*cos(t)
                );
                
                // Plasma pattern
                float p = plasma(uv, t);
                baseColor = mix(baseColor, vec3(1.0), p * 0.35);
                
                // Corona effect
                float edge = pow(1.0 - radius, 4.0);
                baseColor += edge * mix(color2, color3, 0.5);
                
                // Fresnel-like rim effect
                float rim = pow(1.0 - abs(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0);
                baseColor += rim * 0.5;
                
                gl_FragColor = vec4(baseColor * (1.0 + edge * 2.0), 1.0);
            }
        `;
    }
}
