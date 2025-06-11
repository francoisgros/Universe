precision highp float;

// Uniforms
uniform float time;
uniform vec3 color1;
uniform vec3 color2;
uniform vec3 color3;
uniform float colorSpeed;

// Varying
varying vec2 vUv;
varying vec3 vNormal;

// Noise function
float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(random(i), random(i + vec2(1,0)), f.x),
               mix(random(i + vec2(0,1)), random(i + vec2(1,1)), f.x), f.y);
}

float plasma(vec2 uv, float t) {
    float p = 0.5 + 0.5 * sin(10.0 * uv.x + t) * cos(10.0 * uv.y - t);
    p += 0.25 * sin(15.0 * uv.x * uv.y + t * 1.3);
    p += 0.15 * cos(20.0 * (uv.x + uv.y) - t * 0.7);
    p += 0.2 * noise(uv * 8.0 + t * 0.5);
    return clamp(p, 0.0, 1.0);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float radius = length(uv);
    
    // Color animation
    float t = time * colorSpeed;
    vec3 baseColor = mix(mix(color1, color2, 0.5 + 0.5*sin(t)), color3, 0.5 + 0.5*cos(t));
    
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
