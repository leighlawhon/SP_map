import * as d3 from 'd3';
import * as d3Projection from 'd3-geo-projection';
import { each } from 'lodash';

require('../css/map.scss');

//Width and height of map
const width = 960;
const height = 500;

// D3 Projection
const projection = d3Projection.geoWinkel3().translate([
  width / 2,
  height / 2
]) // translate to center of screen
  .scale([150]); // scale things down so see entire US
  // Define path generator
const path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
  .projection(projection); // tell path generator to use albersUsa projection

// Define linear scale for output
const color = d3
  .scaleLinear()
  .range(["rgb(213,222,217)", "rgb(69,173,168)", "rgb(84,36,55)", "rgb(217,91,67)"]);

const legendText = ["Cities Lived", "States Lived", "States Visited", "Nada"];

//Create SVG element and append map to the SVG
const svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Append Div for tooltip to SVG
const div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip").style("opacity", 0);

// Load in the SP 2017 data
d3.csv("2017map.csv", function(spi) {
  color.domain([0,1,2,3]); // setting the range of the input data
  // Load GeoJSON data and merge with states data
  d3.json("countries.geo.json", function(country) {
    console.log(country, spi);
    // Loop through each country
    // Bind the data to the SVG and create one path per GeoJSON feature
    svg.selectAll("path")
      .data(country.features)
      .enter()
      .append("path")
      .attr("d", path)
      .style("stroke", "#fff")
      .style("stroke-width", "1")
      .style("fill", function(d) {
        // Get data value
        // const value = d.properties.visited;
        // if (value) {
        //   //If value exists…
        //   return color(value);
        // } else {
        //   //If value is undefined…
        //   return "rgb(213,222,217)";
        // }
      });
  });
});
