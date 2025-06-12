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
