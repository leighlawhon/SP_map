require('../css/map.scss');

import * as d3 from 'd3';
import * as d3Projection from 'd3-geo-projection';
import { forEach, find, last, findKey } from 'lodash';

//Width and height of map
const width = 960;
const height = 500;

// D3 Projection
const projection = d3Projection.geoWinkel3().translate([
  width / 2,
  height / 2
]) // translate to center of screen
  .scale([150]); // scale things down so see entire globe
  // Define path generator
const path = d3.geoPath()
  .projection(projection);

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

Promise
  .all(['countries.geo.json', '2017map.csv']
    .map((url) =>{
      return fetch(url)
        .then(function(response) {
          if(response.ok){
            switch (last(response.url.split('.'))) {
              case 'csv':
                return response.text();
                break;
              case 'json':
                return response.json();
                break;
              default:
                response.text();
            }
          }else{
            return Promise.reject(response.status)
          }
      })
    })
  )
  .then(res => {
    const spiJSON = csvJSON(res[1]);
    drawMap(spiJSON, res[0]);
  })

function drawMap (spi, countries) {
  const spiData = spi;
  var graticule = d3.geoGraticule();
  svg.append('path')
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);
  svg.selectAll("path")
    .data(countries.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("stroke", "#fff")
    .style("stroke-width", "1")
    .attr("class", (d) => {
      const spiCountry = spiData[d.properties.name.toLowerCase()];
      if(spiCountry) {
         return spiCountry.tier.replace(/\s/g, '_').toLowerCase()
      }else{
        const softMatch = countryNameMatch(spiData, d.properties.name.toLowerCase());
        if (softMatch) {
          return 'soft_match'
        }
        return 'incomplete'
      }
  });
}
function csvJSON(csv){
  const lines=csv.split("\n");
  const result = {};
  const headers=lines[0].split(",");
  const bodylines = lines;
  bodylines.shift()
  forEach(bodylines, (line) => {
    const obj = {};
	  const currentline=line.split(",");
	  forEach(headers,(header, i) => {
		  obj[header] = currentline[i] ;
	  });
    result[currentline[0].toLowerCase()] = obj;
  });
  return result; //JSON
}
function countryNameMatch(spiData, country) {
  return findKey(spiData, (i) => {
    return country.includes(i.country.toLowerCase());
  })
}
