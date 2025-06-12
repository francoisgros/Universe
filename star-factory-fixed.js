import { StarMaterial } from './shaders/starMaterial.js';

export class StarFactory {
    constructor(scene) {
        this.scene = scene;
        this.starPositions = [];
        this.ready = false;
        
        console.log('StarFactory: Creating star mesh template');
        this.starMesh = BABYLON.MeshBuilder.CreateSphere("starTemplate", {
            segments: 6, // Minimal for best performance
            diameter: 20.0 // Extremely large for guaranteed visibility
        }, scene);
        
        this.starMesh.setEnabled(false);
        
        // Initialize asynchronously with beautiful shader material
        console.log('StarFactory: Starting async initialization with StarMaterial');
        this.initPromise = this.initialize().catch(error => {
            console.error('StarFactory: Initialization failed in constructor:', error);
            this.ready = false;
            // Fallback to standard material
            this.initializeFallback();
            throw error;
        });
    }

    async initialize() {
        try {
            console.log('StarFactory: Initializing with custom plasma shader material');
            
            // Create the custom star material with plasma effects
            this.starMaterialInstance = new StarMaterial(this.scene, {
                name: "PlasmaStarMaterial",
                colors: ['#ff3300', '#ff9900', '#ffff00'], // Default colors, will be procedural
                colorSpeed: 1.0
            });
            
            // Initialize the material
            this.starMaterial = await this.starMaterialInstance.initialize();
            
            // Apply the material to the mesh
            this.starMesh.material = this.starMaterial;
            this.starMesh.setEnabled(true);
            this.ready = true;
            
            console.log('StarFactory: Custom plasma shader material initialization complete');
        } catch (error) {
            console.error('StarFactory: Custom shader initialization failed, falling back to standard material:', error);
            this.initializeFallback();
        }
    }

