(function () {
    let GridAggregator = function() {
        this.bins = { age: 2, phq: 1 };
        this.xDomain = [0, 100];
        this.yDomain = [0, 27];
        this.FIELDS = {
            age: "Age",
            phq: "PHQ9_Total",
            migraine: "MigraineDiagnosis",
            smoker: "CurrentSmokerStatus",
            gender: "Gender",
            marital: "MaritalStatus"
        };
    };

    GridAggregator.prototype.setDomains = function() {
        this.xDomain = [0, 85];
        this.yDomain = [0, 28];
    };



    GridAggregator.prototype.applyFilters = function(raw, f) {
        return raw.filter(d => {
            if (f.gender && d[this.FIELDS.gender] !== f.gender) return false;
            if (f.smoker) {
                const val = d[this.FIELDS.smoker];
                if (f.smoker === "Yes") {
                    if (val === "Not at all") return false;
                } else if (f.smoker === "No") {
                    if (val !== "Not at all") return false;
                } else {
                    if (val !== f.smoker) return false;
                }
            }

            GridAggregator.prototype.applyFilters = function(raw, f) {
                return raw.filter(d => {
                    if (f.gender && d[this.FIELDS.gender] !== f.gender) return false;

                    if (f.smoker) {
                        const val = d[this.FIELDS.smoker];
                        if (f.smoker === "Yes") {
                            if (val === "Not at all") return false;
                        } else if (f.smoker === "No") {
                            if (val !== "Not at all") return false;
                        } else {
                            if (val !== f.smoker) return false;
                        }
                    }

                    // ---- NEW marital logic ----
                    if (f.marital) {
                        const m = d[this.FIELDS.marital];  // raw MaritalStatus from CSV
                        if (f.marital === "Unmarried") {
                            // keep ONLY rows where marital is blank / missing
                            // (null, undefined, or empty/whitespace string)
                            if (m != null && m.toString().trim() !== "") return false;
                        } else {
                            // normal case: must exactly match the selected status
                            if (m !== f.marital) return false;
                        }
                    }

                    return true;
                });
            };
        });
    };

    GridAggregator.prototype.binOf = function(v, step) {
        if (v == null || isNaN(v)) return null;
        return Math.floor(v / step) * step;
    };

    GridAggregator.prototype.computeGrid = function(filtered) {
        let ageStep = this.bins.age, phqStep = this.bins.phq;
        let map = new Map();
        for (let i = 0; i < filtered.length; i++) {
            let r = filtered[i];
            let a = this.binOf(+r[this.FIELDS.age], ageStep);
            let p = this.binOf(+r[this.FIELDS.phq], phqStep);
            if (a == null || p == null) continue;
            let key = a + "|" + p;
            if (!map.has(key)) map.set(key, { age: a, phq: p, n: 0, yes: 0 });
            let cell = map.get(key);
            cell.n += 1;
            if (r[this.FIELDS.migraine] === "Yes") cell.yes += 1;
        }
        let grid = [];
        for (let cell of map.values()) {
            let prob = cell.n > 0 ? (cell.yes / cell.n) : 0;
            grid.push({ age: cell.age, phq: cell.phq, prob: prob, n: cell.n });
        }
        return grid;
    };

    window.GridAggregator = GridAggregator;
})();

GridAggregator.prototype.indexGrid = function(grid) {
    let idx = new Map();
    for (let i = 0; i < grid.length; i++) {
        let c = grid[i];
        idx.set(c.age + "|" + c.phq, c);
    }
    return idx;
};
