const csv_path = "brain_disease_distribution.csv";
const TARGET = "#vis1-root";
const VALUE_KEY = "Estimated Share of Global Brain Disease Cases (%)";

const fallback_data = [
    {Disease: "Migraine", [VALUE_KEY]: 45 },
    {Disease: "Alzheimer's Disease / Dementia", [VALUE_KEY]: 25 },
    {Disease: "Stroke", [VALUE_KEY]: 15 },
    {Disease: "Epilepsy", [VALUE_KEY]: 8 },
    {Disease: "Multiple Sclerosis (MS)", [VALUE_KEY]: 3 },
    {Disease: "Parkinson's Disease", [VALUE_KEY]: 2 },
    {Disease: "Other Neurological Disorders", [VALUE_KEY]: 2 }
];

function render(data) {
    data.forEach(d => { d[VALUE_KEY] = +d[VALUE_KEY]; });

    const width = document.querySelector(TARGET).getBoundingClientRect().width;
    const height = 440 * (width / 850);
    const margin = { top: 28, right: 250, bottom: 20, left: 20 };
    const radius = Math.min(width - margin.right - margin.left, height - margin.top - margin.bottom) / 2;

    d3.select(TARGET).selectAll("*").remove();

    const svg = d3.select(TARGET).append("svg").attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);

    const g = svg.append("g").attr("transform", `translate(${(width - margin.right) / 2}, ${height / 2 + 8})`);

    const color = d3.scaleOrdinal().domain(data.map(d => d.Disease)).range(d3.schemeSet2);

    const pie = d3.pie().sort(null).value(d => d[VALUE_KEY]);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    const tooltip = d3.select("body").append("div").attr("class", "vis1-tooltip").style("position", "absolute")
        .style("pointer-events", "none").style("background", "#fff").style("border", "1px solid #ccc")
        .style("border-radius", "6px").style("padding", "6px 8px").style("box-shadow", "0 2px 10px rgba(0,0,0,0.15)")
        .style("font-size", "13px").style("opacity", 0).style("color", "#000");

    const slices = g.selectAll("path.slice").data(pie(data)).join("path").attr("class", "slice")
        .attr("d", arc).attr("fill", d => color(d.data.Disease)).attr("stroke", "white")
        .style("stroke-width", "2px").style("opacity", 0.95).on("mouseover", (event, d) => {
            d3.select(event.currentTarget).attr("stroke", "#333").style("opacity", 1);

            tooltip.style("opacity", 1)
                .html(
                    `<strong>${d.data.Disease}</strong><br>${d.data[VALUE_KEY]}%`
                );
        })
        .on("mousemove", (event) => {
            const offset = 14;
            tooltip
                .style("left", (event.pageX + offset) + "px").style("top", (event.pageY + offset) + "px");
        })
        .on("mouseout", (event) => {
            d3.select(event.currentTarget).attr("stroke", "white").style("opacity", 0.95);
            tooltip.style("opacity", 0);
        });

    const legendX = width - margin.right + 20;
    const legendY = margin.top + 10;
    const itemSize = 14;
    const itemGap = 8;
    const lineHeight = itemSize + itemGap;

    const legend = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

    const legendItems = legend.selectAll("g.legend-item").data(data).join("g")
        .attr("class", "legend-item").attr("transform", (_, i) => `translate(0, ${i * lineHeight})`)
        .on("mouseover", (_, d) => {
            slices
                .transition().duration(150).style("opacity", s => (s.data.Disease === d.Disease ? 1 : 0.35));
        })
        .on("mouseout", () => {
            slices
                .transition().duration(150).style("opacity", 0.95);
        });

    legendItems.append("rect").attr("width", itemSize).attr("height", itemSize)
        .attr("rx", 2).attr("fill", d => color(d.Disease));

    legendItems.append("text").attr("x", itemSize + 8).attr("y", itemSize - 2)
        .style("font-size", "13px").style("font-weight", "500").text(d => `${d.Disease} (${d[VALUE_KEY]}%)`);
}

d3.csv(csv_path).then(render).catch(() => render(fallback_data));
