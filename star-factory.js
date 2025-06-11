export class StarFactory {
    constructor(scene) {
        this.scene = scene;
        this.starPositions = [];
    }

    randomColor() {
        const h = Math.random();  // 0 to 1
        const s = 0.7 + 0.3 * Math.random();  // 0.7 to 1.0 for vivid colors
        const v = 0.8 + 0.2 * Math.random();  // 0.8 to 1.0 for bright stars
        return BABYLON.Color3.FromHSV(h, s, v);
    }

    generateStarPosition(options = {}) {
        const galaxyRadius = options.galaxyRadius || 220;
        const ySpread = options.ySpread || 80;
        const minDist = options.minDist || 10;

        let tries = 0;
        let pos;
        
        do {
            // Marsaglia method for uniform sphere distribution
            let x, y, z, s;
            do {
                x = Math.random() * 2 - 1;
                y = Math.random() * 2 - 1;
                z = Math.random() * 2 - 1;
                s = x*x + y*y + z*z;
            } while (s > 1 || s === 0);
            
            const r = galaxyRadius * Math.cbrt(Math.random());
            x *= r;
            y *= (ySpread / galaxyRadius) * r; // Galactic flattening
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

    createStar(options = {}) {
        const name = this.generateStarName();
        const position = this.generateStarPosition(options);
        const scale = 0.05 + Math.random() * 0.12;

        // Create star mesh
        const star = BABYLON.MeshBuilder.CreateSphere(name, {
            segments: 32,
            diameter: 1
        }, this.scene);

        // Set position and scale
        star.position = position;
        star.scaling = new BABYLON.Vector3(scale, scale, scale);

        // Create material
        const material = new BABYLON.ShaderMaterial(
            "starMaterial",
            this.scene,
            {
                vertex: "star",
                fragment: "star",
            },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: [
                    "world", "worldView", "worldViewProjection",
                    "time", "color1", "color2", "color3", "colorSpeed"
                ]
            }
        );

        // Set material properties
        const colors = [
            this.randomColor(),
            this.randomColor(),
            this.randomColor()
        ];
        const colorSpeed = 0.2 + Math.random() * 1.2;

        material.setVector3("color1", colors[0]);
        material.setVector3("color2", colors[1]);
        material.setVector3("color3", colors[2]);
        material.setFloat("colorSpeed", colorSpeed);
        material.setFloat("time", 0);

        // Update time uniform
        let startTime = Date.now();
        this.scene.registerBeforeRender(() => {
            material.setFloat("time", (Date.now() - startTime) / 1000.0);
        });

        star.material = material;
        star.metadata = {
            name: name,
            type: 'star',
            colorSpeed: colorSpeed,
            colors: colors.map(c => c.toHexString())
        };

        return star;
    }

    generateGalaxy(count = 10000) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push(this.createStar());
        }
        return stars;
    }

    adjustPositionsByGravity(stars) {
        // Sort stars by size (largest first)
        stars.sort((a, b) => b.scaling.x - a.scaling.x);
        
        // Larger stars stay put, smaller ones are attracted
        for (let i = 1; i < stars.length; i++) {
            let closestBig = null;
            let minDist = Infinity;
            
            for (let j = 0; j < i; j++) {
                const dist = BABYLON.Vector3.Distance(
                    stars[i].position,
                    stars[j].position
                );
                if (dist < minDist) {
                    minDist = dist;
                    closestBig = stars[j];
                }
            }
            
            if (closestBig && minDist > 0) {
                // Enhanced gravity effect: stronger pull for smaller stars
                const factor = 0.35 + 0.55 * (
                    1 - stars[i].scaling.x / closestBig.scaling.x
                );
                
                const direction = closestBig.position.subtract(
                    stars[i].position
                ).scale(factor);
                
                stars[i].position.addInPlace(direction);
            }
        }
    }
}
