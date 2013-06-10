THREE.AnimatedSprites = (function(){
    var vertexShader = [
                          "uniform float rotationAroundX;", //if sprite rotated - it willbe not faced to camera
                          "uniform float spriteRotation;",
                          "uniform int notFaced;",          //do not rotate plane face to camera
                          "uniform vec2 scale;",
                          "varying vec2 vUv;",
                          "void main(){",
                            "vUv = uv;",
                            "vec3 realPosition = position;",
                            "if (spriteRotation != 0.0){",
                                "realPosition.x = ( cos( spriteRotation ) * position.x - sin( spriteRotation ) * position.y );",
                                "realPosition.y = ( sin( spriteRotation ) * position.x + cos( spriteRotation ) * position.y );",
                            "}",
                            "if (rotationAroundX!=0.0){",
                                "vec3 rotatedPosition = vec3(realPosition.x*scale.x, realPosition.y, realPosition.z);",
                                "rotatedPosition.y =  (cos( rotationAroundX ) * realPosition.y + sin( rotationAroundX ) * realPosition.z)*scale.y ;",
                                "rotatedPosition.z = (-sin( rotationAroundX ) * realPosition.y + cos( rotationAroundX ) * realPosition.z)*scale.y;",
                                "gl_Position = projectionMatrix * modelViewMatrix * vec4(rotatedPosition, 1.0);",
                            "} else if (notFaced>0) {",
                                "gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(realPosition.x*scale.x, realPosition.y*scale.y, realPosition.z), 1.0);",
                            "} else {",
                                "gl_Position = projectionMatrix * (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4(realPosition.x*scale.x, realPosition.y*scale.y, 0.0, 0.0));",
                            "}",
                          "}"
                        ].join("\n");
    var fragmentShader = [
                          "uniform sampler2D spriteTexture;",   //sprite texture
                          "uniform int speed;",                 //time to spend for all animations
                          "uniform int framesCount;",           //how many frames in this sprite
                          "varying vec2 vUv;",
                          "uniform float time;",
                          "void main(){",
                            "int frameId = int(floor(mod(time, float(speed) )/(float(speed)/float(framesCount))));",
                            "float oneFrameWidth = 1.0/float(framesCount);",
                            "vec2 uvOffset = vec2(oneFrameWidth*float(frameId)+vUv.x*oneFrameWidth, vUv.y);",
                            "vec4 baseColor  = texture2D( spriteTexture, uvOffset );",
                            "gl_FragColor = baseColor;",
                          "}"
                        ].join("\n");

    var shaderSharedUniform = {
        time: { type: "f", value: 1.0 }
    };
    var geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-1,-1,0));
    geometry.vertices.push(new THREE.Vector3(-1,1,0));
    geometry.vertices.push(new THREE.Vector3(1,1,0));
    geometry.vertices.push(new THREE.Vector3(1,-1,0));
    geometry.faces.push(new THREE.Face4(0,3,2,1));
    geometry.faceVertexUvs[ 0 ].push([new THREE.Vector2(0, 0),new THREE.Vector2(1, 0),new THREE.Vector2(1, 1),new THREE.Vector2(0, 1)]);

    function Sprite(spriteOptions){
        //time is shared between all sprites
        var shaderUniform = {
            time: shaderSharedUniform.time,
            scale: {type: "v2", value: null},
            rotationAroundX: {type: "f", value: null},
            spriteRotation: {type: "f", value: null},
            spriteTexture: {type: "t", value: null},
            speed: {type: "i", value: null},
            frameWidth: {type: "i", value: null},
            framesCount: {type: "i", value: null},
            notFaced: {type:"i", value: 0}
        };

        //allows change sprite speed, rotation or texture
        this.changeOptions = function(newOptions){
            shaderUniform.speed.value= newOptions.speed || shaderUniform.speed.value || 1000;
            shaderUniform.frameWidth.value= newOptions.frameWidth || shaderUniform.frameWidth.value || 64.0;
            shaderUniform.framesCount.value= newOptions.framesCount || shaderUniform.framesCount.value || 1.0;
            shaderUniform.scale.value= (newOptions.frameWidth && newOptions.frameHeight)?new THREE.Vector2(newOptions.frameWidth, newOptions.frameHeight):shaderUniform.scale.value || new THREE.Vector2(1,1);
            shaderUniform.rotationAroundX.value= newOptions.rotationAroundX*Math.PI/180 || shaderUniform.rotationAroundX.value || 0.0;
            shaderUniform.spriteRotation.value= newOptions.spriteRotation*Math.PI/180 || shaderUniform.spriteRotation.value || 0.0;
            shaderUniform.spriteTexture.value= newOptions.spriteTexture || shaderUniform.spriteTexture.value;
            shaderUniform.notFaced.value= newOptions.notFaced || 0;
        };
        this.changeOptions(spriteOptions);

        var shaderMaterial = new THREE.ShaderMaterial({
            uniforms:       shaderUniform,
            vertexShader:   vertexShader,
            fragmentShader: fragmentShader,
            transparent:  true
        });
        this.mesh = spriteOptions.mesh;
        if (!this.mesh)
            this.mesh = new THREE.Mesh(geometry, shaderMaterial);
        this.mesh.changeOptions = this.changeOptions;
        this.mesh.position = spriteOptions.position;
    }

    function SpritesGroup(img, options){
        //draw image on canvas, then we will cut sprites from it
            var canv = document.createElement("canvas");
            canv.width = img.width;
            canv.height = img.height;
            var ctx = canv.getContext("2d");
            ctx.drawImage(img,0,0);
            //document.getElementById("bdy").appendChild(canv);
        //local
            var cached = {};

        //get sprite for concrete animation
        this.getTexture = function(name, tOptions){
            if (typeof tOptions == "undefined") tOptions = {noCache: false, newSpriteParams: {}};
            if (!options.sprites[name]) throw Error("Can't find this sprite group: "+name);
            _.extend(options.sprites[name], tOptions.newSpriteParams);
            var spriteParams = options.sprites[name];
            if (tOptions.noCache || !cached[name]){
                var ida = ctx.getImageData(spriteParams.offset[0], spriteParams.offset[1], spriteParams.size[0], spriteParams.size[1]);
                var texture = new THREE.Texture(ida);
                texture.needsUpdate=true;
                cached[name]={
                                texture: texture
                            };
            }
            var clonedTexture = cached[name].texture.clone();
            clonedTexture.needsUpdate = true;
            return  _.extend({}, spriteParams, {spriteTexture: clonedTexture});
        };

        //return new mesh. // to change sprite on existent mesh call methods changeSprite or changeOptions in that mesh
        this.getNewSprite = function(name, spriteOptions){
            var params = this.getTexture(name);
            var sprite = new Sprite(_.extend(params, spriteOptions) );
            var group = this;
            sprite.mesh.changeSprite = function(name, options){
                var params = group.getTexture(name, options);
                sprite.changeOptions(params);
            };

            return sprite.mesh;
        };
    }

    function updateAnimatedSprites(delta){
        shaderSharedUniform.time.value += delta;
    }

    return {
        SpritesGroup: SpritesGroup,
        update: updateAnimatedSprites
    };
})();


/*
uvOffset: { type: "v2", value: newOptions.uvOffset || shaderUniform.uvOffset.value || new THREE.Vector2(0,0) },
                        uvScale: { type: "v2", value: newOptions.uvScale || shaderUniform.uvScale.value || new THREE.Vector2(1,1) },
                                                    useScreenCoordinates: { type: "f", value: newOptions.useScreenCoordinates || shaderUniform.useScreenCoordinates.value || 0.0 },
                                                    "uniform int frameWidth;",            //width of each frame
*/