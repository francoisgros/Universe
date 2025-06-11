function randomColor() {
  // Génère une couleur vive aléatoire
  const h = Math.random();
  const s = 0.7 + 0.3 * Math.random();
  const l = 0.5 + 0.2 * (Math.random() - 0.5);
  const color = new THREE.Color();
  color.setHSL(h, s, l);
  return `#${color.getHexString()}`;
}

function randomPosition(radius = 80, ySpread = 30, minDist = 4) {
  // Génère une position sphérique aléatoire, en évitant les collisions
  let tries = 0;
  let pos;
  if (!window._starPositions) window._starPositions = [];
  do {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.7 + 0.3 * Math.random());
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = (Math.random() - 0.5) * ySpread;
    const z = r * Math.sin(phi) * Math.sin(theta);
    pos = [x, y, z];
    tries++;
    // Vérifie la distance minimale avec les autres étoiles
  } while (
    window._starPositions.some(([x2, y2, z2]) => {
      const dx = pos[0] - x2;
      const dy = pos[1] - y2;
      const dz = pos[2] - z2;
      return Math.sqrt(dx*dx + dy*dy + dz*dz) < minDist;
    }) && tries < 30
  );
  window._starPositions.push(pos);
  return `${pos[0].toFixed(2)} ${pos[1].toFixed(2)} ${pos[2].toFixed(2)}`;
}

function random3DPosition({
  galaxyRadius = 220,
  ySpread = 80,
  minDist = 10
} = {}) {
  // Distribution uniforme dans une sphère
  let tries = 0;
  let pos;
  if (!window._starPositions) window._starPositions = [];
  do {
    // Méthode de Marsaglia pour une sphère uniforme
    let x, y, z, s;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      s = x*x + y*y + z*z;
    } while (s > 1 || s === 0);
    const r = galaxyRadius * Math.cbrt(Math.random());
    x *= r;
    y *= (ySpread / galaxyRadius) * r; // aplatissement galactique
    z *= r;
    pos = [x, y, z];
    tries++;
  } while (
    window._starPositions.some(([x2, y2, z2]) => {
      const dx = pos[0] - x2;
      const dy = pos[1] - y2;
      const dz = pos[2] - z2;
      return Math.sqrt(dx*dx + dy*dy + dz*dz) < minDist;
    }) && tries < 30
  );
  window._starPositions.push(pos);
  return `${pos[0].toFixed(2)} ${pos[1].toFixed(2)} ${pos[2].toFixed(2)}`;
}

function randomStarName() {
  // Génère un nom d'étoile pseudo-aléatoire
  const syllables = [
    'Al', 'Be', 'Ce', 'De', 'El', 'Fi', 'Ga', 'Ha', 'Io', 'Ju', 'Ka', 'Lu', 'Me', 'No', 'Or', 'Pa', 'Qu', 'Ra', 'Si', 'Tu', 'Ur', 'Ve', 'Wi', 'Xa', 'Yo', 'Za'
  ];
  let name = '';
  const len = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < len; i++) {
    name += syllables[Math.floor(Math.random() * syllables.length)];
  }
  // Ajoute un numéro pour l'unicité
  name += '-' + Math.floor(Math.random() * 10000);
  return name;
}

function createStarEntity({
  id,
  position = '0 1.5 -3',
  radius = '1.2',
  colors = '#ff3300,#ff9900,#ffff00',
  colorSpeed = 0.5,
  pattern = 10.0,
  name
} = {}) {
  const sphere = document.createElement('a-sphere');
  if (id) sphere.setAttribute('id', id);
  if (name) {
    sphere.setAttribute('data-star-name', name);
    sphere.classList.add('star-interactive');
  }
  sphere.setAttribute('star-shader', `colors: ${colors}; colorSpeed: ${colorSpeed}; pattern: ${pattern}`);
  sphere.setAttribute('position', position);
  sphere.setAttribute('radius', radius);
  return sphere;
}

function adjustPositionsByGravity(stars) {
  // Trie les étoiles par rayon décroissant
  stars.sort((a, b) => b.radius - a.radius);
  // Les plus grosses restent, les petites sont attirées
  for (let i = 1; i < stars.length; i++) {
    let closestBig = null;
    let minDist = Infinity;
    for (let j = 0; j < i; j++) {
      const dx = stars[i].pos[0] - stars[j].pos[0];
      const dy = stars[i].pos[1] - stars[j].pos[1];
      const dz = stars[i].pos[2] - stars[j].pos[2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < minDist) {
        minDist = dist;
        closestBig = stars[j];
      }
    }
    if (closestBig && minDist > 0) {
      // Accentue l'effet gravité : rapprochement beaucoup plus fort
      const factor = 0.35 + 0.55 * (1 - stars[i].radius / closestBig.radius);
      stars[i].pos[0] += (closestBig.pos[0] - stars[i].pos[0]) * factor;
      stars[i].pos[1] += (closestBig.pos[1] - stars[i].pos[1]) * factor;
      stars[i].pos[2] += (closestBig.pos[2] - stars[i].pos[2]) * factor;
    }
  }
}

// Utilisation automatique si dans le navigateur et a-scene présent
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const scene = document.querySelector('a-scene');
    if (scene) {
      const stars = [];
      for (let i = 0; i < 10000; i++) {
        const color1 = randomColor();
        const color2 = randomColor();
        const color3 = randomColor();
        const colors = `${color1},${color2},${color3}`;
        const posArr = random3DPosition({
          galaxyRadius: 220,
          ySpread: 80,
          minDist: 10
        }).split(' ').map(Number);
        const radius = +(0.05 + Math.random() * 0.12).toFixed(3);
        const colorSpeed = +(0.2 + Math.random() * 1.2).toFixed(2);
        const pattern = +(8 + Math.random() * 12).toFixed(2);
        const name = randomStarName();
        stars.push({
          pos: posArr,
          radius,
          colors,
          colorSpeed,
          pattern,
          name
        });
      }
      adjustPositionsByGravity(stars);
      for (const s of stars) {
        const star = createStarEntity({
          position: `${s.pos[0].toFixed(2)} ${s.pos[1].toFixed(2)} ${s.pos[2].toFixed(2)}`,
          radius: s.radius,
          colors: s.colors,
          colorSpeed: s.colorSpeed,
          pattern: s.pattern,
          name: s.name
        });
        scene.appendChild(star);
      }
    }
  });
}
