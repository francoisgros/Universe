// Fonctions GLSL à injecter dans le shader
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

function injectShaderCode(shader, ...glslBlocks) {
  // Ajoute les blocs GLSL au début du shader
  return glslBlocks.join('\n') + '\n' + shader;
}

AFRAME.registerComponent('star-shader', {
  schema: {
    colors: { type: 'string', default: '#ff3300,#ff9900,#ffff00' },
    colorSpeed: { type: 'number', default: 0.5 },
    pattern: { type: 'string', default: '' } // Ajout pour éviter le warning
  },

  init: function() {
    const colors = this.data.colors.split(',').map(hex => {
      const c = new THREE.Color(hex.trim());
      return new THREE.Vector3(c.r, c.g, c.b);
    });

    // Ajoute une fréquence de scintillement unique à chaque étoile
    this.glowFreq = 0.2 + Math.random() * 0.25; // Lent, entre 0.2 et 0.45 Hz
    this.glowPhase = Math.random() * Math.PI * 2;

    // Injection des fonctions GLSL dans le fragmentShader
    let fragmentShader = document.querySelector('#fragmentShader').textContent;
    fragmentShader = injectShaderCode(fragmentShader, NOISE_GLSL, PLASMA_GLSL);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: colors[0] },
        color2: { value: colors[1] || colors[0] },
        color3: { value: colors[2] || colors[1] || colors[0] },
        colorSpeed: { value: this.data.colorSpeed }
      },
      vertexShader: document.querySelector('#vertexShader').textContent,
      fragmentShader: fragmentShader
    });

    this.el.object3D.children[0].material = this.material;
  },

  tick: function(time) {
    this.material.uniforms.time.value = time / 1000;
    // L'effet de glow est déjà géré par le shader lui-même via plasma et edge
  },

  remove: function() {
    // Libère le material custom pour éviter les fuites mémoire GPU
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }
});
