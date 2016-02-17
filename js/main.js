import { scene, camera, renderer } from './scene';
import { setEvents } from './setEvents';
import { convertToXYZ, getEventCenter, geodecoder } from './geoHelpers';
import { mapTexture } from './mapTexture';
import { getTween, memoize } from './utils';
import topojson from 'topojson';
import THREE from 'THREE';
import d3 from 'd3';


d3.json('data/world.json', function (err, data) {

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
  let blueMaterial = new THREE.MeshPhongMaterial({color: '#2B3B59', transparent: true});
  //SphereGeometry takes on three arguments-(radius, )
  // number of vertices. Higher = better mouse accuracy
  let sphere = new THREE.SphereGeometry(200, 200, 200);

  let baseGlobe = new THREE.Mesh(sphere, blueMaterial);
  console.log(blueMaterial)

  //Math.PI=3.14....
  baseGlobe.rotation.y = Math.PI;
  baseGlobe.addEventListener('click', onGlobeClick);
  baseGlobe.addEventListener('mousemove', onGlobeMousemove);

  // add base map layer with all countries
  let worldTexture = mapTexture(countries, '#647089');
  let mapMaterial  = new THREE.MeshPhongMaterial({map: worldTexture, transparent: true});

  //make sure sphere size is same as previous sphere, borrow measurments from above
  var baseMap = new THREE.Mesh(sphere, mapMaterial);

  baseMap.rotation.y = Math.PI;

  // create a container node and add the two meshes
  var root = new THREE.Object3D();
  root.scale.set(2.5, 2.5, 2.5);
  //add the base globe
  root.add(baseGlobe);
  //layer the map on top of that
  root.add(baseMap);
  scene.add(root);

  function onGlobeClick(event) {

    // Get point of your click, convert to latitude/longitude
    var latlng = getEventCenter.call(this, event);
    console.log(latlng)

    // Get new camera position
    var temp = new THREE.Mesh();
    temp.position.copy(convertToXYZ(latlng, 900));
    temp.lookAt(root.position);

    temp.rotateY(Math.PI);

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
});

var rotate = true

function animate() {
  // add control panel for rotation, toggle rotation
  $('#stopRotation').click(function(){
        rotate = !rotate
  });
// toggle button
  if (rotate) {
    scene.rotation.y += 0.005
    $('#stopRotation').html("STOP ROTATION")
  } else {
    $('#stopRotation').html("START ROTATION")
  }

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();

