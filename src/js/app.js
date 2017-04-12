require('../css/map.scss');

import * as d3 from 'd3';
import * as d3Projection from 'd3-geo-projection';
import { forEach, find, last, findKey, contains } from 'lodash';

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
  // soft match was done because the country names from the sahpe files didn't match the SPI names. I altered the country.geo.json to match SP. This should be checked again in the following years.
  let count_countries = 0,
    count_soft_match = 0,
    count_incomplete = 0;
  let tiers = {
    low: {
      countries : [],
      color: '#D5B276'
    },
    very_low: {
      countries : [],
      color: '#B97E1A'
    },
    high: {
      countries : [],
      color: '#2C6543'
    },
    very_high: {
      countries : [],
      color: '#B1CFBD'
    },
    upper_middle: {
      countries : [],
      color: '#819498'
    },
    lower_middle: {
      countries : [],
      color: '#2D4D53'
    }
  }

function drawMap (spi, countries) {
  const spiData = spi;
  // uncomment if you want lat long lines
  // var graticule = d3.geoGraticule();
  // svg.append('path')
  //   .datum(graticule)
  //   .attr("class", "graticule")
  //   .attr("d", path);

  // used to check that nothing is missed
  let soft_match_list = [];
  svg.selectAll("path")
    .data(countries.features)
    .enter()
    .append("path")
    .attr("d", path)
    .style("stroke", "#fff")
    .style("stroke-width", "1")
    .style("fill", (d) => {
      const d_country = d.properties.name.replace(/\s/gi, '_').toLowerCase();
      const spiCountry = spiData[d_country];
      if(spiCountry) {
        count_countries++;
        const tier = spiCountry.tier.replace(/\s/g, '_').toLowerCase();
        if(tiers[tier].countries){
          tiers[tier].countries.push(spiCountry.country);
        }
        return tiers[tier].color
      }else{
        const softMatch = countryNameMatch(spiData, d_country);
        if (softMatch) {
          count_soft_match++;
          soft_match_list.push(d_country);
          return '#ccc'
        }
        count_incomplete++;
        return '#ccc'
      }
    })
    .attr("class", (d) => {
      const d_country = d.properties.name.replace(/\s/gi, '_').toLowerCase();
      const spiCountry = spiData[d_country];
      if(spiCountry) {
        count_countries++;
        const tier = spiCountry.tier.replace(/\s/g, '_').toLowerCase();
        if(tiers[tier].countries){
          tiers[tier].countries.push(spiCountry.country);
        }
        return tier
      }else{
        const softMatch = countryNameMatch(spiData, d_country);
        if (softMatch) {
          count_soft_match++;
          soft_match_list.push(d_country);
          return 'soft_match'
        }
        count_incomplete++;
        return 'incomplete'
      }
    })

    .call( () => {
      // counts are done to check the accuracy of the map
      console.log(count_countries, "matched");
      console.log(count_soft_match, "soft match");
      console.log(soft_match_list, "soft match list");
      console.log(count_incomplete, "incomplete");
      console.log(tiers);
      console.log(spiData);
    })
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
    const spi_country = currentline[0].toLowerCase().replace(/ /gi, '_');
    // console.log(spi_country());
    if (spi_country) result[spi_country] = obj;

  });

  return result; //JSON
}
function countryNameMatch(spiData, country) {
  return findKey(spiData, (i) => {
    if(i.country !== country){
      return country.includes(i.country);
    }
  })
}
