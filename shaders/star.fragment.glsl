precision highp float;

// Uniforms
uniform float time;

// Varying
varying vec2 vUv;
varying float vInstanceId;

// Simple HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// Simple random function
float random(float seed) {
    return fract(sin(seed * 12.9898) * 43758.5453);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float radius = length(uv);
    
    // Simple star color based on instance ID
    float seed = vInstanceId * 0.001;
    float hue = random(seed);
    float saturation = 0.6 + 0.4 * random(seed + 1.0);
    
    // Base color - simple HSV
    vec3 baseColor = hsv2rgb(vec3(hue, saturation, 1.0));
    
    // Simple glow effect - brighter in center, fades to edge
    float glow = 1.0 - smoothstep(0.0, 1.0, radius);
    
    // Simple pulsing animation
    float pulse = 0.8 + 0.2 * sin(time * 2.0 + seed * 10.0);
    
    // Final color: base color * glow * pulse
    vec3 finalColor = baseColor * glow * pulse;
    
    // Ensure minimum visibility
    finalColor = max(finalColor, vec3(0.05));
    
    gl_FragColor = vec4(finalColor, 1.0);
}
