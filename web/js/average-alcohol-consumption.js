
async function loadAverageAlcoholConsumptionChart()
{
    const width = 1000;
    const height = 600;
    const margin = 30;

    
    const section = d3.select("#avg-alcohol-consumption")
    section.append("h1").text("Average alcohol consumption in the world")
    section.append("p").html("<strong>Editors note:</strong> can you add a slider here to move between different years? If you are willing to, you should get rid of the line chart above")

    const svg = section.append("svg")
        .attr("width", width)
        .attr("height", height)

    const data = await d3.csv("./data/average-alcohol-consumption.csv", (d) =>     {
        return {
            ref_area_code: d.ref_area_code,
            avg_obs_value: parseFloat(d.avg_obs_value) // FUUCK YOU JAVASCRIPT
        }
    });
    const max = d3.max(data, (d) => Math.ceil(d.avg_obs_value))
    const min = d3.min(data, (d) => Math.ceil(d.avg_obs_value))

    let countryToDataRel = { }
    for (let i = 0; i < data.length; i++) {
        countryToDataRel[data[i].ref_area_code] = data[i].avg_obs_value;
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
        .html("<p>I am a tooltip</p>")

    // Data and colour scale
    const colourScale = d3.scaleLinear()
        .domain([min, max])
        .range(["white", "purple"])

    // Creating the map and assigning colours
    const mapPathData = await d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")

    svg.append("g")
        .selectAll("path")
        .data(mapPathData.features)
        .join("path")
        .attr("d", d3.geoPath().projection(projection))
        .attr("fill", (d) => {
            if (d.id in countryToDataRel) 
                return colourScale(countryToDataRel[d.id])
            else
                return "whitesmoke";
        })
        .on("mouseover", (event, d) => {
            let html;
            if(d.id in countryToDataRel)
                html = `<p><strong>${d.id}</strong></p><hr><p>Alcohol Consumption: ${countryToDataRel[d.id].toFixed(3)}</p>`;
            else 
                html = `<p><strong>${d.id}</strong></p><hr><p>Alcohol Consumption: No Data</p>`;
                    
            tooltip.style("visibility", "visible").html(html)

        })
        .on("mousemove", () => tooltip.style("top", (event.pageY - 40)+"px").style("left", (event.pageX+30)+"px")) 
        .on("mouseleave", () => tooltip.style("visibility", "hidden"))
}

