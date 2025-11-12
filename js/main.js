let myVis3;

function initMainPage() {
    //myVis3 = new Vis3('vis3-root', 'data/alzheimers_region.csv');
}

document.addEventListener("DOMContentLoaded", initMainPage);

let vis3 = null;
document.addEventListener("DOMContentLoaded", ()=> {
    const vis3Section = document.querySelector("#vis3");
    if (!vis3Section) {
        return;
    }
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !vis3 && window.scrollY > 10 ) {
                vis3Inst = new Vis3('vis3-root', 'data/alzheimers_region.csv');
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.3
    });
    observer.observe(vis3Section);
});

