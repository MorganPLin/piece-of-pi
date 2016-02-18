import { scene, camera, renderer } from './scene';
import { setEvents } from './setEvents';
import { convertToXYZ, getEventCenter, geodecoder } from './geoHelpers';
import { mapTexture } from './mapTexture';
import { getTween, memoize } from './utils';
import topojson from 'topojson';
import THREE from 'THREE';
import d3 from 'd3';

// var light = new THREE.HemisphereLight('#ffffff', '#666666', 1.5);
var light = new THREE.HemisphereLight(0xffffff, 1);
// light.position.set(5, 3, 5);
light.position.set(0, 1000, 0);
// scene.add(light);

d3.json('data/world.json', function (err, data) {

// geometry.colors.push
// create the particle variables
// var particleCount = 1000;


// var color = new THREE.Color(255, 255, 255);

// let particles = new THREE.Geometry(),
//   pMaterial = new THREE.PointsMaterial({
//     color:color,
//     size: 2
//     // vertexColors: THREE.VertexColors
//   });

// // now create the individual particles
// for (var p = 0; p < particleCount; p++) {

//   // create a particle with random
//   // position values, -250 -> 250
//   var pX = Math.random() * 500 - 250,
//       pY = Math.random() * 500 - 250,
//       pZ = Math.random() * 500 - 250,
//       particle = new THREE.Vector3(pX, pY, pZ);
//       particles.vertices.push(particle)
//       // particles.colors.push(new THREE.Color(Math.random(),Math.random(),Math.random()))

//   // add it to the geometry
//   // particles.vertices.push(particle);
// }

// // create the particle system
// var particleSystem = new THREE.Points( particles, pMaterial);

// // add it to the scene
// scene.add(particleSystem);

  d3.select("#loading").transition().duration(500)
    .style("opacity", 0).remove();

  var currentCountry;
  var overlay;

  // Setup cache for country textures
  var countries = topojson.feature(data, data.objects.countries);
  // console.log(topojson.feature)
  var geo = geodecoder(countries.features);

  var textureCache = memoize(function (countryID, color) {
    var country = geo.find(countryID);
    return mapTexture(country, color);
  });

  // Base globe with blue "water"
  let blueMaterial = new THREE.MeshPhongMaterial({color: '#165F9C'});

  // cooler blue: '#2B3B59'
  //SphereGeometry takes on three arguments-(radius, height, width)
  // number of vertices. Higher = better mouse accuracy
  //base sphere
  let sphere = new THREE.SphereGeometry(160, 200, 200);

  let baseGlobe = new THREE.Mesh(sphere, blueMaterial);

  //Math.PI=3.14....
  baseGlobe.rotation.y = Math.PI;
  baseGlobe.addEventListener('click', onGlobeClick);
  baseGlobe.addEventListener('mousemove', onGlobeMousemove);

  // add base map layer with all countries
  let worldTexture = mapTexture(countries, '#647089');
  let mapMaterial  = new THREE.MeshPhongMaterial({map: worldTexture, transparent: true});

  //make sure sphere size is same as previous sphere, borrow measurments from above
  var baseMap = new THREE.Mesh(sphere, mapMaterial);
  var clouds = new THREE.Mesh(
    new THREE.SphereGeometry(161, 200, 200),
    new THREE.MeshPhongMaterial({
      map: THREE.ImageUtils.loadTexture('../assets/clouds.png'),
      transparent: true
    })
  );

  baseMap.rotation.y = Math.PI;

  // create a container node and add the two meshes
  var root = new THREE.Object3D();
  root.scale.set(2.5, 2.5, 2.5);
  //add the base globe
  root.add(baseGlobe);
  //layer the map on top of that
  root.add(baseMap);
  baseMap.add(clouds);
  scene.add(root);
  scene.add(light)

  function onGlobeClick(event) {

    // Get point of your click, convert to latitude/longitude
    var latlng = getEventCenter.call(this, event);
    // Get new camera position
    var temp = new THREE.Mesh();
    temp.position.copy(convertToXYZ(latlng, 900));
    temp.lookAt(root.position);

    temp.rotateY(Math.PI);
    $('')
    for (let key in temp.rotation) {
      if (temp.rotation[key] - camera.rotation[key] > Math.PI) {
        temp.rotation[key] -= Math.PI * 2;
      } else if (camera.rotation[key] - temp.rotation[key] > Math.PI) {
        temp.rotation[key] += Math.PI * 2;
      }
    }

    var tweenPos = getTween.call(camera, 'position', temp.position);
    d3.timer(tweenPos);

    var tweenRot = getTween.call(camera, 'rotation', temp.rotation);
    d3.timer(tweenRot);
  }
//hover function
  function onGlobeMousemove(event) {
    var map, material;

    // Get point, convert to latitude/longitude
    var latlng = getEventCenter.call(this, event);

    // Look for country at that latitude/longitude
    var country = geo.search(latlng[0], latlng[1]);

    if (country !== null && country.code !== currentCountry) {

      // Track the current country displayed
      currentCountry = country.code;

      // Update the html
      d3.select("#msg").html(country.code);

       // Overlay the selected country with yellow color
      map = textureCache(country.code, '#CDC290');
      material = new THREE.MeshPhongMaterial({map: map, transparent: true});
      if (!overlay) {
        // push the country above the atmosphere
        overlay = new THREE.Mesh(new THREE.SphereGeometry(201, 40, 40), material);
        overlay.rotation.y = Math.PI;
        root.add(overlay);
      } else {
        overlay.material = material;
      }
    }
  }

  setEvents(camera, [baseGlobe], 'click');
  setEvents(camera, [baseGlobe], 'mousemove');
  function animate() {
    //get clouds to rotate
    clouds.rotation.z += -0.0007
    requestAnimationFrame(animate);
    // baseMap.rotation.x += 0.1
    // add control panel for rotation, toggle rotation
    $('#stopRotation').click(function(){
          rotate = !rotate
    });
  // toggle button
    if (rotate) {
      root.rotation.y += 0.002
      $('#stopRotation').html("STOP ROTATION")
    } else {
      $('#stopRotation').html("START ROTATION")
    }

    renderer.render(scene, camera);
  }

  animate();
});

var rotate = true


