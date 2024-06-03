async function loadLifeExpectencyAndAlcoholTop10()
{
    const padding = 0.2;
    const margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = 660 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const segment = d3.select("#life-expectency-top-10-alcohol")
    segment.insert("h1").text("Life expectency for the top 10 alcohol consumers in 2019")

    const btnGroup = segment.insert("div")
    const alcoholConsumptionBtns = segment.insert("div").attr("class", "btn-group")
    alcoholConsumptionBtns.append("p").text("Order by alcohol consumption")
    const lifeExpectancyBtns = segment.insert("div").attr("class", "btn-group")
    lifeExpectancyBtns.append("p").text("Order by life expectancy")

    const orderByACAscendingBtn = alcoholConsumptionBtns.insert("button").text("Ascending")
    const orderByACDescendingBtn = alcoholConsumptionBtns.insert("button").text("Descending")

    const orderByLEAscendingBtn = lifeExpectancyBtns.insert("button").text("Ascending")
    const orderByLEDescendingBtn = lifeExpectancyBtns.insert("button").text("Descending")

    // append the svg object to the body of the page
    const svg = d3.select("#life-expectency-top-10-alcohol")
      .insert("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let index = 0
    const data = await d3.csv("assets/avg_le_ac_top_10.csv", (d) => {
        return {
            id: ++index,
            ref_area_code: d.ref_area_code,
            ref_area_name: d.ref_area_name,
            time_period: d.time_period,
            alcohol_consumption: parseFloat(d.average_alcohol_consumption),
            life_expectency: parseFloat(d.average_life_expectancy)
        }
    })

    // let min = d3.min(data, (d) => d.alcohol_consumption)
    const max = d3.max(data, (d) => d.alcohol_consumption)
    const min = 0 // TODO - WHY THE FUCK DOES EVERYONE USE JAVASCRIPT THIS FUCKING THING DOESN'TW ROK I'M GOI NG TO CRY

    let scaleX = d3.scaleBand()
        .domain(data.map(d => d.ref_area_code))
        .range([0, width])
        .padding(padding)

    let scaleY = d3.scaleLinear()
        .domain([min, max])
        .range([height, 0])

    // Values directly from the database
    const colourScale = d3.scaleLinear()
        .domain([85, 72])
        .range(["white", "darkblue"])

    const xAxisLabels = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(scaleX))

    svg.append("g")
        .attr("transform", `translate(${margin}, 0)`)
        .call(d3.axisLeft(scaleY))

    const joinedData = svg.selectAll("rect")
        .data(data, (d) => d.id)
        .join("rect")

    const tooltip = d3.select("#tooltip")

    joinedData
        .attr("width", scaleX.bandwidth())
        .attr("height", (d) => scaleY(max - d.alcohol_consumption))
        .attr("y", (d) => height - scaleY(max - d.alcohol_consumption))
        .attr("x", (d) => scaleX(d.ref_area_code))
        .attr("fill", (d) => colourScale(d.life_expectency))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
            tooltip.html(`
                    <p><strong>${d.ref_area_name}</strong></p>
                    <hr>
                    <p>Alcohol Consumption: ${d.alcohol_consumption}</p>
                    <p>Life Expectancy: ${d.life_expectency}</p>
                `)

        })
        .on("mousemove", (event, d) => {
            tooltip.style("top", `${event.pageY - 40}px`)
                .style("left", `${event.pageX + 40}px`)
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden")
        })

    /** 
     * Orders the chart either by [by=1]alcohol consumption, or [by=2]life expectency
     * @param {Number} by The variable to sort by, 1 === alcohol_consumiton, and 2 === life_expectency
     * @param {Number} asc Which direction to sort the dataset by, 1 === ascending, 2 === descending
     */
    function orderChart(by, asc) {
        let orderByValue;

        if (by === 1) {
            orderByValue = 'alcohol_consumption';
        } else if (by === 2) {
            orderByValue = 'life_expectency';
        } else {
            throw new Error(`You cannot order the chart by '${by}', you can only sort by 1 (alcohol consumption) or 2 (life expectancy)`)
        }

        let orderedData = [...data]
        if (asc === 1) {
            orderedData = data.sort((x, y) => d3.ascending(x[orderByValue], y[orderByValue]))
        } else if (asc === 2) {
            orderedData = data.sort((x, y) => d3.descending(x[orderByValue], y[orderByValue]))
        } else {
            throw new Error(`You can only choose to order the chart by 1 (ascending), or 2 (descending)`)
        }

        // i really need to sleep 
        const joinedData = svg.selectAll("rect")
            .data(orderedData, (d) => d.id);

        scaleX.domain(orderedData.map(d => d.ref_area_code))

        joinedData
            .transition()
            .duration(500)
            .attr("width", scaleX.bandwidth())
            .attr("height", (d) => scaleY(max - d.alcohol_consumption))
            .attr("y", (d) => height - scaleY(max - d.alcohol_consumption))
            .attr("x", (d) => scaleX(d.ref_area_code))
            .attr("fill", (d) => colourScale(d.life_expectency))

        xAxisLabels.transition()
            .duration(500)
            .call(d3.axisBottom(scaleX))
    }

    orderByACAscendingBtn.on("click", () => orderChart(1, 1))
    orderByACDescendingBtn.on("click", () => orderChart(1, 2))
    orderByLEAscendingBtn.on("click", () => orderChart(2, 1))
    orderByLEDescendingBtn.on("click", () => orderChart(2, 2))

    orderChart(1, 2)
}
