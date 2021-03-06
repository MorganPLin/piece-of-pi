import { scene, camera, renderer } from './scene';
import { setEvents } from './setEvents';
import { convertToXYZ, getEventCenter, geodecoder } from './geoHelpers';
import { mapTexture } from './mapTexture';
import { memoize } from './utils';
// grabbed from ES6 modules defined in index.html
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
  let sphere = new THREE.SphereGeometry(130, 200, 200);

  let baseGlobe = new THREE.Mesh(sphere, blueMaterial);

  //Math.PI=3.14....
  // rotate by half a circle to reorient
  baseGlobe.rotation.y = Math.PI;
  baseGlobe.addEventListener('click', onGlobeClick);
  baseGlobe.addEventListener('mousemove', onGlobeMousemove);
  // baseGlobe.addEventListener('mouseup', onMouseUp);
  // baseGlobe.addEventListener('mouseout', onMouseOut);

  // add base map layer with all countries
  let worldTexture = mapTexture(countries, '#647089');
  let mapMaterial  = new THREE.MeshPhongMaterial({map: worldTexture, transparent: true});

  //make sure sphere size is same as previous sphere, borrow measurments from above
  var baseMap = new THREE.Mesh(sphere, mapMaterial);
  var clouds = new THREE.Mesh(
    new THREE.SphereGeometry(134, 200, 200),
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

    // Get new camera position ie render a new shape
    var temp = new THREE.Mesh();

    console.log(latlng)
    // recenter that to be on the country
    temp.position.copy(convertToXYZ(latlng, 900));
    temp.lookAt(root.position);

    // temp.rotateY(Math.PI);
    // update control panel with lat and longitude of hover
     var country = geo.search(latlng[0], latlng[1]);
      if (country !== null && country.code !== currentCountry) {

      var currentCountry = country.code;
      // change the news
      d3.select("#countryName").html(country.code);
      // Key for NY Times article search: d0a67f8cd2d91129216492557155f0ce:5:74452603
      function getNews() {
        var selectCountry = currentCountry.toUpperCase()

           // console.log(currentCountry.toUpperCase())
        $.get('http://api.nytimes.com/svc/search/v2/articlesearch.json?[q=new+york+times&fq=glocations:("'+selectCountry+'")&api-key=d0a67f8cd2d91129216492557155f0ce:5:74452603')
        .then(function(data){
          console.log(JSON.stringify(data.response.docs[0]))
          d3.select("#countryNews").html(JSON.stringify(data.response.docs[0].headline.main));
          var imageUrl = 'http://static01.nyt.com/' + JSON.stringify(data.response.docs[0].multimedia[1].url).replace('"','').replace('"','');
          console.log(imageUrl.toString())

          d3.select('#countryImg').style('background-image','url(' + imageUrl + ')');

        })
      }
      getNews();
    }
  }
// var mouseOnDown = {x:0,y:0};
// var mouse = {x: 0, y: 0};
// var distance = 100, distanceTarget = 100;
// var target = {
//         x: Math.PI * 3 / 2,
//         y: Math.PI / 6.0
//     },
//     targetOnDown = {
//         x: 0,
//         y: 0
//     };
// var PI_HALF = Math.PI / 2;
// function onMouseDown(event) {

//     var el = document.querySelectorAll('.hide');
//     for (var j = 0; j < el.length; j++) {
//         el[j].style.opacity = 0;
//         el[j].style.pointerEvents = 'none';
//     }
//     event.preventDefault();

//     mouseOnDown.x = -event.clientX;
//     mouseOnDown.y = event.clientY;

//     targetOnDown.x = target.x;
//     targetOnDown.y = target.y;

//     baseGlobe.style.cursor = 'move';
// }


// function onMouseMove(event) {
//     mouse.x = -event.clientX;
//     mouse.y = event.clientY;

//     var zoomDamp = distance / 1000;

//     target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
//     target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

//     target.y = target.y > PI_HALF ? PI_HALF : target.y;
//     target.y = target.y < -PI_HALF ? -PI_HALF : target.y;
// }

// function onMouseUp(event) {
//     var el = document.querySelectorAll('.hide');
//     for (var j = 0; j < el.length; j++) {
//         el[j].style.opacity = 1;
//         el[j].style.pointerEvents = 'auto';
//     }
//     baseGlobe.removeEventListener('mousemove', onMouseMove, false);
//     baseGlobe.removeEventListener('mouseup', onMouseUp, false);
//     baseGlobe.removeEventListener('mouseout', onMouseOut, false);
// }

// function onMouseOut(event) {
//     baseGlobe.removeEventListener('mousemove', onMouseMove, false);
//     baseGlobe.removeEventListener('mouseup', onMouseUp, false);
//     baseGlobe.removeEventListener('mouseout', onMouseOut, false);
// }

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
      // Update the html of the control panel:
      d3.select("#hoverCountry").html(country.code);
      var latitude = latlng[0].toString().split('').splice(0,5).join('')
      var longitude = latlng[0].toString().split('').splice(0,5).join('')
      d3.select("#lat-display").html(latitude);
      d3.select("#long-display").html(longitude);

       // Overlay the selected country with yellow color
      map = textureCache(country.code, '#CDC290');
      // must allow transparent to see globe underneath
      material = new THREE.MeshPhongMaterial({map: map, transparent: true});
      if (!countryProjection) {
        // push the country above the atmosphere
        countryProjection = new THREE.Mesh(new THREE.SphereGeometry(180, 40, 40), material);
        countryProjection.rotation.y = Math.PI;
        root.add(countryProjection);
      } else {
        countryProjection.material = material;
      }
    }

  }

  setEvents(camera, [baseGlobe], 'click');
  setEvents(camera, [baseGlobe], 'mousemove');
  setEvents(camera, [baseGlobe], 'mouseup');
  setEvents(camera, [baseGlobe], 'mouseout');

  var rotate = false
  function animate() {
    requestAnimationFrame(animate);
    //get clouds to rotate
    var speed;

    d3.select('#slide').on("input", function() {
         speed = (+this.value/1000)
         var speedString = speed.toString()
         d3.select('h3').html(speedString)
         root.rotation.y = speed

     });

    clouds.rotation.z += -0.0007

    // function rotate(speed) {
    if (rotate) {
      root.rotation.y += 0.002
      $('#stopRotation').css('background-image','url(../assets/radio-button-pause.png)');
    } else {
      $('#stopRotation').css('background-image','url(../assets/radio-button-play.png)');
    }
   // }
   // rotate(rotationSpeed)
    // baseMap.rotation.x += 0.1
    // add control panel for rotation, toggle rotation

     $('#stopRotation').click(function(){
          rotate = !rotate
      });

    renderer.render(scene, camera);
  // toggle button
  }

  animate();

});