    initializeFallback() {
        try {
            console.log('StarFactory: Creating enhanced standard material with beautiful effects');
            
            // Enhanced standard material with beautiful visual effects
            this.starMaterial = new BABYLON.StandardMaterial("StarMaterialEnhanced", this.scene);
            
            // Beautiful glowing star appearance
            this.starMaterial.emissiveColor = new BABYLON.Color3(1.0, 0.9, 0.3); // Bright golden glow
            this.starMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.8, 0.4); // Warm golden
            this.starMaterial.specularColor = new BABYLON.Color3(1.0, 1.0, 0.8); // Bright specular
            this.starMaterial.specularPower = 32; // Sharp highlights
            
            // Enable transparency for glow effects
            this.starMaterial.alpha = 0.9;
            this.starMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
            
            // Disable backface culling for better visibility
            this.starMaterial.backFaceCulling = false;
            
            this.starMesh.material = this.starMaterial;
            this.starMesh.setEnabled(true);
            this.ready = true;
            
            console.log('StarFactory: Enhanced standard material initialization complete');
        } catch (error) {
            console.error('StarFactory enhanced material initialization failed:', error);
            this.ready = false;
            throw error;
        }
    }

    randomColor() {
        const h = Math.random();
        const s = 0.7 + 0.3 * Math.random();
        const v = 0.8 + 0.2 * Math.random();
        return BABYLON.Color3.FromHSV(h, s, v);
    }

    generateStarPosition(options = {}) {
        const galaxyRadius = options.galaxyRadius || 100;
        const ySpread = options.ySpread || 20;
        const minDist = options.minDist || 5;

        let tries = 0;
        let pos;
        
        do {
            let x, y, z, s;
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                z = Math.random() * 2 - 1;
                s = x*x + y*y + z*z;
            } while (s > 1 || s === 0);
            
            const r = galaxyRadius * Math.cbrt(Math.random());
            x *= r;
            y *= (ySpread / galaxyRadius) * r;
            z *= r;
            
            pos = new BABYLON.Vector3(x, y, z);
            tries++;
        } while (
            this.starPositions.some(existingPos => 
                BABYLON.Vector3.Distance(pos, existingPos) < minDist
            ) && tries < 30
        );

        this.starPositions.push(pos);
        return pos;
    }

    generateStarName() {
        const syllables = [
            'Al', 'Be', 'Ce', 'De', 'El', 'Fi', 'Ga', 'Ha', 'Io', 'Ju',
            'Ka', 'Lu', 'Me', 'No', 'Or', 'Pa', 'Qu', 'Ra', 'Si', 'Tu',
            'Ur', 'Ve', 'Wi', 'Xa', 'Yo', 'Za'
        ];
        const len = 2 + Math.floor(Math.random() * 2);
        let name = '';
        for (let i = 0; i < len; i++) {
            name += syllables[Math.floor(Math.random() * syllables.length)];
        }
        name += '-' + Math.floor(Math.random() * 10000);
        return name;
    }

    async generateGalaxy(count = 500) { // Much reduced count for better performance and visibility
        console.log('StarFactory: Waiting for initialization before galaxy generation');
        try {
            await this.initPromise; // Wait for initialization to complete
        } catch (error) {
            console.error('StarFactory: Failed to wait for initialization:', error);
            throw new Error('Cannot generate galaxy - initialization failed');
        }

        if (!this.ready) {
            throw new Error('StarFactory not ready after initialization');
        }

        const progressText = document.getElementById('progressText');
        const batchSize = 300; // Smaller batches for custom shaders
        let progress = 0;

        const matrices = [];
        const colors1 = [];
        const colors2 = [];
        const colors3 = [];
        const colorParams = [];
        const stars = [];

        console.log(`StarFactory: Generating ${count} stars with beautiful custom shaders...`);

        for (let i = 0; i < count; i += batchSize) {
            const currentBatch = Math.min(batchSize, count - i);
            
            progress = Math.floor((i / count) * 100);
            if (progressText) {
                progressText.textContent = `Generating stars... ${progress}%`;
            }

            for (let j = 0; j < currentBatch; j++) {
                // IMPROVED: Better spatial distribution with more spacing
                const position = this.generateStarPosition({
                    galaxyRadius: 200, // Larger galaxy for better distribution
                    ySpread: 40,       // More vertical spread
                    minDist: 12        // More spacing between stars for airy feel
                });
                
                // Much larger star sizes for visibility
                const scale = 3.0 + Math.random() * 4.0; // Larger scale range for visibility
                
                const matrix = BABYLON.Matrix.Compose(
                    new BABYLON.Vector3(scale, scale, scale),
                    BABYLON.Quaternion.Identity(),
                    position
                );

                // Generate beautiful color variations with HSV
                const baseColor = this.randomColor();
                const pulseColor = this.randomColor(); // Different color for pulsing
                const glowColor = this.randomColor();  // Different color for glow
                const colorSpeed = 0.3 + Math.random() * 1.2; // Varied animation speed

                matrices.push(matrix);
                colors1.push(new BABYLON.Vector4(baseColor.r, baseColor.g, baseColor.b, 1));
                colors2.push(new BABYLON.Vector4(pulseColor.r, pulseColor.g, pulseColor.b, 1));
                colors3.push(new BABYLON.Vector4(glowColor.r, glowColor.g, glowColor.b, 1));
                colorParams.push(colorSpeed);

                stars.push({
                    name: this.generateStarName(),
                    position: position,
                    scale: scale,
                    size: scale, // Add size property for interaction
                    colors: [baseColor, pulseColor, glowColor],
                    colorSpeed: colorSpeed,
                    color: baseColor // Primary color for compatibility
                });
            }

            // Yield control to prevent blocking
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (progressText) {
            progressText.textContent = 'Finalizing star systems...';
        }

        console.log(`StarFactory: Converting ${matrices.length} matrices and colors to buffers`);

        // Convert matrices to typed array for better performance
        const matrixArray = new Float32Array(matrices.length * 16);
        matrices.forEach((mat, idx) => {
            const arr = mat.toArray();
            matrixArray.set(arr, idx * 16);
        });

        // FIXED: Use procedural colors in shaders - no custom vertex attributes needed
        console.log('StarFactory: Setting up matrix buffer for procedural shader rendering');
        
        // Set up the matrix buffer for thin instances
        this.starMesh.thinInstanceSetBuffer("matrix", matrixArray, 16);
        
        // IMPORTANT: Enable picking for thin instances
        console.log('StarFactory: Enabling thin instance picking');
        this.starMesh.thinInstanceEnablePicking = true;

        // IMPORTANT: Store star metadata for cursor detection
        console.log('StarFactory: Storing star metadata for cursor detection');
        this.starMesh.metadata = { stars: stars };

        console.log('StarFactory: Enabling star mesh');
        this.starMesh.setEnabled(true);
        
        console.log(`StarFactory: Galaxy generation complete - ${stars.length} stars created`);
        console.log('StarFactory: First few stars:', stars.slice(0, 3));
        console.log('StarFactory: Star mesh enabled:', this.starMesh.isEnabled());
        console.log('StarFactory: Star mesh instances:', this.starMesh.thinInstanceCount);
        console.log('StarFactory: Star metadata attached:', !!this.starMesh.metadata);
        
        return stars;
    }

    _flattenColors(colors) {
        const array = new Float32Array(colors.length * 4);
        colors.forEach((color, idx) => {
            array[idx * 4] = color.r;
            array[idx * 4 + 1] = color.g;
            array[idx * 4 + 2] = color.b;
            array[idx * 4 + 3] = color.a;
        });
        return array;
    }

    adjustPositionsByGravity(stars) {
        console.log('StarFactory: Adjusting star positions by gravity...');
        
        if (!stars || stars.length === 0) {
            console.log('StarFactory: No stars provided for gravity adjustment');
            return;
        }

        if (!this.ready) {
            console.warn('StarFactory: Cannot adjust positions - factory not ready');
            return;
        }

        console.log(`StarFactory: Processing gravity for ${stars.length} stars`);

        // Simple gravity simulation - stars attract each other
        const gravitationalConstant = 0.0001; // Reduced for stability
        const dampingFactor = 0.98; // Higher damping for stability
        
        // Calculate gravitational forces between stars
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (!star.position) continue;

            let forceX = 0, forceY = 0, forceZ = 0;

            // Calculate forces from nearby stars (limit to prevent performance issues)
            const maxInfluenceDistance = 30; // Reduced influence distance
            const maxStarsToCheck = Math.min(50, stars.length); // Reduced for performance
            
            for (let j = 0; j < maxStarsToCheck && j < stars.length; j++) {
                if (i === j) continue;
                
                const otherStar = stars[j];
                if (!otherStar.position) continue;

                const dx = otherStar.position.x - star.position.x;
                const dy = otherStar.position.y - star.position.y;
                const dz = otherStar.position.z - star.position.z;
                const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);

                if (distance > maxInfluenceDistance || distance < 2) continue;

                // Simple gravitational force calculation
                const force = gravitationalConstant * (star.scale * otherStar.scale) / (distance * distance);
                const normalizedForce = force / distance;

                forceX += dx * normalizedForce;
                forceY += dy * normalizedForce;
                forceZ += dz * normalizedForce;
            }

            // Apply forces with damping to prevent instability
            star.position.x += forceX * dampingFactor;
            star.position.y += forceY * dampingFactor;
            star.position.z += forceZ * dampingFactor;
        }

        // Update the GPU instance buffers with new positions
        this._updateInstancePositions(stars);
        
        console.log('StarFactory: Gravity adjustment complete');
    }

    _updateInstancePositions(stars) {
        if (!this.starMesh || !stars || stars.length === 0) {
            return;
        }

        console.log('StarFactory: Updating GPU instance buffers with new positions');

        // Rebuild the matrix buffer with updated positions
        const matrices = [];
        
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            if (!star.position || !star.scale) continue;

            const matrix = BABYLON.Matrix.Compose(
                new BABYLON.Vector3(star.scale, star.scale, star.scale),
                BABYLON.Quaternion.Identity(),
                star.position
            );
            matrices.push(matrix);
        }

        // Convert to typed array for GPU upload
        const matrixArray = new Float32Array(matrices.length * 16);
        matrices.forEach((mat, idx) => {
            const arr = mat.toArray();
            matrixArray.set(arr, idx * 16);
        });

        // Update the GPU buffer
        this.starMesh.thinInstanceSetBuffer("matrix", matrixArray, 16);
        
        console.log(`StarFactory: Updated ${matrices.length} star positions in GPU buffers`);
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