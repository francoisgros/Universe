// star-interaction.js
AFRAME.registerComponent('star-interaction', {
  schema: {
    maxSpeed: { type: 'number', default: 25 },
    acceleration: { type: 'number', default: 10 },
    decelDistance: { type: 'number', default: 20 },
    minDistance: { type: 'number', default: 0.5 }
  },

  init: function() {
    this.moving = false;
    this.targetPos = null;
    this.velocity = 0;
    this.direction = new THREE.Vector3();
    this.lastTime = null;
    
    // Bind des méthodes
    this.onStarClick = this.onStarClick.bind(this);
    
    // Écoute les clics sur la scène
    this.el.sceneEl.addEventListener('click', this.onStarClick);
  },

  onStarClick: function(event) {
    // Trouve le raycaster
    const raycaster = document.querySelector('#star-raycaster');
    if (!raycaster || !raycaster.components.raycaster) {
      console.warn('Raycaster non trouvé');
      return;
    }

    // Vérifie les intersections
    const intersections = raycaster.components.raycaster.intersections;
    if (!intersections || intersections.length === 0) {
      console.log('Pas d\'intersection trouvée');
      return;
    }

    // Trouve la première étoile intersectée
    const starEl = intersections[0].object.el;
    if (!starEl || !starEl.classList.contains('star-interactive')) {
      console.log('Pas d\'étoile trouvée');
      return;
    }

    console.log('Déplacement vers l\'étoile:', starEl.getAttribute('data-star-name'));
    this.moveToStar(starEl);
  },

  moveToStar: function(star) {
    if (!star || !star.object3D) return;

    // Position cible : centre de l'étoile
    const starPos = new THREE.Vector3();
    star.object3D.getWorldPosition(starPos);
    
    // Récupère le rayon de l'étoile (avec une valeur par défaut plus grande)
    const radius = parseFloat(star.getAttribute('radius') || 0.5);
    
    // Calcule la position de la caméra
    const camera = this.el.object3D;
    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);
    
    // Direction et distance
    this.direction.copy(starPos).sub(camPos);
    const dist = this.direction.length();
    this.direction.normalize();
    
    // Position cible à une distance confortable de l'étoile
    this.targetPos = starPos.clone().addScaledVector(this.direction, -Math.max(2.5 * radius, 2));
    
    this.moving = true;
    this.velocity = 0;
    this.lastTime = null;
    
    console.log('Démarrage du mouvement, distance:', dist);
  },

  tick: function(time) {
    if (!this.moving || !this.targetPos) return;

    const camera = this.el.object3D;
    const camPos = new THREE.Vector3();
    camera.getWorldPosition(camPos);

    // Calcul du vecteur vers la cible
    const toTarget = this.targetPos.clone().sub(camPos);
    const dist = toTarget.length();

    // Calcul du delta temps
    let dt = 0.016;
    if (this.lastTime !== null) {
      dt = Math.min((time - this.lastTime) / 1000, 0.05);
    }
    this.lastTime = time;

    // Ajustement de la vitesse
    if (dist > this.data.decelDistance) {
      this.velocity = Math.min(this.data.maxSpeed, this.velocity + this.data.acceleration * dt);
    } else {
      this.velocity = Math.max(2, this.velocity - this.data.acceleration * dt * 1.5);
    }

    // Application du mouvement
    const moveDist = Math.min(dist, this.velocity * dt);
    if ((moveDist < 0.01) || (dist < this.data.minDistance)) {
      this.moving = false;
      return;
    }

    const moveVec = toTarget.normalize().multiplyScalar(moveDist);
    camera.position.add(moveVec);
  },

  remove: function() {
    this.el.removeEventListener('click', this.onStarClick);
  }
});

// Ajoute le composant à la caméra au chargement
document.addEventListener('DOMContentLoaded', () => {
  const camera = document.querySelector('a-camera');
  if (camera) {
    camera.setAttribute('star-interaction', '');
  }
});
