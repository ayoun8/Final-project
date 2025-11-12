let WIDTH = 960, HEIGHT = 600;
let M = { top: 90, right: 60, bottom: 70, left: 80 };

let app = {
    raw: [],
    filters: { gender: "", smoker: "", marital: "" },
    grid: [],
    gridIndex: null
};

let tooltip = (function () {
    let el = document.createElement('div');
    el.id = 'tooltip';
    el.style.position = 'absolute';
    el.style.pointerEvents = 'none';
    el.style.background = '#151515';
    el.style.color = '#e7e7ea';
    el.style.border = '1px solid #333';
    el.style.borderRadius = '6px';
    el.style.padding = '6px 8px';
    el.style.fontSize = '12px';
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
})();
let canvas = document.getElementById("heat");

const dpr = window.devicePixelRatio || 1;
const cssW = canvas.width;
const cssH = canvas.height;
canvas.style.width  = cssW + "px";
canvas.style.height = cssH + "px";
canvas.width  = Math.round(cssW * dpr);
canvas.height = Math.round(cssH * dpr);


function parseRow(d) {
    d.Age = +d.Age;
    d.PHQ9_Total = +d.PHQ9_Total;
    return d;
}

function bindControls(updateFn) {
    let gender = document.getElementById("gender");
    let smoker = document.getElementById("smoker");
    let marital = document.getElementById("marital");
    let reset = document.getElementById("reset");

    let onChange = function() {
        app.filters.gender = gender.value;
        app.filters.smoker = smoker.value;
        app.filters.marital = marital.value;
        updateFn();
    };

    gender.addEventListener("change", onChange);
    smoker.addEventListener("change", onChange);
    marital.addEventListener("change", onChange);

    reset.addEventListener("click", function() {
        gender.value = "";
        smoker.value = "";
        marital.value = "";
        app.filters = { gender: "", smoker: "", marital: "" };
        updateFn();
    });
}


function init() {
    let axes = new AxesLayer("#overlay", WIDTH, HEIGHT, M);
    let heat = new HeatmapCanvas("heat", axes);
    const dpr = window.devicePixelRatio || 1;
    heat.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let agg = new GridAggregator();

    d3.csv("./data/nhanes_2017_2023_tableau_ready.csv", parseRow).then(function(data) {
        app.raw = data;
        agg.setDomains(app.raw);
        axes.setDomains(agg.xDomain, agg.yDomain);
        axes.render();
        drawAxisLabels("#overlay", M);
        d3.selectAll(".x-axis-label, .y-axis-label")
            .attr("fill", "white");


        let update = function() {
            // 1) filter + aggregate
            let filtered = agg.applyFilters(app.raw, app.filters);
            let grid = agg.computeGrid(filtered);

            // 2) handle empty
            if (!grid.length) {
                app.grid = [];
                app.gridIndex = null;
                heat.clear();
                axes.render();
                drawAxisLabels("#overlay", M);
                d3.selectAll(".x-axis-label, .y-axis-label")
                    .attr("fill", "white");
                return;
            }

            // 3) save and index for tooltip lookups
            app.grid = grid;
            app.gridIndex = agg.indexGrid(grid);

            // 4) color domain + draw + axes
            let minP = d3.min(grid, d => d.prob) || 0;
            let maxP = d3.max(grid, d => d.prob) || 0.4;
            heat.setColorDomain(minP, maxP);
            heat.drawGrid(grid, agg.bins.age, agg.bins.phq);
            axes.render();
            drawAxisLabels("#overlay", M);
            d3.selectAll(".x-axis-label, .y-axis-label")
                .attr("fill", "white");

            drawLegend(heat.cScale, "#overlay", M);
        };


        // Hover -> show bin info
        canvas.addEventListener("mousemove", function (evt) {
            // guard if grid not ready
            if (!app.gridIndex) { tooltip.style.display = "none"; return; }

            let rect = canvas.getBoundingClientRect();
            let mx = evt.clientX - rect.left;
            let my = evt.clientY - rect.top;

            // Pixel -> data coords
            let age = axes.x.invert(mx);
            let phq = axes.y.invert(my);

            // Outside domain? hide
            let xd = axes.x.domain(), yd = axes.y.domain();
            if (age < xd[0] || age > xd[1] || phq < yd[0] || phq > yd[1]) {
                tooltip.style.display = "none";
                return;
            }

            // Snap to bin lower edges
            let a0 = Math.floor(age / agg.bins.age) * agg.bins.age;
            let p0 = Math.floor(phq / agg.bins.phq) * agg.bins.phq;

            // Lookup cell
            let key = a0 + "|" + p0;
            let cell = app.gridIndex.get(key);

            if (cell && cell.n > 0) {
                tooltip.style.display = "block";
                tooltip.style.left = (evt.pageX + 12) + "px";
                tooltip.style.top  = (evt.pageY + 12) + "px";
                tooltip.innerHTML =
                    "Age: " + a0 + "–" + (a0 + agg.bins.age) + "<br>" +
                    "PHQ-9: " + p0 + "–" + (p0 + agg.bins.phq) + "<br>" +
                    "n = " + cell.n + "<br>" +
                    "<b>" + d3.format(".1%")(cell.prob) + "</b> migraine";
            } else {
                tooltip.style.display = "none";
            }
        });

        canvas.addEventListener("mouseleave", function () {
            tooltip.style.display = "none";
        });


        bindControls(update);
        d3.select("#overlay").style("pointer-events", "none");
        update();
    });
}

