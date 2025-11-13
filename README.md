# Práctica Semana 8 IG

## Autora

María Cabrera Vérgez

## Enlaces

[- Vídeo de muestra](--falta ponerlo--)

[- Codesandbox con el código](https://codesandbox.io/p/sandbox/practica-8-final-version-fyfrj3)
## Tareas a realizar

La tarea consistirá en proponer una visualización de datos de acceso abierto que contengan información geográfica en threejs, con las habilidades adquiridas en las sesiones previas. Podrás optar bien por adoptar datos integrando información OSM o datos sobre mapas o su combinación. Es requisito necesario para superar la práctica incluir en la entrega una captura en vídeo (preferentemente de no más de 30 segundos) que ilustre el resultado de la visualizació. La entrega se realiza a través del campus virtual proporcionando un enlace github.

## Índice de contenidos

- [Fondo](#fondo)
- [Luces](#luces)
- [Texturas](#texturas)
- [GUI](#gui)
- [latitudYlongitud](#latitudylongitud)
- [aeropuertosYrutas](#aeropuertosyrutas)
- [createEarth](#createEarth)
- [cargarRutas](#cargarrutas)
- [Animate](#animate)
  

## Tareas

### Fondo

Como se realizó en la práctica 7, en lugar de dejarle un fondo simple, se usó una imagen que se puso como fondo de la escena usando scene.background después de cargar la textura.

``` javascript
const space = new THREE.TextureLoader().load("src/2k_stars_milky_way.jpg");
scene.background = space;
```

### Luces

Se decidió añadir una luz ambiente que pudiera iluminar toda la escena, no produciendo sombras, simplemente para agregar algo de luz a la tierra. Además, se le dio un constraste de 0.3 para que tuviera una intensidad suave y no causara problemas para ver el planeta en cuestión por la claridad.

``` javascript
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);
```

Otra fuente de luz que se le puso fue para imitar la luz del sol. Hay dos versiones, una para la textura de día y otra para la textura de noche, pues se estuvo haciendo varias pruebas con ambas. La versión nocturna tiene una luz más intensa, mientras que la diurna es más suave, no hace tanta falta porque se ven mejor los continentes.

``` javascript
const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5);
// versión de día
//   const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 5, 5); 
scene.add(directionalLight);
```

### Texturas
Como en el caso de la luz, se ha diferenciado entre el caso de noche o día. Para ello, se han cargado dos texturas diferentes. La opción del día, tx1, muestra mayor color y es más fácil diferenciar el mar de la tierra firme. Por otro lado, tx2 es más oscuro, algunos países tienen luces encendidas debido a la noche. Por último, dm2 sirve para la profundida del océano y el relieve del terreno.

``` javascript
const tx1 = new THREE.TextureLoader().load("src/earthmap1k.jpg");
const tx2 = new THREE.TextureLoader().load("src/textura_night.jpg");

const dm2 = new THREE.TextureLoader().load("src/gebco_bathy.5400x2700_8bit.jpg");
```

### GUI

Además se implementó la opción de poder cambiar entre el día y la noche. Esto se hizo por medio de un gui que comienza por defecto de noche. Si se pasa el modo a 'Día', el material usado cambiará a la tx1 (día) y se cambia la intensidad de la luz. 

Si se regresa el modo noche, la textura pasa a ser tx2 y la intensidad de la luz direccional será de 3.5.

``` javascript
gui.add({ modo: "Noche" }, "modo", ["Día", "Noche"]).onChange((v) => {
    if (v === "Día") {
      globe.material.map = tx1;
      directionalLight.intensity = 1.0;
    } else {
      globe.material.map = tx2;
      directionalLight.intensity = 3.5;
    }
    globe.material.needsUpdate = true;
  });
``` 

### latitudYlongitud

Debido a que el conjunto de datos pasaba la información con coordenadas geográficas, era necesario pasarlo a coordenadas 3D para poder representar, por ejemplo, los aeropuertos alrededor del mundo encima de la esfera que representa al planeta. Para ello, se decidió crear una función y facilitar el cambio. Los parámetros a pasarle a la función son: latitud (en grados), longitud (en grados), radio del planeta, desplazamiento para si que quiere mostrar relieve.

Lo primero que se hace es pasar la latitud y longitud de grados a ángulo.

``` javascript
const angle1 = (90 - latitud) * (Math.PI / 180);
const angle2 = (longitud + 180) * (Math.PI / 180);
```

Y se calculan las coordenadas cartesianas, tratando de alinear cada punto con el mapa para que no se vea movido. Es por ello que la x se pone con un '-' por fuera, porque entonces no quedaría bien y habría fallos en la visualización.

``` javascript
const x = -(r * Math.sin(angle1) * Math.cos(angle2));
const y = r * Math.cos(angle1);
const z = r * Math.sin(angle1) * Math.sin(angle2);
```

Por último, se devuelve un vector 3D con la posición que va a necesitar el aeropuerto, por ejemplo, para colocarse.

``` javascript
return new THREE.Vector3(x, y, z);
```

### aeropuertosYrutas

Para poder cargar los archivos donde se encuentran los aeropuertos y colocar donde se encuentran, se creó la función aeropuertosYrutas. Además, se van guardando los datos para luego representar las rutas de los diferentes vuelos.

Se obtienen los datos con fetch a partir de 'airports.dat' (conseguido en la web OpenFlight). La información obtenida se transforma en texto y se devuelven los datos contenidos en una sola cadena. Se dividirá todo el texto en líneas para separar los diferentes aeropuertos los unos de los otros. De esa forma, lines será un array donde cada elemento será una línea del archivo.

``` javascript
fetch("src/airports.dat")
  .then((res) => res.text())
  .then((data) => {
    const lines = data.split("\n");
    let airportMap = {};
```

Se recorren todas las líneas y se cogen los datos separados por medio de comas para formar un nuevo array mejor formado cada datos separado(parts, se divide cada dato en una línea). Se verifica que la línea tenga el tamaño suficiente para que no falte algún dato, solo se está cuidando por si alguna línea aparece vacía. Se guardan, entre otros datos, el código IATA del aeropuerto (útil cuando se vaya a intentar visualizar las rutas de los vuelos), la latitud y la longitud. Son los datos realmente importantes para el propósito del programa.

``` javascript
lines.forEach((line) => {
    const parts = line.split(",");
    if (parts.length > 7) {
      const iata = parts[4].replace(/"/g, "");
      const latitud = parseFloat(parts[6]);
      const longitud = parseFloat(parts[7]);
```

Se comprueba que se tengan los datos y finalmente se colocan los puntos encima de la esfera creada de la tierra. Se crea un objeto donde la clave será el código IATA y almacenan la latitud y longitud para posteriormente las rutas. Se usa la función anteriormente creada (latitudYlongitud) para convertir los datos a coordenadas que se puedan usar. Como se hacía en la práctica 7, se crea la geometría de la esfera, el material que tendrá (será básico y simplemente de color rojo para destacar) y se combina tanto geometría y material para representar el objeto en 3D. Se acaba metiendo el mesh creado dentro donde se van guardando los puntos.

``` javascript
if (iata && !isNaN(latitud) && !isNaN(longitud)) {
      airportMap[iata] = { latitud, longitud };

      const pos = latitudYlongitud(latitud, longitud, radio_globo, 0.05); 
      const geo = new THREE.SphereGeometry(0.01, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      airportPoints.add(mesh);

    }  
```

Después de haber creado todos los puntos y de representarlos, se dibujarán líneas conectando aeropuertos con la función 'cargarRutas'.

```javascript
cargarRutas(airportMap, parentGlobo);
```

### createEarth

La función lo que hace es crear la tierra de la misma forma que se crearon planetas en la práctica 7. Lo que hace es recibir la textura, opcionalmente con relieve, y con un radio específico. Se utilizará un material que permite sombras y reflejos, para que parezca más realista. Posteriormente, se aplica la textura que ha sido usada y se procura usar un color que no cause problemas a la hora de que la textura cargue. 

Si se recibe que se desea tener relieve, se activa y se controla su escala para que no sea algo exagerado, pero también para que sea posible notarlo. Se creará la geometría de la esfera y se devuelve la combinación de amterial y geometría, formando la tierra para poder mostrar los datos sobre ella.

``` javascript
function createEarth(texture, displacement = undefined, radius = 3) {
  const mat = new THREE.MeshPhongMaterial({ map: texture, color: 0xffffff });
  if (displacement) {
    mat.displacementMap = displacement;
    mat.displacementScale = 0.1;
  }
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  return new THREE.Mesh(geometry, mat);
}
```

### cargarRutas

La función se encarga de dibujas las rutas entre los diferentes aeropuertos a partir de los datos obtenido de OpenFlight (2014). Dibujará una línea amarilla entre ambos puntos con una curva. Recibe el mapa con 'IATA: {latitud, longitud}' y la esfera que ha sido creada. Los datos serán procesados de la misma manera que con aeropuertosYrutas, con la diferencia del contenido en cada línea. Se consigue el código IATA del origen (s) y del destino (d), eliminando comillas y espacios que pudieran haber.

``` javascript
fetch("src/routes.dat")
    .then((res) => res.text())
    .then((data) => {
      const lines = data.split("\n");
      lines.forEach((line) => {
        const parts = line.split(",");
        if (parts.length > 5) {
          const s = parts[2].replace(/"/g, "").trim();
          const d = parts[4].replace(/"/g, "").trim();
```

Si ambos aeropuertos están definidos, se intenta dibujar la conexión que marca la ruta seguida en 2014 entre ellos. Se convierten las coordenadas de los aeropuertos en los puntos de inicio y final del viaje, usando la función latitudYlongitud. Las líneas se elevan ligeramente.

``` javascript
 if (airportMap[s] && airportMap[d]) {
            const start = latitudYlongitud(airportMap[s].latitud, airportMap[s].longitud, radio_globo, 0.015);
            const end = latitudYlongitud(airportMap[d].latitud, airportMap[d].longitud, radio_globo, 0.015);
```

Para poder crear la curvatura del arco, se define un punto intermedio, el que estará en lo más alto de la línea. Se normaliza para poder colocar el punto en la esfera y que no se quede dentro de ella o a una distancia mayor de la que permite la cámara.

``` javascript
const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
mid.normalize().multiplyScalar(radio_globo + start.distanceTo(end) * 0.4);
```

Se creará una curva entre el origen y el destino con QuadraticBezierCurve3() y el punto medio creado. Para que quede bien dibujado, la línea se divide en 20 puntos. Para finalizar con la función, se pinta la línea de amarillo y se le da una cierta opacidad (0.5), luego se añade al planeta.

``` javascript
const curva = new THREE.QuadraticBezierCurve3(start, mid, end);
const g = new THREE.BufferGeometry().setFromPoints(curva.getPoints(20));
const linea = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 }));
parentGlobo.add(linea);
```

### Animate

Se muestra la tierra rotando lentamente durante toda la ejecución si existe. Se puede mover la cámara, dar vueltas alrededor del planeta, haciendo click derecho. Con la rueda se puede hacer zoom, permite alejarse todo lo posible, pero no permite meterse dentro del planeta. Renderiza la escena. Este bucle se repite continuamente.

``` javascript
function animate() {
  requestAnimationFrame(animate);

  if (globe) {
    globe.rotation.y += 0.0005;
  }
  camcontrols.update();
  renderer.render(scene, camera);
}
```

