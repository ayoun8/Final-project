(function () {
    const CSV_PATH = "data/alzheimers_gender_data.csv";
    const seriesKeys = ["Female", "Male"];

    const root = d3.select("#vis2-root");
    const container = root.node();

    const tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);

    const svg = root.append("svg").attr("role", "group").attr("aria-labelledby", "vis2-title vis2-desc");

    svg.append("title").attr("id", "vis2-title").text("Alzheimer’s Distribution by Gender (by Race)");

    const g = svg.append("g");
    const gx = g.append("g").attr("class", "axis axis--x");
    const gy = g.append("g").attr("class", "axis axis--y");
    const barsG = g.append("g").attr("class", "bars");
    const legendG = svg.append("g").attr("class", "legend");

    const x0 = d3.scaleBand().paddingInner(0.2);
    const x1 = d3.scaleBand().padding(0.15);
    const y = d3.scaleLinear();
    const color = d3.scaleOrdinal().domain(seriesKeys).range(["#dc7a8c", "#d80e0e"]);

    const xAxis = d3.axisBottom(x0).tickSizeOuter(0);
    const yAxis = d3.axisLeft(y).ticks(6).tickSizeOuter(0);

    d3.csv(CSV_PATH, d3.autoType).then(raw => {
        const totalRow = raw.find(d => d.Race === "Total");
        const data = raw.filter(d => d.Race !== "Total");

        svg.append("desc").attr("id", "vis2-desc")
            .text(totalRow
                ? `Totals — Female: ${totalRow.Female}, Male: ${totalRow.Male}, Overall: ${totalRow.Total}.`
                : "Totals row not provided.");

        function render() {
            const width = Math.max(360, container.clientWidth);
            const height = Math.max(420, container.clientHeight);
            const margin = { top: 28, right: 24, bottom: 56, left: 56 };
            const innerW = width - margin.left - margin.right;
            const innerH = height - margin.top - margin.bottom;

            svg.attr("width", width).attr("height", height);
            g.attr("transform", `translate(${margin.left},${margin.top})`);

            x0.range([0, innerW]).domain(data.map(d => d.Race));
            x1.range([0, x0.bandwidth()]).domain(seriesKeys);
            const maxY = d3.max(data, d => d3.max(seriesKeys, k => +d[k])) || 0;
            y.range([innerH, 0]).domain([0, maxY]).nice();

            gx.attr("transform", `translate(0,${innerH})`).call(xAxis);
            gy.call(yAxis);

            const yLbl = gy.selectAll(".y-label").data(["Count"]);
            yLbl.enter().append("text").attr("class", "y-label").attr("fill", "white")
                .attr("text-anchor", "end").attr("x", -10).attr("y", -10).text(d => d);

            const raceGroups = barsG.selectAll(".race-group").data(data, d => d.Race);

            const raceEnter = raceGroups.enter().append("g").attr("class", "race-group");

            raceEnter.merge(raceGroups).attr("transform", d => `translate(${x0(d.Race)},0)`);

            raceGroups.exit().remove();

            const bars = barsG.selectAll(".race-group").selectAll("rect")
                .data(d => seriesKeys.map(k => ({ key: k, value: +d[k], race: d.Race })), d => d.key);

            bars.enter().append("rect").attr("x", d => x1(d.key)).attr("y", innerH)
                .attr("width", x1.bandwidth()).attr("height", 0).attr("fill", d => color(d.key))
                .attr("aria-label", d => `${d.key} ${d.race}: ${d.value}`)
                .on("mousemove", (event, d) => {
                    tooltip
                        .style("opacity", 1)
                        .html(`<strong>${d.race}</strong><br/>${d.key}: ${d.value}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseleave", () => tooltip.style("opacity", 0))
                .transition().duration(1000).attr("y", d => y(d.value)).attr("height", d => innerH - y(d.value));

            bars.transition()
                .duration(1000).attr("x", d => x1(d.key)).attr("y", d => y(d.value))
                .attr("width", x1.bandwidth()).attr("height", d => innerH - y(d.value)).attr("fill", d => color(d.key));

            bars.exit().remove();

            const legendItems = legendG.selectAll(".legend-item").data(seriesKeys, d => d);

            const legendEnter = legendItems.enter().append("g").attr("class", "legend-item");

            legendEnter.append("rect")
                .attr("width", 12).attr("height", 12).attr("rx", 2)
                .attr("ry", 2).attr("fill", d => color(d));

            legendEnter.append("text").attr("x", 18).attr("y", 10).attr("fill", "white").text(d => d);

            const legendPadding = 14;
            let accX = 0;
            legendG.selectAll(".legend-item")
                .attr("transform", function () {
                    const node = d3.select(this);
                    const textW = node.select("text").node().getComputedTextLength();
                    const blockW = Math.ceil(12 + 6 + textW + 18);
                    const x = accX;
                    accX += blockW + legendPadding;
                    return `translate(${x}, 6)`;
                });

            legendG.attr("transform", `translate(${width - margin.right - accX}, ${margin.top - 22})`);

            const xLbl = svg.selectAll(".x-axis-label").data(["Race"]);
            xLbl.enter().append("text").attr("class", "x-axis-label").attr("text-anchor", "middle")
                .attr("fill", "#111").merge(xLbl).attr("x", margin.left + innerW / 2)
                .attr("y", height - 8).text("Race");
        }
        let animated = false;
        function loaded() {
            if (animated) {
                return;
            }
            const rect = container.getBoundingClientRect();
            const viewHeight = window.innerHeight || document.documentElement.clientHeight;

            if (rect.top < viewHeight && rect.bottom > 0) {
                animated = true;
                render();
                window.removeEventListener("scroll", animated);
            }
        }
        window.addEventListener("scroll", loaded);
        loaded();
    }).catch(err => {
        console.error("Failed to load CSV:", err);
    });
})();