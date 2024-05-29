async function loadLeAcChart() 
{
    const width = 1000;
    const height = 500;
    const margin = 30;

    // Create the initial document, with headers and shit
    const section = d3.select("#life-expectency-and-alcohol-consumption");

    const countriesSection = section.append("section")
    countriesSection.append("h1").text("Countries")
    const countriesRadioBtnList = countriesSection.append("div")
        // .attr("class", "")

    const svg = section.append("svg").attr("width", width).attr("height", height)

    const legendSection = section.append("section")
    legendSection.append("h1").text("Legend")

    // Get the data
    index = 0;
    const data = await d3.csv("../data/le_and_ac.csv", (d) => {
        return {
            "id": ++index,
            "timePeriod": new Date(d.time_period, 1, 1),
            "refAreaName": d.name,
            "refAreaCode": d.code,
            "alcoholConsumption": parseFloat(d.alcohol_consumption),
            "acIsEstimated": false,
            "lifeExpectency": parseFloat(d.life_expectency),
            "lifeExpIsEstimated": false
        }
    })

    // Now that we have the data, you'll notice some nulled values. If the values that are nulled are to the 
    // left/right of the dataset (do not intersect in the middle), we want to calculate the trendline 
    // between them, and use that formula to extraplotae the correct values. However, if there are some
    // values missing IN BETWEEN the dataset, I.e, 2012 = 76, 2013 = 77, 2014 = null, 2015 = 77, we just
    // simply linearly interploate between them.


    // Group the data and automatically select "AUS" for first selection
    const groupedData = d3.group(data, (d) => d.refAreaCode)
    let selectedCountry = groupedData.get("NZL")

    // Get the scales for each axis
    const xAxisScale = getXAxisScale(width, margin, data)
    const yAxisScale_lifeExpectency = getYAxisScale_LifeExpectency(height, margin)
    const yAxisScale_alcoholConsumption = getYAxisScale_AlcoholConsumption(height, margin)

    // Insert all countries as radio buttons in the countriesSelection section
    const countriesRadioBtns = countriesRadioBtnList
        .selectAll("div")
        .data(groupedData)
        .enter()
        .append("div")

    countriesRadioBtns 
        .append("input")
        .attr("type", "radio")
        .attr("id", (d) => `le-ac-checks-${d[0].toLowerCase()}`) // Gets the lower case country code
        .attr("name", "le-ac-btn-group")
        .on("click", (event, d) => {

        })

    // I'm so sorry. "d" is a map of reference area codes to names, years, and alcohol consumption/life expectency. -
    // In order to get the full reference area name, we have to get d[1], which is the array of values, and
    // then get the first element in the array, thus d[1][0]. Then, we can finally get the refAreaName.
     countriesRadioBtns
        .append("label")
        .text((d) => d[1][0].refAreaName) 
        .attr("for", (d) => `le-ac-checks-${d[0].toLowerCase()}`)

    // Append axis lines
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin})`)
        .call(d3.axisBottom(xAxisScale))

    svg.append("g")
        .attr("transform", `translate(${margin}, 0)`)
        .call(d3.axisLeft(yAxisScale_lifeExpectency))

    svg.append("g")
        .attr("transform", `translate(${width - margin - margin - margin}, 0)`)
        .call(d3.axisRight(yAxisScale_alcoholConsumption))

    const alcoholConsumptionLine = d3.line()
        .x((d) => xAxisScale(d.timePeriod))
        .y((d) => yAxisScale_alcoholConsumption(+d.alcoholConsumption))
    svg.append("g").append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", alcoholConsumptionLine(selectedCountry))

    const lifeExpectencyLine = d3.line()
        .x((d) => xAxisScale(d.timePeriod))
        .y((d) => {
            const lifeExpectency =parseInt(d.lifeExpectency)
            console.log(lifeExpectency)
            const path = yAxisScale_lifeExpectency(lifeExpectency)
            if (path == NaN || path == null)
                return 10;
            else
                return path
        })
    svg.append("g").append("path")
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "blue")
        .attr("stroke-width", 1.5)
        .attr("d", lifeExpectencyLine(selectedCountry))

}

function getXAxisScale(width, margin, data) {
    const min = d3.min(data, (d) => d.timePeriod, 0, 1)
    const max = d3.max(data, (d) => d.timePeriod)
    return d3.scaleTime()
        .domain([min, max])
        .range([margin, width - margin - margin - margin]) // subtract margin twice, per y axis used, and once more for... uhhhhh
}

function getYAxisScale_LifeExpectency(height, margin) {
    return d3.scaleLinear()
        .domain([0, 100])
        .range([height - margin, margin])
}

function getYAxisScale_AlcoholConsumption(height, margin) {
    const min = 0 // Minimum is ~0.1 in the database
    const max = 18 // Max is 18 in the dataset
    return d3.scaleLinear()
        .domain([min, max])
        .range([height - margin, margin])
}
