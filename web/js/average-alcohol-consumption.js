
async function loadAverageAlcoholConsumptionChart()
{
    const width = 1000;
    const height = 600;
    
    const section = d3.select("#avg-alcohol-consumption")
    section.append("h1").text("Average alcohol consumption in the world")
    section.append("p").html("Alcohol consumption of everyone aged above 15 years old, measured in <em>litres per capita</em>. Hover over map for exact value.")

    const svg = section.append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height)

    const data = await d3.csv("./data/average-alcohol-consumption.csv", (d) =>     {
        return {
            ref_area_code: d.ref_area_code,
            avg_obs_value: parseFloat(d.avg_obs_value)
        }
    });

    const max = d3.max(data, (d) => Math.ceil(d.avg_obs_value))
    const min = d3.min(data, (d) => Math.ceil(d.avg_obs_value))

    // Get a map of country codes => alcohol consumption for better performance
    let countryToACMap = { }
    for (let i = 0; i < data.length; i++) {
        countryToACMap[data[i].ref_area_code] = data[i].avg_obs_value;
    }

    // Stolen shamelessly from https://d3-graph-gallery.com/graph/choropleth_basic.html
    const projection = d3.geoMercator()
        .scale(120)
        .center([0,20])
        .translate([width / 2, height / 2]);

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("visibility", "hidden")
        .html("<p>I am a tooltip</p>")

    // Data and colour scale
    const colourScale = d3.scaleLinear()
        .domain([min, max])
        .range(["#f8d4f9", "purple"])

    // Creating legend on top left of map
    const legendGradientDef = svg.append("defs")
    const legendGradient = legendGradientDef.append("linearGradient")
        .attr("id", "map-gradient")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", 1)

    legendGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colourScale(min))

    legendGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colourScale(max))

    const legend = svg.append("g")
        .attr("transform", "translate(10, 10)")

    legend.append("rect")
        .attr("stroke", "black")
        .style("fill", "url(#map-gradient")  
        .attr("width", 20)
        .attr("height", 120)

    legend.append("rect")
        .attr("stroke", "black")
        .style("fill", "whitesmoke")
        .attr("width", 20)
        .attr("height", 20)
        .attr("transform", "translate(0, 140)")

    legend.append("text")
        .text("Least")
        .attr("transform", "translate(25, 12.5)")
    legend.append("text")
        .text("Most")
        .attr("transform", "translate(25, 120)")
    legend.append("text")
        .text("N/A")
        .attr("transform", "translate(25, 155)")

    // Creating the map and assigning colours
    const mapPathData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    svg.append("g")
        .selectAll("path")
        .data(mapPathData.features)
        .join("path")
        .attr("id", (d) => `map-path-${d.id.toLowerCase()}`)
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", (d) => getMapColour(countryToACMap, d, colourScale))
        .attr("stroke", "black")
        .attr("stroke-width", "0.5px")
        .on("mouseover", (event, d) => {
            updateTooltip(tooltip, countryToACMap, d)
            hoverOverMap(svg, d.id)
        })
        .on("mousemove", (event, d) => {

            tooltip.style("top", (event.pageY - 40)+"px").style("left", (event.pageX+30)+"px")
        })
        .on("mouseout", (event, d) => { 
            tooltip.style("visibility", "hidden")
            hoverOverMap_finish(svg, d.id)
        })
}

/**
 * Highlights the <path> attribute, with the id of "map-path-countryId" with black, and a stroke width of
 * 2px
 */
function hoverOverMap(svg, countryId) {
    svg.select(`#map-path-${countryId.toLowerCase()}`)
        .transition()
        .duration(100)
        .attr("stroke", "black")
        .attr("stroke-width", "2px")
}

/**
 * Returns the <path> attribute with the id of "map-path-countryId" with black, and a stroke width of 0.5px
 */
function hoverOverMap_finish(svg, countryId) {
    svg.select(`#map-path-${countryId.toLowerCase()}`)
        .transition()
        .duration(100)
        .attr("stroke", "black")
        .attr("stroke-width", "0.5px")
}

/**
 * If d.id is inside of the dataset map, it will return the colour after being processed by the scale Otherwise
 * it will simply return "whitesmoke"
 */
function getMapColour(dataset, d, scale) {
    if (d.id in dataset) 
        return scale(dataset[d.id])
    else
        return "whitesmoke";
}

/**
 * Updates the tooltip based on what country is selected, d
 */
function updateTooltip(tooltip, dataset, selectedPoint) {
    let html;
    if(selectedPoint.id in dataset)
        html = `<p><strong>${selectedPoint.id}</strong></p><hr><p>Alcohol Consumption: ${dataset[selectedPoint.id].toFixed(3)}</p>`;
    else 
        html = `<p><strong>${selectedPoint.id}</strong></p><hr><p>Alcohol Consumption: No Data</p>`;
            
    tooltip.style("visibility", "visible").html(html)
}
