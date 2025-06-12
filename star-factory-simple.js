export class StarFactory {
    constructor(scene) {
        this.scene = scene;
        this.initialize();
    }

    async initialize() {
        try {
            // Create base mesh
            this.starMesh = BABYLON.MeshBuilder.CreateSphere("starTemplate", {
                segments: 16,
                diameter: 1
            }, this.scene);
            
            // Create material
            this.baseMaterial = new BABYLON.StandardMaterial("starMaterial", this.scene);
            this.baseMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
            this.baseMaterial.disableLighting = true;
            
            // Apply material
            this.starMesh.material = this.baseMaterial;
            
            this.ready = true;
            console.log('StarFactory: Initialization complete');
        } catch (error) {
            console.error('StarFactory initialization failed:', error);
            this.ready = false;
            throw error;
        }
    }

    async generateGalaxy(count = 1000) {
        if (!this.ready) {
            throw new Error('StarFactory not initialized');
        }

        const stars = [];
        const matrices = [];
        
        // Generate stars in a spiral pattern
        for (let i = 0; i < count; i++) {
            const angle = i * 0.1;
            const radius = Math.pow(i / count, 0.5) * 100;
            const x = Math.cos(angle) * radius;
            const y = (Math.random() - 0.5) * 20;
            const z = Math.sin(angle) * radius;
            
            const position = new BABYLON.Vector3(x, y, z);
            const scale = 0.5 + Math.random() * 1.0;
            
            const matrix = BABYLON.Matrix.Compose(
                new BABYLON.Vector3(scale, scale, scale),
                BABYLON.Quaternion.Identity(),
                position
            );
            matrices.push(matrix);
        }

        // Set instance data
        const matrixData = matrices.reduce((arr, mat) => {
            arr.push(...mat.toArray());
            return arr;
        }, []);
        
        this.starMesh.thinInstanceSetBuffer("matrix", matrixData, 16);
        console.log(`Generated ${matrices.length} stars`);
        
        // Store metadata
        this.starMesh.metadata = {
            stars: stars
        };
        
        return stars;
    }

    adjustPositionsByGravity(stars) {
        // Version simplifiée pour le test
        console.log('Adjusting star positions...');
        if (!stars || stars.length === 0) return;

        // Pour le moment, on ne fait rien car les positions sont déjà en spirale
        // Mais on garde la fonction pour la compatibilité avec le reste du code
    }

    dispose() {
        if (this.starMesh) {
            this.starMesh.dispose();
        }
        if (this.baseMaterial) {
            this.baseMaterial.dispose();
        }
    }
}
