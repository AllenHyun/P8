# Práctica Semana 8 IG

## Autora

María Cabrera Vérgez

## Enlaces

[- Vídeo de muestra](--falta ponerlo--)

[- Codesandbox con el código](https://codesandbox.io/p/sandbox/practica-8-final-version-fyfrj3)
## Tareas a realizar

La tarea consistirá en proponer una visualización de datos de acceso abierto que contengan información geográfica en threejs, con las habilidades adquiridas en las sesiones previas. Podrás optar bien por adoptar datos integrando información OSM o datos sobre mapas o su combinación. Es requisito necesario para superar la práctica incluir en la entrega una captura en vídeo (preferentemente de no más de 30 segundos) que ilustre el resultado de la visualizació. La entrega se realiza a través del campus virtual proporcionando un enlace github.

## Índice de contenidos

- [Ejemplo de índice](#ejemplo)
  

## Tareas

### Fondo

Como se realizó en la práctica 7, en lugar de dejarle un fondo simple, se usó una imagen que se puso como fondo de la escena usando scene.background después de cargar la textura.

``` javascript
const space = new THREE.TextureLoader().load("src/2k_stars_milky_way.jpg");
scene.background = space;
```