function drawLegend(cScale, overlaySelector, M) {
    const svg = d3.select(overlaySelector);

    svg.selectAll("g.legend").remove(); // This line fixed the legend percents being overlapping issue

    const plotW = WIDTH  - M.left - M.right;
    const legendWidth   = Math.min(300, plotW);   // <= NEVER wider than the plot
    const legendHeight  = 12;
    const legendSpacing = 18;                     // tick axis height + gap
    const legendTitleGap = 12;
    const legendX = M.left;
    const legendY = M.top - (legendHeight + legendSpacing + legendTitleGap);

    const g = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${legendX}, ${legendY})`);

    let defs = svg.select("defs");
    if (defs.empty()) defs = svg.append("defs");

    const gradId = "legend-gradient";
    let grad = defs.select(`#${gradId}`);
    if (grad.empty()) {
        grad = defs.append("linearGradient")
            .attr("id", gradId)
            .attr("x1", "0%").attr("x2", "100%")
            .attr("y1", "0%").attr("y2", "0%");
    }
    const rng = cScale.range();
    grad.selectAll("stop")
        .data([
            { offset: "0%",   color: rng[0] },
            { offset: "100%", color: rng[rng.length - 1] }
        ])
        .join("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    g.append("rect")
        .attr("width",  legendWidth)
        .attr("height", legendHeight)
        .attr("fill", `url(#${gradId})`)
        .attr("rx", 2);

    const domainExtent = d3.extent(cScale.domain()); // works if domain is [0, .2, .4] or [0,1]
    const legendScale  = d3.scaleLinear()
        .domain([domainExtent[0], domainExtent[1]])
        .range([0, legendWidth]);

    const isProbDomain = domainExtent[1] <= 1 && domainExtent[0] >= 0;
    const fmt = isProbDomain ? d3.format(".0%") : d3.format(".2f");

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(4)
        .tickFormat(fmt);

    g.append("g")
        .attr("transform", `translate(0, ${legendHeight + 6})`)
        .call(legendAxis);

    g.append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", -6)
        .text(isProbDomain ? "Migraine probability" : "Legend");

    d3.selectAll(".legend .tick text, .legend-title")
        .attr("fill", "white"); // sets the color cause bg color undecided
}

function drawAxisLabels(overlaySelector, M) {
    const svg = d3.select(overlaySelector);

    const labelsG = svg.selectAll("g.axis-labels")
        .data([0])
        .join("g")
        .attr("class", "axis-labels");

    labelsG.selectAll("text.x-axis-label")
        .data([0])
        .join("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", M.left + (WIDTH - M.left - M.right) / 2)
        .attr("y", HEIGHT - 10)
        .text("Age (years)");
    labelsG.selectAll("text.y-axis-label")
        .data([0])
        .join("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${20}, ${M.top + (HEIGHT - M.top - M.bottom) / 2}) rotate(-90)`)
        .text("PHQ-9 score");
}


init();
