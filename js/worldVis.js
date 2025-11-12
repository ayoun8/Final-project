class WorldVis {

    constructor(parentElement, countriesData, geoData) {
        this.parentElement = parentElement;
        this.countriesData = countriesData;
        this.geoData = geoData;

        this.stat = "Prevalence";
        this.year = 2008;

        this.colors = ["#65a5d3", "#4b86ca", "#376ec1", "#0d4791"]

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Dimensions
        vis.margin = {top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("transform", `translate (${vis.margin.left}, 0)`);

        // Title
        // vis.title = vis.svg.append("g")
        //     .attr("class", "title")
        //     .attr("id", "map-title")
        //     .append("text")
        //     .text("MS")
        //     .attr("transform", `translate(${vis.width / 2}, 20)`)
        //     .attr("text-anchor", "middle");

        // Projection of countries
        vis.projection = d3.geoMercator()
            .scale(Math.min(100, Math.min(vis.width, vis.height) * 0.15))
            .translate([vis.width / 2, vis.height / 2]);

        // Map path
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Grab features from geo.json (which is a GeoJSON file instead of TopoJSON whoops LOL)
        vis.world = vis.geoData.features;

        // Sphere
        vis.svg.append("path")
            .datum({type: "Sphere"})
            .attr("class", "ocean")
            .attr("fill", "#ecf7ff")
            .attr("d", vis.path);

        // Countries
        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", vis.path);

        // Tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .attr("id", "mapTooltip");

        // Legend
        vis.legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width * 0.35}, ${vis.height - 10})`);

        vis.legend.selectAll()
            .data(vis.colors)
            .enter()
            .append("rect")
            .merge(vis.legend)
            .attr("x", function(d, i) {
                return (vis.width * 0.05) + (vis.width * 0.2) * (i / 4);
            })
            .attr("width", function(d, i) {
                return (vis.width * 0.2) * (1 - i / 4);
            })
            .attr("height", 20)
            .attr("fill", function(d, i) {
                return vis.colors[i];
            });

        vis.legendScale = d3.scaleLinear()
            .domain([0, 400])
            .range([0, vis.width * 0.2]);

        vis.legendAxisGroup = vis.svg.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(${vis.width * 0.4}, ${vis.height + 10})`);

        vis.legendAxis = d3.axisBottom().scale(vis.legendScale)
            .ticks(2);

        vis.legendAxisGroup.call(vis.legendAxis);

        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // console.log(vis.geoData.features);
        // console.log(vis.countriesData);

        let countryNames = Array.from(d3.group(vis.countriesData, d => d.Country), ([name, details]) => (name));
        // console.log(countryNames);

        let statYear = this.stat + this.year.toString();
        // console.log(statYear);

        // Land data
        vis.countryInfo = {};
        vis.world.forEach(d => {
            let countryIndex = countryNames.indexOf(d.properties.name);
            if (countryIndex !== -1 && vis.countriesData[countryIndex][statYear] !== -1) {
                vis.countryInfo[d.properties.name] = {
                    name: d.properties.name,
                    value: vis.countriesData[countryIndex][statYear],
                    color: vis.colors[Math.floor(vis.countriesData[countryIndex][statYear] / 100)],
                }
            } else {
                vis.countryInfo[d.properties.name] = {
                    name: d.properties.name,
                    value: null,
                    color: "#000000",
                }
            }
        })

        vis.updateVis();
    }


    updateVis() {
        let vis = this;

        vis.svg.selectAll(".country")
            .attr("fill", function(d) {
                if (vis.countryInfo[d.properties.name].color) {
                    return vis.countryInfo[d.properties.name].color;
                }
            })
            .on("mouseover", function(event, d){
                if (vis.countryInfo[d.properties.name].value !== null) {
                    d3.select(this)
                        .attr("stroke-width", "2px")
                        .attr("stroke", "black")
                        .style("fill", "rgba(11,172,23,0.62)");
                    vis.tooltip
                        .style("opacity", 1)
                        .style("position", "absolute")
                        .style("left", event.pageX + 20 + "px")
                        .style("top", event.pageY + "px");

                    vis.tooltip
                        .html(`
                         <div style="border: thin solid grey; border-radius: 5px; background: #232323; padding: 20px">
                             <h4>${vis.countryInfo[d.properties.name].name}<h4>
                             <h5>${(vis.stat == "MeanAgeofOnset" ? "Age:" : "Cases per 100,000:")} ${vis.countryInfo[d.properties.name].value}</h5>                       
                         </div>
                    `)
                }
            })
            .on("mouseout", function(event, d){
                d3.select(this)
                    .attr("stroke-width", "0px")
                    .style("fill", d => vis.countryInfo[d.properties.name].color)
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });
    }

    sortStat(stat) {
        this.stat = stat;
        this.wrangleData();
    }

    moveYear(year) {
        this.year = year;
        this.wrangleData();
    }
}