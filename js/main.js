import { scene, camera, renderer } from './scene';
import { setEvents } from './setEvents';
import { convertToXYZ, getEventCenter, geodecoder } from './geoHelpers';
import { mapTexture } from './mapTexture';
import { memoize } from './utils';

// grabbed from ES6 modules
import topojson from 'topojson';
import THREE from 'THREE';
import d3 from 'd3';

// var light = new THREE.HemisphereLight('#ffffff', '#666666', 1.5);
var light = new THREE.HemisphereLight(0xffffff, 1.5);
// light.position.set(5, 3, 5);
light.position.set(0, 1000, 0);
// scene.add(light);

d3.json('data/world.json', function (err, data) {


  // d3.select("#loading").transition().duration(500)
  //   .style("opacity", 0).remove();

  var currentCountry;
  var countryProjection;

  // Setup cache for country textures
  //http://blog.workshape.io/making-a-spherical-globe-using-d3js/
  var countries = topojson.feature(data, data.objects.countries);
    // data at this point = an array of arcs
    // console.log(data)

  var geo = geodecoder(countries.features);

// memoize from utility file, shorten the memory to translate each country onto the globe
  var textureCache = memoize(function (countryID, color) {
    var country = geo.find(countryID);
    return mapTexture(country, color);
  });

  // Base globe with water
  let blueMaterial = new THREE.MeshPhongMaterial({color: '#165F9C'});

  // cooler blue: '#2B3B59'

  //SphereGeometry takes on three arguments-(radius, height, width)
  // number of vertices (2nd and 3rd arguments) Higher = better mouse accuracy
  //base sphere
  let sphere = new THREE.SphereGeometry(160, 200, 200);

  let baseGlobe = new THREE.Mesh(sphere, blueMaterial);

  //Math.PI=3.14....
  // rotate by half a circle to reorient
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
      transparent: true,
      opacity: 0.7
    })
  );

  // rotate by half a circle to reorient according to baseGlobe
  baseMap.rotation.y = Math.PI;

  // create a container node called roote and add the water layer and the baseMap layer
  var root = new THREE.Object3D();
  root.scale.set(2.5, 2.5, 2.5);
  //add the base globe
  root.add(baseGlobe);
  //layer the map on top of that
  root.add(baseMap);
  // add cloud layer
  baseMap.add(clouds);
  //add your globe to the scene
  scene.add(root);
  scene.add(light)

// click to reorient, need to fix tweenPosition and tweenRotate, which rotates the globe to recenter on your mouse click
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
   // // push data into an array of saved countries
   //  var tweenPos = getTween.call(camera, 'position', temp.position);
   //  d3.timer(tweenPos);

   //  var tweenRot = getTween.call(camera, 'rotation', temp.rotation);
   //  d3.timer(tweenRot);

  }

  //hover function calls the overlay
  function onGlobeMousemove(event) {
    var map, material;

    // Get point, convert to latitude/longitude
    var latlng = getEventCenter.call(this, event);

    // Look for country at that latitude/longitude
    var country = geo.search(latlng[0], latlng[1]);

    if (country !== null && country.code !== currentCountry) {
    // get the http request

      // Track the current country displayed
      // country.code = country name
     var currentCountry = country.code;
      // var currentCountry = country.code
    // console.log(currentCountry.toUpperCase())
      // Update the html
      d3.select("#countryName").html(country.code);

// Key for NY Times article search: d0a67f8cd2d91129216492557155f0ce:5:74452603
      function getNews() {
           console.log(currentCountry.toUpperCase())
        $.get('http://api.nytimes.com/svc/search/v2/articlesearch.json?[q=new+york+times&fq=glocations:("'+ currentCountry.toUpperCase() +'")&api-key=d0a67f8cd2d91129216492557155f0ce:5:74452603')
        .then(function(data){
          // console.log(currentCountry.toUpperCase())
          d3.select("#countryNews").html(JSON.stringify(data.response.docs));
        })
      }

       // Overlay the selected country with yellow color
      map = textureCache(country.code, '#CDC290');
      material = new THREE.MeshPhongMaterial({map: map, transparent: true});
      if (!countryProjection) {
        // push the country above the atmosphere
        countryProjection = new THREE.Mesh(new THREE.SphereGeometry(201, 40, 40), material);
        countryProjection.rotation.y = Math.PI;
        root.add(countryProjection);
      } else {
        countryProjection.material = material;
      }
    }



  }

  setEvents(camera, [baseGlobe], 'click');
  setEvents(camera, [baseGlobe], 'mousemove');

  var rotate = false
  function animate() {
    //get clouds to rotate
    clouds.rotation.z += -0.0007
    requestAnimationFrame(animate);

    if (rotate) {
      root.rotation.y += 0.002
      $('#stopRotation').css('background-image','url(../assets/radio-button-pause.png)');
    } else {
      $('#stopRotation').css('background-image','url(../assets/radio-button-play.png)');
    }
    // baseMap.rotation.x += 0.1
    // add control panel for rotation, toggle rotation
    $('#stopRotation').click(function(){
          rotate = !rotate
    });
  // toggle button

    renderer.render(scene, camera);
  }

  animate();

})


