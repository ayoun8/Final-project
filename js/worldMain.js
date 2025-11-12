// Global variable (map)
let mapVis, worldVis;

// Load data (please work)
let promises = [
    d3.csv("data/countriesMSData.csv"),
    d3.json("data/countries.geo.json")
]

Promise.all(promises)
    .then(function(data){
        data[0].forEach(function(d) {
            d.Prevalence2008 = +d.Prevalence2008;
            d.Prevalence2013 = +d.Prevalence2013;
            d.Prevalence2020 = +d.Prevalence2020;
            d.Incidence2008 = +d.Incidence2008;
            d.Incidence2013 = +d.Incidence2013;
            d.Incidence2020 = +d.Incidence2020;
            d.MeanAgeofOnset2008 = +d.MeanAgeofOnset2008;
            d.MeanAgeofOnset2013 = +d.MeanAgeofOnset2013;
            d.MeanAgeofOnset2020 = +d.MeanAgeofOnset2020;
        })

        initMainPages(data);
    })
    .catch(function (err){
        console.log(err)
    });

// Load page
function initMainPages(data) {
    worldVis = new WorldVis("vis5-root", data[0], data[1]);

    // Dropdown
    d3.select("#case-choice").on("change", () => {
        let stat = d3.select("#case-choice").property("value");
        worldVis.sortStat(stat);
    });

    // Slider
    d3.select("#time-slider").on("change", () => {
        let value = d3.select("#time-slider").property("value");
        let year;
        if (value == 0) {
            year = 2008;
        } else if (value == 1) {
            year = 2013;
        } else if (value == 2) {
            year = 2020;
        }

        d3.select("#time-slider-label").text("Year: " + year);

        worldVis.moveYear(year);
    });
}