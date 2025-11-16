(function () {
    let HeatmapCanvas = function(canvasId, axesLayer) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.axes = axesLayer;
        this.cScale = d3.scaleLinear()
            .domain([0.00, 0.20, 0.40])
            .range(["#ff9e99", "#cc0000", "#300000"])
            .clamp(true);
    };

    HeatmapCanvas.prototype.setColorDomain = function(minP, maxP) {
        let lo = Math.max(0, Math.floor((minP || 0) * 100) / 100);
        let hi = Math.min(1, Math.ceil((maxP || 0.4) * 100) / 100);
        if (hi === lo)
        {
            hi = lo + 0.01;
        }
        let mid = lo + (hi - lo) / 2;
        this.cScale.domain([lo, mid, hi]);
    };

    HeatmapCanvas.prototype.clear = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    HeatmapCanvas.prototype.drawGrid = function(grid, ageStep, phqStep) {
        this.clear();
        for (let i = 0; i < grid.length; i++) {
            let d = grid[i];
            let x1 = this.axes.x(d.age);
            let x2 = this.axes.x(d.age + ageStep);
            let y1 = this.axes.y(d.phq);
            let y2 = this.axes.y(d.phq + phqStep);
            this.ctx.fillStyle = this.cScale(d.prob);
            this.ctx.fillRect(x1, y2, (x2 - x1), (y1 - y2));
        }
    };

    window.HeatmapCanvas = HeatmapCanvas;
})();
