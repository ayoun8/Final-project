let myVis3;

function initMainPage() {
    myVis3 = new Vis3('vis3-root', 'data/alzheimers_region.csv');
}

document.addEventListener("DOMContentLoaded", initMainPage);
