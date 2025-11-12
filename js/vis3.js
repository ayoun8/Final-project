class Vis3 {
    constructor(parentElement, dataPath) {
        this.parentElement = parentElement;
        this.dataPath = dataPath;

        this.STATE_COL = "State";
        this.CASES_COL = "Sum of CasesK";
        this.POP_COL = "Sum of Pop65k";
        this.WNUM_COL = "Sum of WeightedPrevNum";

        this.sets = {
            Northeast: ["Maine", "New Hampshire", "Vermont", "Massachusetts", "Rhode Island", "Connecticut", "New York", "New Jersey", "Pennsylvania"],
            Midwest: ["Ohio", "Michigan", "Indiana", "Illinois", "Wisconsin", "Minnesota", "Iowa", "Missouri", "North Dakota", "South Dakota", "Nebraska", "Kansas"],
            South: ["Delaware", "Maryland", "Virginia", "West Virginia", "Kentucky", "Tennessee", "North Carolina", "South Carolina", "Georgia", "Florida", "Alabama", "Mississippi", "Arkansas", "Louisiana", "Oklahoma", "Texas"],
            West: ["Montana", "Wyoming", "Colorado", "New Mexico", "Arizona", "Utah", "Nevada", "Idaho", "Washington", "Oregon", "California", "Alaska", "Hawaii"]
        };

        this.regionOf = {};
        for (const region in this.sets) {
            if (!Object.prototype.hasOwnProperty.call(this.sets, region)) {
                continue;
            }
            for (const s of this.sets[region]) {
                this.regionOf[s] = region;
            }
        }
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 220, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width;
        vis.height = Math.max(document.getElementById(vis.parentElement).getBoundingClientRect().height, 450);

        vis.svg = d3.select(`#${vis.parentElement}`).append("svg")
            .attr("width", "100%")
            .attr("height", vis.height)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", [0, 0, vis.width, vis.height]);

        vis.gLines = vis.svg.append("g")
            .attr("class", "lines");
        vis.gNodes = vis.svg.append("g")
            .attr("class", "nodes");
        vis.gLegend = vis.svg.append("g")
            .attr("class", "legend");

        vis.tooltip = d3.select("body")
            .append("div")
            .attr("class", "vis3-tooltip");

        vis.resizeObserver = new ResizeObserver(() => vis.updateVis());
        vis.resizeObserver.observe(document.getElementById(vis.parentElement));

        d3.csv(vis.dataPath, d3.autoType).then(raw => {
            vis.data = raw;
            vis.wrangleData();
        });
    }

    wrangleData() {
        let vis = this;

        const rows = [];

        for (const d of vis.data) {
            const s = String(d[vis.STATE_COL]).trim();
            if (!s || s === "Grand Total" || !vis.regionOf[s]) {
                continue;
            }
            rows.push({
                state: s,
                casesK: +d[vis.CASES_COL] || 0,
                pop65k: +d[vis.POP_COL] || 0,
                wnum: +d[vis.WNUM_COL] || 0
            });
        }

        const regionAggregate = d3.rollups(rows, v => {
                const states = v.map(d => ({
                    state: d.state,
                    casesK: d.casesK,
                    prevPct: d.pop65k ? (100 * d.wnum / d.pop65k) : 0
                })).sort((a, b) => b.casesK - a.casesK);
                return {
                    casesK: d3.sum(v, d => d.casesK),
                    pop65k: d3.sum(v, d => d.pop65k),
                    wnum: d3.sum(v, d => d.wnum),
                    states
                };
            }, d => vis.regionOf[d.state]
        );

        const order = ["Northeast", "Midwest", "South", "West"];
        vis.displayData = order.map(region => {
            const hit = regionAggregate.find(([k]) => k === region);
            const a = hit ? hit[1] : {casesK: 0, pop65k: 0, wnum: 0, states: []};
            const rec = {
                region,
                casesK: a.casesK,
                prevPct: a.pop65k ? 100 * a.wnum / a.pop65k : 0,
                states: a.states
            };
            return rec;
        });

        const totalCases = d3.sum(vis.displayData, d => d.casesK);
        vis.displayData.forEach(d => d.share = d.casesK / totalCases);

        const extent = d3.extent(vis.displayData, d => d.share);
        const maxR = Math.max(60, Math.min(vis.width, vis.height) * 0.15);
        const minR = Math.max(35, maxR * 0.5);
        vis.rScale = d3.scaleSqrt().domain(extent).range([minR, maxR]);

        const prevExtent = d3.extent(vis.displayData, d => d.prevPct);
        vis.colorScale = d3.scaleQuantize()
            .domain(prevExtent)
            .range(d3.schemeYlOrRd[5]);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.svg.attr("viewBox", [0, 0, vis.width, vis.height]);

        const centerX = vis.width / 2;
        const centerY = vis.height / 2 - 20;
        const pad = Math.max(160, Math.min(280, Math.min(vis.width, vis.height) * 0.35));

        const POS = {
            Northeast: [centerX, centerY - pad],
            South: [centerX, centerY + pad],
            West: [centerX - pad, centerY],
            Midwest: [centerX + pad, centerY]
        };

        const lines = Object.keys(POS).map(r => ({
            x1: centerX,
            y1: centerY,
            x2: POS[r][0],
            y2: POS[r][1],
            region: r
        }));
        vis.gLines.selectAll("circle.center-dot").data([0])
            .join(enter => enter.append("circle")
                    .attr("class", "center-dot").attr("r", 3),
                update => update
            )
            .attr("cx", centerX)
            .attr("cy", centerY);
        vis.gLines.selectAll("line").data(lines, d => d.region)
            .join(enter => enter.append("line")
                    .attr("x1", d => d.x1).attr("y1", d => d.y1)
                    .attr("x2", d => d.x2).attr("y2", d => d.y2),
                update => update
                    .attr("x1", d => d.x1).attr("y1", d => d.y1)
                    .attr("x2", d => d.x2).attr("y2", d => d.y2)
            )
            .attr("stroke", "#999").attr("stroke-width", 1.5).attr("opacity", 0.5);


        const node = vis.gNodes.selectAll("g.node").data(vis.displayData, d => d.region);

        const nodeEnter = node.enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", `translate(${centerX}, ${centerY})`);

        nodeEnter.append("circle")
            .attr("stroke", "#222")
            .attr("stroke-width", 2)
            .attr("r", 0)
            .on("mouseenter", function (event, d) {
                const statesHTML = d.states.slice(0, 12).map(s =>
                    `<div style = "display:flex;justify-content:space-between;gap:12px;">
                    <span>${s.state}</span><span>${s.casesK.toFixed(1)}k</span>
                </div>`).join("");
                vis.tooltip.html(
                    `<div style = "font-weight:700;margin-bottom:4px">${d.region}</div>
                    <div>Total cases: ${d.casesK.toFixed(1)}k</div>
                    <div>Prevalence: ${d.prevPct.toFixed(2)}%</div>
                    <hr style="border:none;border-top:1px solid #eee;margin:6px 0;">
                    <div style="font-weight:600;margin-bottom:4px">Top states</div>${statesHTML}`).style("opacity", 1);
            })
            .on("mousemove", (event) => {
                vis.tooltip.style("left", (event.pageX + 14) + "px")
                    .style("top", (event.pageY + 14) + "px");
            })
            .on("mouseleave", () => vis.tooltip.style("opacity", 0));

        const nodeAll = nodeEnter.merge(node);
        nodeAll.transition()
            .duration(1000)
            .attr("transform", d => `translate(${POS[d.region][0]}, ${POS[d.region][1]})`);
        nodeAll.select("circle")
            .transition()
            .duration(1000)
            .attr("r", d=> vis.rScale(d.share))
            .attr("fill", d=> vis.colorScale(d.prevPct));
        nodeEnter.append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .style("pointer-events", "none");

        nodeAll.select("text").text(d => d.region);
        node.exit().remove();

        vis.legend({
            x: Math.max(24, vis.width - 100),
            y: 24,
            title: "Prevalence (%)",
        });
    }

    legend({x, y, title = "Prevalence (%)"} = {}) {
        let vis = this;

        vis.gLegend.selectAll("*").remove();

        const bins = vis.colorScale.range();
        const thresholds = vis.colorScale.thresholds();
        const format = d3.format(".1f");

        const items = bins.map((c, i) => {
            const low = i === 0 ? vis.colorScale.domain()[0] : thresholds[i - 1];
            const high = i === bins.length - 1 ? vis.colorScale.domain()[1] : thresholds[i];
            return {
                color: c,
                label: `${format(low)}-${format(high)}%`
            };
        });

        vis.gLegend.append("text")
            .attr("class", "title")
            .attr("x", x)
            .attr("y", y - 10)
            .text(title);


        const sWidth = 18;
        const sHeight = 12;
        const rowGap = 8;

        const legendG = vis.gLegend.append("g")
            .attr("transform", `translate(${x}, ${y})`);

        items.forEach((it, i) => {
            const gy = legendG.append("g")
                .attr("transform", `translate(0,${i * (sHeight + rowGap)})`);

            gy.append("rect")
                .attr("class", "swatch")
                .attr("width", sWidth)
                .attr("height", sHeight)
                .attr("rx", 3)
                .attr("ry", 3)
                .attr("fill", it.color);

            gy.append("text")
                .attr("class", "item-label")
                .attr("x", sWidth + 8)
                .attr("y", sHeight - 2)
                .text(it.label);
        });
    }
}