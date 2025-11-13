import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "lil-gui";

let scene, renderer, camera, globe;
let camcontrols;
let airportPoints = new THREE.Group();

const radio_globo = 3;

const gui = new GUI();

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 7;

  const space = new THREE.TextureLoader().load("src/2k_stars_milky_way.jpg");
  scene.background = space;

  renderer = new THREE.WebGLRenderer({ antialias: true }); 
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  camcontrols = new OrbitControls(camera, renderer.domElement);
  camcontrols.minDistance = radio_globo + 0.5;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5);
  directionalLight.position.set(5, 5, 5); 
  scene.add(directionalLight);

  const tx1 = new THREE.TextureLoader().load("src/earthmap1k.jpg");
  const tx2 = new THREE.TextureLoader().load("src/textura_night.jpg");

  const dm2 = new THREE.TextureLoader().load("src/gebco_bathy.5400x2700_8bit.jpg");

  globe = createEarth(tx2, dm2, radio_globo);
  scene.add(globe);

  globe.add(airportPoints);

  aeropuertosYrutas(globe);

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

}

function latitudYlongitud(latitud, longitud, radius, offset = 0) {
  const angle1 = (90 - latitud) * (Math.PI / 180);
  const angle2 = (longitud + 180) * (Math.PI / 180);
  const r = radius + offset;

  const x = -(r * Math.sin(angle1) * Math.cos(angle2));
  const y = r * Math.cos(angle1);
  const z = r * Math.sin(angle1) * Math.sin(angle2);

  return new THREE.Vector3(x, y, z);
}

function aeropuertosYrutas(parentGlobo) {
  fetch("src/airports.dat")
    .then((res) => res.text())
    .then((data) => {
      const lines = data.split("\n");
      let airportMap = {};
    
      lines.forEach((line) => {
        const parts = line.split(",");
        if (parts.length > 7) {
          const iata = parts[4].replace(/"/g, "");
          const latitud = parseFloat(parts[6]);
          const longitud = parseFloat(parts[7]);
          if (iata && !isNaN(latitud) && !isNaN(longitud)) {
            airportMap[iata] = { latitud, longitud };

            const pos = latitudYlongitud(latitud, longitud, radio_globo, 0.2); 
            const geo = new THREE.SphereGeometry(0.01, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(pos);
            airportPoints.add(mesh);

          }
        }
      });

      cargarRutas(airportMap, parentGlobo);
    });
}

function createEarth(texture, displacement = undefined, radius = 3) {
  const mat = new THREE.MeshPhongMaterial({ map: texture, color: 0xffffff });
  if (displacement) {
    mat.displacementMap = displacement;
    mat.displacementScale = 0.1;
  }
  const geometry = new THREE.SphereGeometry(radius, 64, 64);
  return new THREE.Mesh(geometry, mat);
}


function cargarRutas(airportMap, parentGlobo) {
  fetch("src/routes.dat")
    .then((res) => res.text())
    .then((data) => {
      const lines = data.split("\n");
      lines.forEach((line) => {
        const parts = line.split(",");
        if (parts.length > 5) {
          const s = parts[2].replace(/"/g, "").trim();
          const d = parts[4].replace(/"/g, "").trim();

          if (airportMap[s] && airportMap[d]) {
            const start = latitudYlongitud(airportMap[s].latitud, airportMap[s].longitud, radio_globo, 0.015);
            const end = latitudYlongitud(airportMap[d].latitud, airportMap[d].longitud, radio_globo, 0.015);

            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
            mid.normalize().multiplyScalar(radio_globo + start.distanceTo(end) * 0.4);

            const curva = new THREE.QuadraticBezierCurve3(start, mid, end);
            const g = new THREE.BufferGeometry().setFromPoints(curva.getPoints(20));
            const linea = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5 }));
            parentGlobo.add(linea);
          }
        }
      });
    });
}

function animate() {
  requestAnimationFrame(animate);

  if (globe) {
    globe.rotation.y += 0.0005;
  }
  camcontrols.update();
  renderer.render(scene, camera);
}
