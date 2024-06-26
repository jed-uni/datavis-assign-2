// After making this dataSwitchSection part, I realised something... something I should have done a very long time ago
// All I'm doing here is making a line chart based on multiple variables...
// Why do I have to do everything *twice*?
// The two Y axis scales are both the same, the lines are the same, the only thing that differs is the variable
// I could just pass through functions into something like a 'lineGenerator()' function, as such:
//      `svg.append(lineGenerator(data, (d) => d.lifeExpectency))`

async function loadLeAcChart() 
{
    const width = 1000;
    const height = 500;
    const margin = 50;

    // Create the initial document, with headers and shit
    const section = d3.select("#life-expectency-and-alcohol-consumption");
    section.append("h1").text("Alcohol consumption (litres per person) and life expectency over time")
    const chartSection = section.append("div").style("display", "flex")
    
    // Add legend, data selection, and countries list
    const sidebarDiv = chartSection.append("div").attr("class", "scroll-bar")

    createLegend(sidebarDiv)
    const [leSwitch, acSwitch] = createDataSwitches(sidebarDiv)
    let leSwitchEnabled = true
    let acSwitchEnabled = true

    const countriesSection = sidebarDiv.append("section")
    countriesSection.append("h1").text("Countries")
    const countriesRadioBtnList = countriesSection.append("div")

    const svg = chartSection.append("svg").attr("width", width).attr("height", height)

    // Add actual x-axis labels (as in the actual label, not each indvidiual X/Y axis increment label)
    // https://stackoverflow.com/a/11194968
    svg.append("text")
        .attr("x", width / 2.5)
        .attr("y", height - 20)
        .text("Year")

    svg.append("text")
        .attr('text-anchor', 'end')
        .attr("transform", "rotate(-90)")
        .attr("x", -width / 5.5) // Want to know why I divide by 9? Fuck you. Thats why. Fucking D3 being fucking awful fuck d3 to hell
        .attr("y", 20)
        .text("Life Expectancy")

    svg.append("text")
        .attr('text-anchor', 'start')
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 1.333) // Want to know why I divide by 9? Fuck you. Thats why. Fucking D3 being fucking awful fuck d3 to hell
        .attr("y", width - 115)
        .text("Litres of alcohol consumed per person")

    // Get the data
    index = 0;
    const data = await d3.csv("assets/le_and_ac.csv", (d) => {
        return {
            "id": ++index,
            "timePeriod": new Date(d.time_period, 0, 0),
            "refAreaName": d.name,
            "refAreaCode": d.code,
            "alcoholConsumption": d.alcohol_consumption == "" ? null : parseFloat(d.alcohol_consumption),
            "acIsEstimated": false,
            "lifeExpectency": d.life_expectency == "" ? null : parseFloat(d.life_expectency),
            "lifeExpIsEstimated": false // We'll calculate this value elsewhere
        }
    })

    // Now that we have the data, you'll notice some nulled values. If the values that are nulled are to the 
    // left/right of the dataset (do not intersect in the middle), we want to calculate the trendline 
    // between them, and use that formula to extraplotae the correct values. However, if there are some
    // values missing IN BETWEEN the dataset, I.e, 2012 = 76, 2013 = 77, 2014 = null, 2015 = 77, we just
    // simply linearly interploate between them.

    // Group the data and automatically select "AUS" for first selection
    const groupedData = d3.group(data, (d) => d.refAreaCode)
    let selectedCountry = groupedData.get("RUS")
    fillMissingData(selectedCountry, "lifeExpectency", "leIsEstimated")
    fillMissingData(selectedCountry, "alcoholConsumption", "acIsEstimated")

    // Get the scales for each axis
    const xAxisScale = getXAxisScale(width, margin, data)
    const yAxisScale_lifeExpectency = getYAxisScale_LifeExpectency(height, margin)
    const yAxisScale_alcoholConsumption = getYAxisScale_AlcoholConsumption(height, margin)

    // Construct the area chart functions
    const alcoholConsumptionLine = d3.area()
        .x((d) => xAxisScale(d.timePeriod))
        .y0(yAxisScale_alcoholConsumption(0))
        .y1((d) => yAxisScale_alcoholConsumption(d.alcoholConsumption))

    const lifeExpectencyLine = d3.area()
        .x((d) => xAxisScale(d.timePeriod))
        .y0(yAxisScale_lifeExpectency(60)) // This has to be set to 50 as it is the minimum value for this chart, otherwise it clips underneath the axis
        .y1((d) => yAxisScale_lifeExpectency(d.lifeExpectency))

    const zeroedLine = d3.area()
        .x((d) => xAxisScale(d.timePeriod))
        .y0(yAxisScale_alcoholConsumption(0))
        .y1(yAxisScale_alcoholConsumption(0))

    // Insert all countries as radio buttons in the countriesSelection section
    const countriesRadioBtns = countriesRadioBtnList
        .selectAll("div")
        .data(groupedData)
        .enter()
        .append("div")

    // Tell each radio button to update the chart with the selected country
    countriesRadioBtns 
        .append("input")
        .attr("type", "radio")
        .attr("id", (d) => `le-ac-checks-${d[0].toLowerCase()}`) // Gets the lower case country code
        .attr("name", "le-ac-btn-group")
        .on("click", (event, d) => {
            const newCountryCode = d[0]
            if (!newCountryCode in groupedData) {
                console.warn(`Country code '${newCountryCode}' has no associated data. Skipping`)
                return
            }
            selectedCountry = groupedData.get(newCountryCode)
            fillMissingData(selectedCountry, "lifeExpectency", "leIsEstimated")
            fillMissingData(selectedCountry, "alcoholConsumption", "acIsEstimated")

        if (acSwitchEnabled) 
            acPathContainer.selectAll("path")
                .datum(selectedCountry)
                .join()
                .attr("class", "line")
                .attr("stroke", "red")
                .attr("stroke-width", 1.5)
                .transition()
                .duration(400)
                .ease(d3.easeExpOut)
                .attr("d", alcoholConsumptionLine(selectedCountry))
        if (leSwitchEnabled) 
            lePathContainer.selectAll("path")
                .datum(selectedCountry)
                .join()
                .attr("class", "line")
                .attr("stroke", "blue")
                .attr("stroke-width", 1.5)
                .transition()
                .duration(400)
                .ease(d3.easeExpOut)
                .attr("d", lifeExpectencyLine(selectedCountry))
        })

    // Tell each checkbox to remove certain values when checked/unchecked
    acSwitch.on("change", (event, d) => {
        const checked = event.target.checked;
        
        if (checked) {
            acSwitchEnabled = true
            acPathContainer.selectAll("path")
                .datum(selectedCountry)
                .join()
                .transition()
                .duration(500)
                .ease(d3.easeExpOut)
                .attr("d", alcoholConsumptionLine(selectedCountry))
        } else {
            acSwitchEnabled = false
            acPathContainer.selectAll("path")
                .datum(selectedCountry)
                .join()
                .transition()
                .duration(500)
                .ease(d3.easeExpOut)
                .attr("d", zeroedLine(selectedCountry))
        }
    })
    leSwitch.on("change", (event, d) => {
        const checked = event.target.checked;
        
        if (checked) {
            leSwitchEnabled = true
            lePathContainer.selectAll("path")
                .datum(selectedCountry)
                .join()
                .transition()
                .duration(500)
                .ease(d3.easeExpOut)
                .attr("d", lifeExpectencyLine(selectedCountry))
        } else {
            leSwitchEnabled = false
            lePathContainer.selectAll("path")
                .datum(selectedCountry)
                .join()
                .transition()
                .duration(500)
                .ease(d3.easeExpOut)
                .attr("d", zeroedLine(selectedCountry))
        }
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
        .attr("class", "grid")
        .attr("transform", `translate(0, ${height - margin})`)
        .call(d3.axisBottom(xAxisScale).tickSize(-height, 0, 0))

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${margin}, 0)`)
        .call(d3.axisLeft(yAxisScale_lifeExpectency).ticks(20))

    svg.append("g")
        .attr("class", "grid")
        .attr("transform", `translate(${width - margin - margin - margin}, 0)`)
        .call(d3.axisRight(yAxisScale_alcoholConsumption).ticks(20).tickSize(-width + 4 * margin, 0, 0))

    // These are the containers that will contain the path objects for their respective data points
    const acPathContainer = svg.append("g")
    const lePathContainer = svg.append("g")
    acPathContainer.append("path")
        .datum(selectedCountry)
        .attr("class", "line")
        .attr("fill", "rgba(255, 0, 0, 0.1)")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("z-index", 2)
        .attr("d", alcoholConsumptionLine(selectedCountry))

    lePathContainer.append("path")
        .datum(selectedCountry)
        .attr("class", "line")
        .attr("stroke", "blue")
        .attr("fill", "rgba(0, 0, 255, 0.1)")
        .attr("stroke-width", 1.5)
        .attr("z-index", 1)
        .attr("d", lifeExpectencyLine(selectedCountry))

    const tooltip = d3.select("#tooltip") // I know, bad idea, but this is created in another function... ugly, right?

    // Create Tooltips
    // x axis tooltip will contain <rect>, with <line> on right side to clearly show which point is being highlighted
    const barWidth = xAxisScale(selectedCountry[1].timePeriod) - xAxisScale(selectedCountry[0].timePeriod)
    const xAxisTooltip = svg.append("g")
        .style("x", 0)
        .style("y", 0) // Will always be 0 or margin
        
    xAxisTooltip.append("rect")
        .style("fill", "rgba(50, 50, 50, 0.2)")
        .style("width", barWidth)
        .style("height", height - margin)

    xAxisTooltip.append("line") 
        .style("fill", "none")
        .style("stroke", "black")
        .style("stroke-dasharray", "10, 2.5")
        .style("stroke-width", "0.15rem")
        .attr("y1", 0)
        .attr("y2", height - margin)

    const yAxisTooltip_alcoholConsumption = svg.append("line")
        .style("stroke", "red")
        .style("stroke-dasharray", "10, 2.5")
        .style("stroke-width", "0.15rem")
        .attr("x1", margin)
        .attr("x2", width - 3 * margin)
        .attr("transform", "translate(0, 0)")
    const yAxisTooltip_lifeExpectency = svg.append("line")
        .attr("class", "y")
        .style("stroke", "blue")
        .style("stroke-dasharray", "10, 2.5")
        .style("stroke-width", "0.15rem")
        .attr("x1", margin)
        .attr("x2", width - margin)
    const yAxisTooltipCircle_lifeExpectency = svg.append("circ")
        .attr("r", 60)
        .attr("stroke", "black")
        .attr("fill", "gray")
    const yAxisTooltipCircle_alcoholConsumption = svg.append("circ")
        .attr("r", 50)
        .attr("stroke", "black")
        .attr("fill", "gray")

    svg.on("mouseover", () => {
        tooltip.style("visibility", "visible")
        xAxisTooltip.style("visibility", "visible")
        if (acSwitchEnabled)
            yAxisTooltip_alcoholConsumption.style("visibility", "visible")
        if (leSwitchEnabled)
            yAxisTooltip_lifeExpectency.style("visibility", "visible")
    })
    let currentlySelectedYear = null
    svg.on("mousemove", () => {
        const [x, y] = d3.pointer(event)
        const year = xAxisScale.invert(x).getFullYear()
        const dataPoint = getDataPointFromYear(selectedCountry, year - 1)

        if (dataPoint == null) return

        const xPos = xAxisScale(new Date(year, 0, 0))
        const yPos1 = yAxisScale_alcoholConsumption(dataPoint.alcoholConsumption)
        const yPos2 = yAxisScale_lifeExpectency(dataPoint.lifeExpectency)

        const acFixed = dataPoint.alcoholConsumption.toFixed(2)
        const leFixed = dataPoint.lifeExpectency.toFixed(2)

        const alcoholConsumptionHtml = dataPoint.acIsEstimated 
            ? `<s>Litres of Alcohol Consumed Per Person: ~${acFixed}</s>`
            : `Litres of Alcohol Consumed Per Person: ${acFixed}`

        const lifeExpectencyHtml = dataPoint.leIsEstimated 
            ? `<s>Life Expectency: ~${leFixed}</s>`
            : `Life Expectency: ${leFixed}`

        tooltip.style("top", `${event.pageY - 40}px`)
            .style("left", `${event.pageX + 40}px`)
            .html(`
                <p><strong>${dataPoint.refAreaName} - ${year}</strong></p>
                <hr>
                <p>${lifeExpectencyHtml}</p>
                <p>${alcoholConsumptionHtml}</p>
            `)
        // This makes it so we don't have to execute the same code every single frame the user moves their mouse
        if (currentlySelectedYear != year) {
            currentlySelectedYear = year

            xAxisTooltip.attr("transform", `translate(${xPos}, 0)`)

            if (acSwitchEnabled)
            { 
                yAxisTooltip_alcoholConsumption.attr("transform", `translate(0, ${yPos1})`)

                yAxisTooltipCircle_alcoholConsumption
                    .attr("cx", xPos)
                    .attr("cy", yPos1)
            }
            if (leSwitchEnabled)
            {
                yAxisTooltip_lifeExpectency.attr("transform", `translate(0, ${yPos2})`)
                yAxisTooltipCircle_lifeExpectency
                    .attr("cx", xPos)
                    .attr("cy", yPos2)
            }
        }
    })
    svg.on("mouseout", () => {
        hideTooltip(tooltip)
        xAxisTooltip.style("visibility", "hidden")
        yAxisTooltip_alcoholConsumption.style("visibility", "hidden")
        yAxisTooltip_lifeExpectency.style("visibility", "hidden")
    })
}

function hideTooltip(tooltip) {
    tooltip.style("visibility", "hidden")
}   

function getDataPointFromYear(data, year) {
    for (let i = 0; i < data.length; i++) {
        if (data[i].timePeriod.getFullYear() == year)
            return data[i]
    }
    return null
}

function getXAxisScale(width, margin, data) {
    const min = d3.min(data, (d) => d.timePeriod, 0, 1)
    const max = d3.max(data, (d) => d.timePeriod)
    return d3.scaleTime()
        .domain([min, max])
        .range([margin, width - margin - margin - margin]) // subtract margin twice, per y axis used, and once more for... uhhhhh
}

function getYAxisScale_LifeExpectency(height, margin) {
    const min = 60
    const max = 100 
    return d3.scaleLinear()
        .domain([min, max])
        .range([height - margin, margin])
}

function getYAxisScale_AlcoholConsumption(height, margin) {
    const min = 0 // Minimum is ~0.1 in the database
    const max = 20 // Max is 18 in the dataset
    return d3.scaleLinear()
        .domain([min, max])
        .range([height - margin, margin])
}

/** 
 * Fills null data by calculating trendline of existing data, and using extrapolated data to fill it in
 * @param {Array} data
 * @param {string} The index of the y axis to calculate the extrapolated values for
 * @param {string} An optional string that when set to something, will acces data[i]["isEstimated"] and flip to true if it was
 *  modified during the function
 */
function fillMissingData(data, yAxisParameter, isEstimatedParameter) { // Formula from: https://math.stackexchange.com/a/204021
    
    // KEY TERIMNOLOGY:
    // [null, null, *6*, 8, 3, **9**, null, null ]
    //    - LEFT MOST:  *6*
    //    - RIGHT MOST: **9**

    // 1. We want to find the left most value, and loop for all other null values until reach index 0
    // 2. Find right most value, loop until reach index (size of array)
    // 3. Calculate `y = mx` (no `+c`, we only want gradient)
    //    1. Calculate slope of equation `m` 
    //    2. Calculate offset `c`
    
    let leftMostIndex = -1;
    let rightMostIndex = -1;
    for (let i = 0; i < data.length; i++) {
        if (leftMostIndex == -1) {
            // We have not found the left most index, meaning we should loop until we find it
            if (data[i][yAxisParameter] != null) 
                leftMostIndex = i
        } else {
            // We have found it, so we'll need to find the right most index
            // Loop until the next number is either a stack overflow, or null
            if (i == data.length - 1)
                rightMostIndex = data.length
            else if (data[i + 1][yAxisParameter] == null)
                rightMostIndex = i
            
            if (rightMostIndex != -1) break // We found one. Nicer than having 'break' in each 'if elseif' statement imo
        }
    }

    // THIS COULD BE BAD
    // rightMostIndex + 1 seems like something that should not be done 
    // (Could cause a stack overflow exception)
    const dataSubset = data.slice(leftMostIndex, rightMostIndex + 1)
    const dataRise = calculateSlopeOfDataset(dataSubset, (d) => d[yAxisParameter])

    // This loop starts the left most value, and loops unitl the index = 0. Since we want to calculate the extrapolated value using
    // the linear equation we created, we can keep a store of the current X and Y, then for each index, subtract rise and run and set
    // that data point's life expectency to it

    if (leftMostIndex != 0) {
        let d = data[leftMostIndex]
        let currentY = d[yAxisParameter]
        for (let i = leftMostIndex - 1; i >= 0; i--) {
            // We are going backward, so subtract
            currentY -= dataRise
            data[i][isEstimatedParameter] = true
            data[i][yAxisParameter] = currentY
        }
    }


    if (rightMostIndex < data.length) {
        d = data[rightMostIndex]
        currentY = d[yAxisParameter]
        for (let i = rightMostIndex + 1; i < data.length; i++) {
            currentY += dataRise
            data[i][isEstimatedParameter] = true
            data[i][yAxisParameter] = currentY
        }
    }
}

/**
 * Calculates the slope of Y in a dataset. Formula from - https://math.stackexchange.com/a/204021
 * @param {Array} data The sliced dataset, containing NO null/NaN values
 * @param {Function} A function that takes each data point as an argument, to return which value to use. Null to just use that value
 */
function calculateSlopeOfDataset(data, func) {
    let sumOfX = 0
    let sumOfXSquared = 0
    let sumOfY = 0
    let sumOfXMultY = 0 // summtion (x * y)
    let n = data.length
    for (let i = 0; i < n; i++) {
        const d = data[i]
        const x = d.timePeriod.getFullYear()
        const y = func(d) ?? d

        sumOfX += x
        sumOfXSquared += x * x
        sumOfY += y
        sumOfXMultY += x * y
    }
        
    // oh god oh fuck oh shit oh fuck
    return (n * sumOfXMultY - sumOfX * sumOfY) / (n * sumOfXSquared - (sumOfX * sumOfX))
}

function createLegend(parent) {
    const legendSection = parent.append("section")
    legendSection.append("h1").text("Legend")
    legendSection.append("p").text("Red - Litres of alcohol consumed per person").style("color", "red")
    legendSection.append("p").text("Blue - Life Expectency").style("color", "blue")
    legendSection.append("p").html("<p><s>Strike</s> - Extrapolated Data</p>")
}

function createDataSwitches(parent) {
    const dataSwitchSection = parent.append("section")
    dataSwitchSection.append("h1").text("Data Selection")

    const leSwitchDiv = parent.append("div")
    const leSwitch = leSwitchDiv.append("input")
        .attr("type", "checkbox")
        .attr("id", "le-switch-input")
        .attr("checked", "checked")

    leSwitchDiv.append("label")
        .attr("for", "le-switch-input")
        .text("Enable Life Expectency")


    const acSwitchDiv = parent.append("div")
    const acSwitch = acSwitchDiv.append("input")
        .attr("type", "checkbox")
        .attr("id", "ac-switch-input")
        .attr("checked", "checked")

    acSwitchDiv.append("label")
        .attr("for", "ac-switch-input")
        .text("Enable Alcohol Consumption")

    return [leSwitch, acSwitch]
}

