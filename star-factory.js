import { StarMaterial } from './shaders/starMaterial.js';

export class StarFactory {
    constructor(scene) {
        this.scene = scene;
        this.starPositions = [];
        this.ready = false;
        
        console.log('StarFactory: Creating star mesh template');
        this.starMesh = BABYLON.MeshBuilder.CreateSphere("starTemplate", {
            segments: 16,
            diameter: 1
        }, scene);
        
        this.starMesh.setEnabled(false);
        
        // Initialize asynchronously
        console.log('StarFactory: Starting async initialization');
        this.initPromise = this.initialize().catch(error => {
            console.error('StarFactory: Initialization failed in constructor:', error);
            this.ready = false;
            throw error;
        });
    }

    async initialize() {
        try {
            console.log('StarFactory: Creating StarMaterial instance');
            this.starMaterial = new StarMaterial(this.scene, {
                name: "StarMaterial",
                colors: ['#ffaa00', '#ffff00', '#ffffff'],
                colorSpeed: 1.0
            });
            
            console.log('StarFactory: Initializing StarMaterial');
            const material = await this.starMaterial.initialize();
            
            console.log('StarFactory: Checking material readiness');
            if (!material) {
                throw new Error('Material is null after initialization');
            }
            
            const isReady = material.isReady();
            console.log('StarFactory: Material ready state:', isReady);
            
            if (!isReady) {
                throw new Error('Material not ready after initialization');
            }
            
            this.starMesh.material = material;
            
            // Initialize instance buffers with proper typed arrays
            const maxInstances = 10000;
            const bufferMatrices = new Float32Array(maxInstances * 16);
            const bufferColors = new Float32Array(maxInstances * 12); // 4 components * 3 colors
            const bufferParams = new Float32Array(maxInstances);

            // Register instance attributes with proper types and components
            this.starMesh.thinInstanceRegisterAttribute("color1", 4);
            this.starMesh.thinInstanceRegisterAttribute("color2", 4);
            this.starMesh.thinInstanceRegisterAttribute("color3", 4);
            this.starMesh.thinInstanceRegisterAttribute("colorParams", 1);

            this.matrices = bufferMatrices;
            this.colors = bufferColors;
            this.params = bufferParams;
            this.nbInstances = 0;
            this.maxInstances = maxInstances;
            
            this.starMesh.setEnabled(true);
            this.ready = true;
        } catch (error) {
            console.error('StarFactory initialization failed:', error);
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

    async generateGalaxy(count = 10000) {
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
        const batchSize = 1000;
        let progress = 0;

        const matrices = [];
        const colors1 = [];
        const colors2 = [];
        const colors3 = [];
        const colorParams = [];
        const stars = [];

        for (let i = 0; i < count; i += batchSize) {
            const currentBatch = Math.min(batchSize, count - i);
            
            progress = Math.floor((i / count) * 100);
            if (progressText) {
                progressText.textContent = `Generating stars... ${progress}%`;
            }

            for (let j = 0; j < currentBatch; j++) {
                const position = this.generateStarPosition();
                const scale = 0.5 + Math.random() * 1.0;
                
                const matrix = BABYLON.Matrix.Compose(
                    new BABYLON.Vector3(scale, scale, scale),
                    BABYLON.Quaternion.Identity(),
                    position
                );

                const baseColor = this.randomColor();
                const pulseColor = baseColor.add(new BABYLON.Color3(0.2, 0.2, 0.1));
                const glowColor = baseColor.add(new BABYLON.Color3(0.3, 0.3, 0.2));
                const colorSpeed = 0.5 + Math.random() * 1.5;

                matrices.push(matrix);
                colors1.push(new BABYLON.Vector4(baseColor.r, baseColor.g, baseColor.b, 1));
                colors2.push(new BABYLON.Vector4(pulseColor.r, pulseColor.g, pulseColor.b, 1));
                colors3.push(new BABYLON.Vector4(glowColor.r, glowColor.g, glowColor.b, 1));
                colorParams.push(colorSpeed);

                stars.push({
                    name: this.generateStarName(),
                    position: position,
                    scale: scale,
                    colors: [baseColor, pulseColor, glowColor],
                    colorSpeed: colorSpeed
                });
            }

            await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (progressText) {
            progressText.textContent = 'Finalizing star systems...';
        }

        // Convert matrices to typed array for better performance
        const matrixArray = new Float32Array(matrices.length * 16);
        matrices.forEach((mat, idx) => {
            const arr = mat.toArray();
            matrixArray.set(arr, idx * 16);
        });

        // Set instance data efficiently
        this.starMesh.thinInstanceSetBuffer("matrix", matrixArray, 16);
        this.starMesh.thinInstanceSetBuffer("color1", this._flattenColors(colors1), 4);
        this.starMesh.thinInstanceSetBuffer("color2", this._flattenColors(colors2), 4);
        this.starMesh.thinInstanceSetBuffer("color3", this._flattenColors(colors3), 4);
        this.starMesh.thinInstanceSetBuffer("colorParams", new Float32Array(colorParams), 1);

        this.starMesh.setEnabled(true);
        
        console.log(`StarFactory: Galaxy generation complete - ${stars.length} stars created`);
        console.log('StarFactory: First few stars:', stars.slice(0, 3));
        console.log('StarFactory: Star mesh enabled:', this.starMesh.isEnabled());
        console.log('StarFactory: Star mesh instances:', this.starMesh.thinInstanceCount);
        
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
