async function life_expectency_top_10_alcohol()
{
    const padding = 0.2;
    const margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = 660 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    const segment = d3.select("#life-expectency-top-10-alcohol")
    segment.insert("h1").text("Life expectency for the top 10 alcohol consumers in 2019")

    // append the svg object to the body of the page
    const svg = d3.select("#life-expectency-top-10-alcohol")
      .insert("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const orderByACBtn = segment.insert("button")
        .text("Order by alcohol consumption")
    const orderByLEBtn = segment.insert("button")
        .text("Order by life expectency")

    const data = await d3.csv("./../data/alcohol_life_expectency_per_country_2019.csv", (d) => {
        return {
            id: d.id,
            ref_area_code: d.ref_area_code,
            time_period: d.time_period,
            alcohol_consumption: parseFloat(d.alcohol_consumption),
            life_expectency: parseFloat(d.life_expectency)
        }
    })
    console.log(data)

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
    const minLifeExpectency = 62
    const maxLifeExpectency = 84
    const colourScale = d3.scaleLinear()
        .domain([85, 72])
        .range(["white", "red"])


    const xAxisLabels = svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(scaleX))

    svg.append("g")
        .attr("transform", `translate(${margin}, 0)`)
        .call(d3.axisLeft(scaleY))

    const joinedData = svg.selectAll("rect")
        .data(data, (d) => d.id)
        .join("rect")

    joinedData
        .attr("width", scaleX.bandwidth())
        .attr("height", (d) => scaleY(max - d.alcohol_consumption))
        .attr("y", (d) => height - scaleY(max - d.alcohol_consumption))
        .attr("x", (d) => scaleX(d.ref_area_code))
        .attr("fill", (d) => colourScale(d.life_expectency))

    /** 
     * Orders the chart either by [by=1]alcohol consumption, or [by=2]life expectency
     */
    function orderChart(by) {
        let orderByValue;
    
        if (by === 1) {
            orderByValue = 'alcohol_consumption';
        } else if (by === 2) {
            orderByValue = 'life_expectency';
        }
    
        // i really need to sleep 
        const orderedData = [...data]
            .sort((x, y) => d3.descending(x[orderByValue], y[orderByValue]))

        console.log(orderedData)
    
        const joinedData = svg.selectAll("rect")
            .data(orderedData, (d) => d.id);

        scaleX.domain(orderedData.map(d => d.ref_area_code))
    
        joinedData.transition()
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

    orderByACBtn.on("click", () => orderChart(1))
    orderByLEBtn.on("click", () => orderChart(2))
}