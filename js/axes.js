let AxesLayer = function(svgSel, width, height, margin) {
    this.svg = d3.select(svgSel);
    this.W = width; this.H = height; this.M = margin;
    this.innerW = this.W - this.M.left - this.M.right;
    this.innerH = this.H - this.M.top - this.M.bottom;
    this.x = d3.scaleLinear().range([this.M.left, this.M.left + this.innerW]);
    this.y = d3.scaleLinear().range([this.M.top + this.innerH, this.M.top]);
    this.xAxis = d3.axisBottom(this.x);
    this.yAxis = d3.axisLeft(this.y);
    this.gX = this.svg.select(".x-axis");
    this.gY = this.svg.select(".y-axis");
};
AxesLayer.prototype.setDomains = function(xDomain, yDomain){ this.x.domain(xDomain); this.y.domain(yDomain); };
AxesLayer.prototype.render = function(){
    this.gX.attr("class", "x-axis axis").attr("transform", `translate(0,${this.M.top + this.innerH})`).call(this.xAxis);
    this.gY.attr("class", "y-axis axis").attr("transform", `translate(${this.M.left},0)`).call(this.yAxis);
};
window.AxesLayer = AxesLayer;
