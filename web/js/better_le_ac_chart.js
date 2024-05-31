/**
 * Class containing information about a single record inside the /data/le_and_ac.csv dataset
 */
class LeAcRecord {
    constructor(index, csvRecord) {
        // Initialise class
        this.id = index
        this.timePeriod = new Date(csvRecord.time_period, 0, 0)
        this.refAreaName = csvRecord.name
        this.refAreaCode = csvRecord.code
        this.alcoholConsumption = csvRecord.alcohol_consumption == "" ? null : parseFloat(csvRecord.alcohol_consumption)
        this.lifeExpectency = csvRecord.life_expectency == "" ? null : parseFloat(csvRecord.life_expectency)
        this.acIsEstimated = false
        this.lcIsEstimated = false
    }
}

async function loadLeAcChart_Refactored() {
    const width = 1000
    const height = 500
    const margin = 30

    const section = d3.select("#life-expectency-and-alcohol-consumption-2")
    createLegend(section)

    const dataset = await loadLeAcDataset()
    const datasetGroup = d3.group(dataset, (d) => d.refAreaCode)


}

function createLegend(parent) {
    const legendSection = parent.append("section")
    legendSection.append("h1").text("Legend")
    legendSection.append("p").text("Red - Alcohol Consumption").style("color", "red")
    legendSection.append("p").text("Blue - Life Expectency").style("color", "blue")
    legendSection.append("p").html("<p><s>Strike</s> - Extrapolated Data</p>")
}

/**
 * Loads the data inside ../data/le_and_ac.csv dataset, and returns an array of LeAcRecord
 */
async function loadLeAcDataset() {
    let index = 0
    const records = await d3.csv("../data/le_and_ac.csv", (d) => {
        return new LeAcRecord(++index, d)
    })
    return records
}
