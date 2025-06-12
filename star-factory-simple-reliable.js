export class StarFactory {
    constructor(scene) {
        this.scene = scene;
        this.starPositions = [];
        this.ready = false;
        
        console.log('StarFactory: Creating star mesh with individual color support');
        this.starMesh = BABYLON.MeshBuilder.CreateSphere("starTemplate", {
            segments: 8, // Simple geometry
            diameter: 4.0 // Reduced size for realism (was 15.0)
        }, scene);
        
        this.starMesh.setEnabled(false);
        
        // Initialize with individual color support
        console.log('StarFactory: Initializing with individual color support');
        this.initializeWithColors();
    }

    initializeWithColors() {
        try {
            console.log('StarFactory: Creating StandardMaterial with vertex color support');
            
            // Use StandardMaterial with vertex colors enabled
            this.starMaterial = new BABYLON.StandardMaterial("StarMaterial", this.scene);
            
            // Enable vertex colors - this allows per-instance coloring
            this.starMaterial.useVertexColors = true;
            
            // Set neutral base colors so vertex colors take precedence
            this.starMaterial.emissiveColor = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.starMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            
            // Disable transparency to avoid rendering issues
            this.starMaterial.alpha = 1.0;
            
            // Disable backface culling for better visibility
            this.starMaterial.backFaceCulling = false;
            
            // Apply material
            this.starMesh.material = this.starMaterial;
            this.starMesh.setEnabled(true);
            this.ready = true;
            
            console.log('StarFactory: StandardMaterial with vertex colors initialized');
        } catch (error) {
            console.error('StarFactory color material initialization failed:', error);
            this.ready = false;
            throw error;
        }
    }

    setupSimpleAnimation() {
        // Animation completely removed for static realistic rendering
        // No oscillating effects - stars maintain constant realistic colors
    }

    getStarTypeAndColor(position, distanceFromCenter) {
        const coreDistance = 40;
        const diskRadius = 200;
        
        // Determine star type based on galactic position with realistic stellar types
        if (distanceFromCenter < coreDistance) {
            // Galactic core: old red/orange stars (ancient population)
            const types = [
                // Red giants (Type M) - large, red-orange
                { color: new BABYLON.Color3(1.0, 0.347, 0.0), scale: [0.6, 1.0], type: 'red_giant' }, // #FF4500
                { color: new BABYLON.Color3(1.0, 0.388, 0.278), scale: [0.6, 1.0], type: 'red_giant' }, // #FF6347
                // Red supergiants (Type M) - very large, deep red
                { color: new BABYLON.Color3(0.863, 0.078, 0.235), scale: [0.8, 1.2], type: 'red_supergiant' }, // #DC143C
                { color: new BABYLON.Color3(0.698, 0.133, 0.133), scale: [0.8, 1.2], type: 'red_supergiant' }, // #B22222
                // Red dwarfs (Type M) - small, red-brown
                { color: new BABYLON.Color3(0.804, 0.361, 0.361), scale: [0.1, 0.4], type: 'red_dwarf' }, // #CD5C5C
                { color: new BABYLON.Color3(0.627, 0.322, 0.176), scale: [0.1, 0.4], type: 'red_dwarf' } // #A0522D
            ];
            return types[Math.floor(Math.random() * types.length)];
        } else if (distanceFromCenter < diskRadius) {
            // Galactic disk: mix of young and old stars (diverse population)
            const types = [
                // Blue giants (Type O/B) - large, blue-white
                { color: new BABYLON.Color3(0.529, 0.808, 0.922), scale: [0.6, 1.0], type: 'blue_giant' }, // #87CEEB
                { color: new BABYLON.Color3(0.690, 0.878, 0.902), scale: [0.6, 1.0], type: 'blue_giant' }, // #B0E0E6
                // Blue main sequence (Type B) - medium-large, blue-white
                { color: new BABYLON.Color3(0.678, 0.847, 0.902), scale: [0.4, 0.7], type: 'blue_star' }, // #ADD8E6
                { color: new BABYLON.Color3(0.529, 0.808, 0.980), scale: [0.4, 0.7], type: 'blue_star' }, // #87CEFA
                // White stars (Type A) - medium, pure white
                { color: new BABYLON.Color3(1.0, 1.0, 1.0), scale: [0.3, 0.7], type: 'white_star' }, // #FFFFFF
                { color: new BABYLON.Color3(0.973, 0.973, 1.0), scale: [0.3, 0.7], type: 'white_star' }, // #F8F8FF
                // Yellow stars (Type G, like Sun) - medium, yellow
                { color: new BABYLON.Color3(1.0, 0.843, 0.0), scale: [0.3, 0.7], type: 'yellow_star' }, // #FFD700
                { color: new BABYLON.Color3(1.0, 1.0, 0.0), scale: [0.3, 0.7], type: 'yellow_star' }, // #FFFF00
                // Orange stars (Type K) - medium-small, orange
                { color: new BABYLON.Color3(1.0, 0.647, 0.0), scale: [0.3, 0.6], type: 'orange_star' }, // #FFA500
                { color: new BABYLON.Color3(1.0, 0.549, 0.0), scale: [0.3, 0.6], type: 'orange_star' }, // #FF8C00
                // Red dwarfs (Type M) - small, red
                { color: new BABYLON.Color3(0.804, 0.361, 0.361), scale: [0.1, 0.4], type: 'red_dwarf' }, // #CD5C5C
                { color: new BABYLON.Color3(0.627, 0.322, 0.176), scale: [0.1, 0.4], type: 'red_dwarf' } // #A0522D
            ];
            return types[Math.floor(Math.random() * types.length)];
        } else {
            // Galactic halo: old, sparse stars (ancient population)
            const types = [
                // Red dwarfs (Type M) - small, red-brown (most common)
                { color: new BABYLON.Color3(0.804, 0.361, 0.361), scale: [0.1, 0.4], type: 'red_dwarf' }, // #CD5C5C
                { color: new BABYLON.Color3(0.627, 0.322, 0.176), scale: [0.1, 0.4], type: 'red_dwarf' }, // #A0522D
                // White dwarfs - very small, brilliant white
                { color: new BABYLON.Color3(1.0, 1.0, 1.0), scale: [0.05, 0.15], type: 'white_dwarf' }, // #FFFFFF
                { color: new BABYLON.Color3(0.941, 0.973, 1.0), scale: [0.05, 0.15], type: 'white_dwarf' }, // #F0F8FF
                // Neutron stars - minuscule, intense white-blue
                { color: new BABYLON.Color3(0.902, 0.902, 0.980), scale: [0.02, 0.08], type: 'neutron_star' }, // #E6E6FA
                { color: new BABYLON.Color3(0.941, 0.973, 1.0), scale: [0.02, 0.08], type: 'neutron_star' } // #F0F8FF
            ];
            return types[Math.floor(Math.random() * types.length)];
        }
    }

    randomColor() {
        // Fallback method - kept for compatibility
        const colors = [
            new BABYLON.Color3(1.0, 0.8, 0.2), // Golden
            new BABYLON.Color3(1.0, 0.4, 0.1), // Orange
            new BABYLON.Color3(0.8, 0.8, 1.0), // Blue-white
            new BABYLON.Color3(1.0, 1.0, 0.8), // White-yellow
            new BABYLON.Color3(1.0, 0.6, 0.6)  // Pink-white
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    generateStarPosition(options = {}) {
        const galaxyRadius = options.galaxyRadius || 200;
        const coreRadius = options.coreRadius || 40;
        const diskThickness = options.diskThickness || 15;
        const haloRadius = options.haloRadius || 300;
        const minDist = options.minDist || 5; // Reduced for 10k stars

        let pos;
        const rand = Math.random();
        
        // Distribution probabilities: 60% disk, 30% core, 10% halo
        if (rand < 0.6) {
            // Galactic disk with spiral arms
            pos = this.generateDiskPosition(galaxyRadius, diskThickness);
        } else if (rand < 0.9) {
            // Dense galactic core
            pos = this.generateCorePosition(coreRadius, diskThickness * 0.5);
        } else {
            // Sparse galactic halo
            pos = this.generateHaloPosition(haloRadius);
        }

        this.starPositions.push(pos);
        return pos;
    }

    generateDiskPosition(radius, thickness) {
        // Spiral galaxy disk with arms
        const angle = Math.random() * 2 * Math.PI;
        const r = radius * Math.sqrt(Math.random()); // Uniform disk distribution
        
        // Add spiral arm structure (3 arms)
        const armOffset = Math.sin(3 * angle + r * 0.02) * 15;
        const finalR = r + armOffset;
        
        const x = finalR * Math.cos(angle);
        const z = finalR * Math.sin(angle);
        const y = (Math.random() - 0.5) * thickness * (1 - r / radius); // Thinner at edges
        
        return new BABYLON.Vector3(x, y, z);
    }

    generateCorePosition(radius, thickness) {
        // Dense galactic core - more concentrated
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * 2 * Math.PI;
        const r = radius * Math.pow(Math.random(), 2); // More concentrated toward center
        
        const x = r * Math.cos(theta);
        const z = r * Math.sin(theta);
        const y = (Math.random() - 0.5) * thickness;
        
        return new BABYLON.Vector3(x, y, z);
    }

    generateHaloPosition(radius) {
        // Sparse spherical halo
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * Math.cbrt(Math.random());
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi);
        const z = r * Math.sin(phi) * Math.sin(theta);
        
        return new BABYLON.Vector3(x, y, z);
    }

    generateStarName() {
        const syllables = [
            'Al', 'Be', 'Ce', 'De', 'El', 'Fi', 'Ga', 'Ha', 'Io', 'Ju',
            'Ka', 'Lu', 'Me', 'No', 'Or', 'Pa', 'Qu', 'Ra', 'Si', 'Tu'
        ];
        const len = 2 + Math.floor(Math.random() * 2);
        let name = '';
        for (let i = 0; i < len; i++) {
            name += syllables[Math.floor(Math.random() * syllables.length)];
        }
        name += '-' + Math.floor(Math.random() * 1000);
        return name;
    }

    async generateGalaxy(count = 10000) {
        console.log('StarFactory: Starting realistic galaxy generation with', count, 'stars');
        
        if (!this.ready) {
            throw new Error('StarFactory not ready');
        }

        const progressText = document.getElementById('progressText');
        const batchSize = 500; // Increased batch size for better performance
        let progress = 0;

        const matrices = [];
        const stars = [];
        const cameraPosition = this.scene.activeCamera ? this.scene.activeCamera.position : new BABYLON.Vector3(0, 0, 0);

        console.log(`StarFactory: Generating ${count} stars with realistic galactic distribution...`);

        for (let i = 0; i < count; i += batchSize) {
            const currentBatch = Math.min(batchSize, count - i);
            
            progress = Math.floor((i / count) * 100);
            if (progressText) {
                progressText.textContent = `Generating galactic stars... ${progress}%`;
            }

            for (let j = 0; j < currentBatch; j++) {
                const position = this.generateStarPosition({
                    galaxyRadius: 200,
                    coreRadius: 40,
                    diskThickness: 15,
                    haloRadius: 300,
                    minDist: 5
                });
                
                // Calculate distance from galactic center and camera for LOD
                const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
                const distanceFromCamera = BABYLON.Vector3.Distance(position, cameraPosition);
                
                // Get realistic star type and properties
                const starType = this.getStarTypeAndColor(position, distanceFromCenter);
                
                // Calculate scale with LOD (Level of Detail)
                let baseScale = starType.scale[0] + Math.random() * (starType.scale[1] - starType.scale[0]);
                
                // Apply distance-based LOD
                const lodFactor = Math.max(0.3, Math.min(1.0, 100 / Math.max(distanceFromCamera, 50)));
                const finalScale = baseScale * lodFactor;
                
                const matrix = BABYLON.Matrix.Compose(
                    new BABYLON.Vector3(finalScale, finalScale, finalScale),
                    BABYLON.Quaternion.Identity(),
                    position
                );

                matrices.push(matrix);

                stars.push({
                    name: this.generateStarName(),
                    position: position,
                    scale: finalScale,
                    size: baseScale,
                    color: starType.color,
                    type: starType.type,
                    distanceFromCenter: distanceFromCenter,
                    distanceFromCamera: distanceFromCamera
                });
            }

            // Yield control more frequently for better responsiveness
            if (i % 1000 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }

        if (progressText) {
            progressText.textContent = 'Optimizing galactic rendering...';
        }

        console.log(`StarFactory: Converting ${matrices.length} matrices and colors to optimized buffers`);

        // Convert matrices to typed array with optimized allocation
        const matrixArray = new Float32Array(matrices.length * 16);
        for (let i = 0; i < matrices.length; i++) {
            const arr = matrices[i].toArray();
            matrixArray.set(arr, i * 16);
        }

        // Create color buffer for individual star colors
        const colorArray = new Float32Array(stars.length * 4); // RGBA for each star
        for (let i = 0; i < stars.length; i++) {
            const color = stars[i].color;
            const baseIndex = i * 4;
            colorArray[baseIndex] = color.r;     // Red
            colorArray[baseIndex + 1] = color.g; // Green
            colorArray[baseIndex + 2] = color.b; // Blue
            colorArray[baseIndex + 3] = 1.0;     // Alpha
        }

        // Set up optimized thin instances with individual colors
        this.starMesh.thinInstanceSetBuffer("matrix", matrixArray, 16);
        this.starMesh.thinInstanceSetBuffer("color", colorArray, 4);
        
        // CRITICAL: Enable picking BEFORE setting up thin instances and ensure mesh is pickable
        this.starMesh.isPickable = true;
        this.starMesh.thinInstanceEnablePicking = true;
        
        // Ensure the mesh has proper bounding info for picking
        this.starMesh.refreshBoundingInfo();
        
        // Enable frustum culling for performance but ensure it doesn't interfere with picking
        this.starMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
        
        // DEBUG: Log picking configuration
        console.log('StarFactory: Mesh picking configuration:');
        console.log('StarFactory: - isPickable:', this.starMesh.isPickable);
        console.log('StarFactory: - thinInstanceEnablePicking:', this.starMesh.thinInstanceEnablePicking);
        console.log('StarFactory: - thinInstanceCount:', this.starMesh.thinInstanceCount);
        console.log('StarFactory: - boundingInfo:', this.starMesh.getBoundingInfo());

        // Store metadata with galactic information
        this.starMesh.metadata = {
            stars: stars,
            galaxyType: 'spiral',
            totalStars: stars.length,
            coreStars: stars.filter(s => s.distanceFromCenter < 40).length,
            diskStars: stars.filter(s => s.distanceFromCenter >= 40 && s.distanceFromCenter < 200).length,
            haloStars: stars.filter(s => s.distanceFromCenter >= 200).length
        };

        console.log('StarFactory: Enabling optimized star mesh');
        this.starMesh.setEnabled(true);
        
        console.log(`StarFactory: Realistic galaxy generation complete - ${stars.length} stars created`);
        console.log('StarFactory: Galaxy composition:', {
            core: this.starMesh.metadata.coreStars,
            disk: this.starMesh.metadata.diskStars,
            halo: this.starMesh.metadata.haloStars
        });
        console.log('StarFactory: Star mesh enabled:', this.starMesh.isEnabled());
        console.log('StarFactory: Star mesh instances:', this.starMesh.thinInstanceCount);
        
        return stars;
    }

    adjustPositionsByGravity(stars) {
        console.log('StarFactory: Skipping gravity adjustments for ultra-simple mode');
        // Skip gravity for maximum simplicity and performance
        return;
    }

    dispose() {
        if (this.starMesh) {
            this.starMesh.dispose();
        }
        if (this.starMaterial) {
            this.starMaterial.dispose();
        }
        this.starPositions = [];
    }
}