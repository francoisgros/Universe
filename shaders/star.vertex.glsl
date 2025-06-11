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

void main() {
    vUv = uv;
    vNormal = (world * vec4(normal, 0.0)).xyz;
    gl_Position = worldViewProjection * vec4(position, 1.0);
}
