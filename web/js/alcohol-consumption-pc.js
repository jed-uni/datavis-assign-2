async function alcoholConsumptionOverTime()
{
    // Constant data for front end
    const width = 1000;
    const height = 400;
    const margin = 30;

    // Load the .csv file
    const csv = await d3.csv("../data/alcohol_consumption_total.csv", (d) => { return { 
        time_period: new Date(d.time_period, 0, 1), 
        obs_value: d.obs_value,
        ref_area_code: d.ref_area_code
    }})

    let selectedCountryCodes = [ ]  // Just a list of countyr codes that are selected

    const section = d3.select("#alcohol-consumption-pc")
    section.append("h1").text("Alcohol consumption per country, per year")
    section.append("p").text("As you can see, most, if not all countries have a steady alcohol consumption rate over the past 10 years. However, it must be noted that some countries have much higher consumption rates than others. It is fair to assume that we can simply find the average alcohol consumption rate per country to get a more readable comparison between each country")

    // Set up the SVG element
    const svg = section.append("svg")
        .attr("width", width)
        .attr("height", height)

    const groupedDataset = d3.group(csv, (d) => d.ref_area_code);

    const xScale = d3.scaleTime()
        .domain([d3.min(csv, (d) => d.time_period, 0, 1), d3.max(csv, (d) => d.time_period)])
        .range([margin, width - margin])

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(csv, (d) => +d.obs_value)])
        .range([height - margin, margin])

    // For each country, create a checkbox
    countryCheckboxes = section.append("div")
        .attr("id", "alcohol-consumption-pc-countries")
        .selectAll("div")
        .data(groupedDataset, (e) => e[0])
        .enter()
        .append("div")

    // When a checkbox is selected or descelected, update the svg accordingly
    countryCheckboxes
        .append("input")
        .attr("type", "checkbox")
        .on("click", (event, d) => { 
            let selected = event.target.checked;
            if (selected) {
                // Update selection with new country
                selectedCountryCodes.push(d[0])
            } else {
                selectedCountryCodes.pop(d[0]);
            }

            // fuck you javascript fuck you javascript fuck you javascript fuck you javascript fuck you javascript fuck you javascript 
            let filteredData = new Map([...groupedDataset].filter(([key, value]) => selectedCountryCodes.includes(key)));

            // Append line chart data 
            svg.selectAll(".line")
                .data(filteredData, (d) => d[0])
                .join("path")
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "slategray" )
                .attr("stroke-width", 1.5)
                .attr("d", (d) => {
                    // Create the line function for the specific country key, not outside before appending the line chart data
                    return d3.line()
                        .x((d) => xScale(d.time_period))
                        .y((d) => yScale(+d.obs_value))
                    (d[1])
                });
        })

    countryCheckboxes
        .append("label")
        .text(d => d[0])


    // CREATE INITIAL DATASET

    // Append axis lines
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin})`)
        .call(d3.axisBottom(xScale))

    svg.append("g")
        .attr("transform", `translate(${margin}, 0)`)
        .call(d3.axisLeft(yScale))

    svg.select(".line")
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", (d) => {
            // Create the line function for the specific country key, not outside before appending the line chart data
            return d3.line()
                .x((d) => xScale(d.time_period))
                .y((d) => yScale(+d.obs_value))
            (d[1])
        });
}

// Updates the line chart with the new dataset
function updateLineChart(svg, fullDataset, selectedDataset)
{
    // Create the scales
    const xScale = d3.scaleTime()
        .domain([d3.min(fullDataset, (d) => d.time_period, 0, 1), d3.max(fullDataset, (d) => d.time_period)])
        .range([margin, width - margin])

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(fullDataset, (d) => +d.obs_value)])
        .range([height - margin, margin])

    // Append axis lines
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin})`)
        .call(d3.axisBottom(xScale))

    svg.append("g")
        .attr("transform", `translate(${margin}, 0)`)
        .call(d3.axisLeft(yScale))

    // Append line chart data 
    svg.selectAll(".line")
        .data(selectedDataset)
        .join("path")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", (d) => {
            // Create the line function for the specific country key, not outside before appending the line chart data
            return d3.line()
                .x((d) => xScale(d.time_period))
                .y((d) => yScale(+d.obs_value))
            (d[1])
        });
}
