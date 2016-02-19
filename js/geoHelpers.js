//export functions with returns into main.js, be sure to import

export function selectPoint(event) {
  // at this point, the position of your mouse movement over 3 points is equal to a 3 vectors in the vector form (x,y,z)
  // set a, b & c equal to this "movement"
  let a = this.geometry.vertices[event.face.a];
  let b = this.geometry.vertices[event.face.b];
  let c = this.geometry.vertices[event.face.c];

  // Average them together as a point
  let point = {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
    z: (a.z + b.z + c.z) / 3
  };
  return point;
}

//this function resets the center of the map to the clicked country
//it also returns latitude and longitude of your clicked point, converting this vector point to the projected latitude longitude on the map
export function getEventCenter(event, radius) {
// variable radius
  radius = radius || 200;

// recall that the .call operation takes the (context, arg1, arg2)
  var point = selectPoint.call(this, event);

  var latRads = Math.acos(point.y / radius);
  var lngRads = Math.atan2(point.z, point.x);
  var lat = (Math.PI / 2 - latRads) * (180 / Math.PI);
  var lng = (Math.PI - lngRads) * (180 / Math.PI);
  // console.log(lat)
  // console.log(lng-180)
  return [lat, lng - 180];
}

//convert latitude and longitude of your selected country to (x,y,z) coordinates
export function convertToXYZ(point, radius) {
  radius = radius || 200;

  var latRads = ( 90 - point[0]) * Math.PI / 180;
  var lngRads = (180 - point[1]) * Math.PI / 180;

  var x = radius * Math.sin(latRads) * Math.cos(lngRads);
  var y = radius * Math.cos(latRads);
  var z = radius * Math.sin(latRads) * Math.sin(lngRads);

  return {x: x, y: y, z: z};
}


//how to find if a point lies inside of a polygon
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
var pointInPolygon = function(poly, point) {

  let x = point[0];
  let y = point[1];

  let inside = false, xi, xj, yi, yj, xk;

  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    xi = poly[i][0];
    yi = poly[i][1];
    xj = poly[j][0];
    yj = poly[j][1];

    xk = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (xk) {
       inside = !inside;
    }
  }

  return inside;
};

//find match in world.json file !
export var geodecoder = function (features) {

  let store = {};

  for (let i = 0; i < features.length; i++) {
    store[features[i].id] = features[i];
  }

  return {
    find: function (id) {
      return store[id];
    },
    search: function (lat, lng) {
 //set match default to false
      let match = false;
 //declare country,coords
      let country, coords;

      for (let i = 0; i < features.length; i++) {
        //loop through the array of world.json
        country = features[i];
        if(country.geometry.type === 'Polygon') {
          //if country is one entity, return info
          match = pointInPolygon(country.geometry.coordinates[0], [lng, lat]);
          if (match) {
            return {
              code: features[i].id,
              name: features[i].properties.name
            };
          }
          //other case: if country is multiple entities/territories
        } else if (country.geometry.type === 'MultiPolygon') {
          coords = country.geometry.coordinates;
          for (let j = 0; j < coords.length; j++) {
            match = pointInPolygon(coords[j][0], [lng, lat]);
            if (match) {
              return {
                code: features[i].id,
                name: features[i].properties.name
              };
            }
          }
        }
      }

      return null;
    }
  };
};

