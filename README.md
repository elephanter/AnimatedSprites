AnimatedSprites
===============

Three.js module for animated sprites.

Tryed to make fast and useful animated sprites for Three.js library.

###Requires
* Three.js
* underscore

###Links

[Sprite viewer](http://elephanter.github.io/AnimatedSprites/index.html) - [Performance testing](http://elephanter.github.io/AnimatedSprites/test.html)

###Code example

    var spriteGroup = new THREE.AnimatedSprites.SpritesGroup(image, {
                            sprites:{
                                walk: {
                                    offset:[0, 0],
                                    size:[32*3, 32],
                                    frameWidth: 32,
                                    frameHeight: 32,
                                    framesCount: 3,
                                    speed: 200,           //full animation time ms.
                                    rotationAroundX: 0,   //degrees
                                    spriteRotation: 0     //degrees
                                }
                            }
                        }
                );
    var sprite_mesh = spriteGroup.getNewSprite("walk",{position: new THREE.Vector3(40,40,40)});
    scene.add(sprite_mesh);
    //....
    //...
    sprite_mesh.changeSprite("run");
    
also do not forget to write

    THREE.AnimatedSprites.update(delta);
  
in yours render function
