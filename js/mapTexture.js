import THREE from 'THREE';
import d3 from 'd3';

var projection = d3.geo.equirectangular()
  .translate([1024, 512])
  .scale(325);

export function mapTexture(geojson, color) {
  var texture, context, canvas;

  canvas = d3.select("body").append("canvas")
    .style("display", "none")
    .attr("width", "2048px")
    .attr("height", "1024px");

  context = canvas.node().getContext("2d");

  var path = d3.geo.path()
    .projection(projection)
    .context(context);

  //grey lines
  context.strokeStyle = "#333";
  context.lineWidth = 0.5;
  //light grey fill
  // context.fillStyle = "#CDB380";
  //set 2 colors, one for overlay (main.js) and one for baseMap
  context.fillStyle = color || "#CDB380";

  context.beginPath();

  path(geojson);

  if (color) {
    context.fill();
  }

  context.stroke();

  texture = new THREE.Texture(canvas.node());
  texture.needsUpdate = true;

  canvas.remove();

  return texture;
}
