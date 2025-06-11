// star-hover.js
// Displays the name of the star being hovered by the user

AFRAME.registerComponent('star-hover', {
  schema: {
    labelOffset: { type: 'vec3', default: {x: 0, y: 1.5, z: 0} },
    distanceOffset: { type: 'vec3', default: {x: 0, y: -0.5, z: 0} },
    textDistance: { type: 'number', default: 2.0 }  // Distance minimale du texte par rapport à l'étoile
  },

  init: function() {
    // Création du conteneur principal du HUD
    this.hudContainer = document.createElement('a-entity');
    this.hudContainer.setAttribute('position', '0.75 -0.4 -1');
    
    // Create info panel (background)
    this.infoPanel = document.createElement('a-entity');
    this.infoPanel.setAttribute('geometry', {
      primitive: 'plane',
      width: 1.0,
      height: 0.6
    });
    this.infoPanel.setAttribute('material', {
      color: '#000033',
      opacity: 0.85,
      transparent: true,
      side: 'front',
      shader: 'flat',
      depthTest: false,
      depthWrite: false
    });
    this.infoPanel.setAttribute('position', '0 0 0');
    
    // Create star preview (as a sphere with the star shader)
    this.imagePanel = document.createElement('a-sphere');
    this.imagePanel.setAttribute('radius', '0.15');
    this.imagePanel.setAttribute('segments-width', '32');
    this.imagePanel.setAttribute('segments-height', '32');
    this.imagePanel.setAttribute('position', '-0.32 0 0.001');
    this.imagePanel.setAttribute('star-shader', {
      colors: '#445566,#445566,#445566',
      colorSpeed: 0.3
    });
    
    // Star name text configuration
    this.labelEntity = document.createElement('a-entity');
    this.labelEntity.setAttribute('text', {
      value: '[ NO TARGET ]',
      align: 'center',
      width: 0.6,
      color: '#445566',
      opacity: 1,
      font: 'exo2bold',
      wrapCount: 25,
      baseline: 'center',
      letterSpacing: 2
    });
    
    // Distance text configuration
    this.distanceEntity = document.createElement('a-entity');
    this.distanceEntity.setAttribute('text', {
      value: '---',
      align: 'center',
      width: 0.6,
      color: '#445566',
      opacity: 1,
      font: 'exo2bold',
      wrapCount: 25,
      baseline: 'center',
      letterSpacing: 2
    });
    
    // Création d'un conteneur pour le texte (devant le panneau)
    this.textContainer = document.createElement('a-entity');
    this.textContainer.setAttribute('position', '0 0 0.001');  // Légèrement devant le panneau
    
    // Position text elements in container
    this.labelEntity.setAttribute('position', '0.15 0.1 0');
    this.distanceEntity.setAttribute('position', '0.15 -0.05 0');
    
    // Build element hierarchy
    this.textContainer.appendChild(this.labelEntity);
    this.textContainer.appendChild(this.distanceEntity);
    this.hudContainer.appendChild(this.infoPanel);
    this.hudContainer.appendChild(this.imagePanel);
    this.hudContainer.appendChild(this.textContainer);
    
    // Initialisation de la référence à la caméra et attachement du HUD
    const scene = this.el.sceneEl;
    this.attachToCamera = () => {
      const cameraRig = document.querySelector('#cameraRig');
      if (cameraRig) {
        cameraRig.appendChild(this.hudContainer);        } else {
        // Si pas de cameraRig, on attache directement à la caméra
        const camera = document.querySelector('[camera]');
        if (camera) {
          camera.appendChild(this.hudContainer);
        }
      }
    };

    // Setup du HUD
    if (scene.hasLoaded) {
      this.attachToCamera();
    } else {
      scene.addEventListener('loaded', this.attachToCamera);
    }
    
    this.currentStar = null;
    
    // Bind de la méthode de tick
    this.tick = AFRAME.utils.throttle(this.tick, 100, this);
  },

  updateInfoPanel: function(star, intersection) {
    if (!star) {
      this.labelEntity.setAttribute('text', {
        value: '[ NO TARGET ]',
        color: '#445566'  // Bluish gray for inactive state
      });
      this.distanceEntity.setAttribute('text', {
        value: '---',
        color: '#445566'
      });
      this.imagePanel.setAttribute('star-shader', {
        colors: '#445566,#445566,#445566',
        colorSpeed: 0.3
      });
      return;
    }
    
    // Update panel texts
    const starName = star.getAttribute('data-star-name');
    const distance = Math.round(intersection.distance * 10) / 10;
    
    // Clone the star configuration
    const starShaderData = star.getAttribute('star-shader');
    if (starShaderData) {
      // On force la mise à jour en supprimant d'abord le composant
      this.imagePanel.removeAttribute('star-shader');
      this.imagePanel.setAttribute('star-shader', starShaderData);
    }
    
    // Update formatted texts
    this.labelEntity.setAttribute('text', {
      value: `[ ${starName || 'UNKNOWN STAR'} ]`,
      color: '#00fff7'  // Bright cyan for active state
    });
    this.distanceEntity.setAttribute('text', {
      value: `${distance} AU`,
      color: '#00fff7'
    });
  },

  tick: function() {
    if (!this.el) return;

    // Get the raycaster component directly from the star-raycaster entity
    const raycasterEl = document.querySelector('#star-raycaster');
    if (!raycasterEl || !raycasterEl.components.raycaster) return;

    const raycaster = raycasterEl.components.raycaster;
    const intersections = raycaster.intersections;
    const intersection = intersections && intersections[0];

    if (intersection && intersection.object.el && 
        intersection.object.el.classList.contains('star-interactive')) {
      const star = intersection.object.el;
      
      // Mise à jour uniquement si on survole une nouvelle étoile
      if (this.currentStar !== star) {
        this.currentStar = star;
        this.updateInfoPanel(star, intersection);
      }
    } else {
      // Réinitialise l'affichage si aucune étoile n'est survolée
      this.currentStar = null;
      this.updateInfoPanel(null);
    }
  },

  remove: function() {
    // Nettoyage des entités lors de la suppression du composant
    if (this.hudContainer && this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
  }
});

// Composant billboard amélioré pour une meilleure orientation vers la caméra
AFRAME.registerComponent('billboard', {
  init: function() {
    this.updateRotation = this.updateRotation.bind(this);
    this.el.sceneEl.addEventListener('loaded', () => {
      this.camera = document.querySelector('[camera]');
    }, { once: true });
    this.el.sceneEl.addEventListener('renderstart', this.updateRotation);
  },

  updateRotation: function() {
    if (!this.camera) return;
    
    const pos = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    
    this.el.object3D.getWorldPosition(pos);
    this.camera.object3D.getWorldPosition(camPos);
    
    // Calcul de la direction caméra-texte
    const dir = new THREE.Vector3().subVectors(camPos, pos);
    
    // Création d'une matrice de rotation pour aligner le texte
    const rotationMatrix = new THREE.Matrix4();
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(dir, up).normalize();
    const perpUp = new THREE.Vector3().crossVectors(right, dir).normalize();
    
    rotationMatrix.makeBasis(right, perpUp, dir.normalize());
    this.el.object3D.setRotationFromMatrix(rotationMatrix);
    
    // Correction de la rotation si nécessaire
    if (this.el.object3D.parent) {
      const parentQuaternion = new THREE.Quaternion();
      this.el.object3D.parent.getWorldQuaternion(parentQuaternion);
      this.el.object3D.quaternion.multiply(parentQuaternion.invert());
    }
  },

  remove: function() {
    this.el.sceneEl.removeEventListener('renderstart', this.updateRotation);
  }
});

// Ajoute le composant à la scène au chargement
document.addEventListener('DOMContentLoaded', () => {
  const scene = document.querySelector('a-scene');
  if (scene) {
    scene.setAttribute('star-hover', '');
  }
});
