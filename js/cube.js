(function () {
    const cube = document.querySelector(".cube");
    const leftButton = document.getElementById("cube-left");
    const rightButton = document.getElementById("cube-right");
    const upButton = document.getElementById("cube-up");
    const downButton = document.getElementById("cube-down");

    let xAngle = 0;
    let yAngle = 0;

    function updateCube() {
        cube.style.transform = `rotateX(${xAngle}deg) rotateY(${yAngle}deg)`;
    }

    rightButton.addEventListener("click", () => {
        yAngle += 90;
        updateCube();
    });
    leftButton.addEventListener("click", () => {
        yAngle -= 90;
        updateCube();
    });
    upButton.addEventListener("click", () => {
        xAngle += 90;
        updateCube();
    });
    downButton.addEventListener("click", () => {
        xAngle -= 90;
        updateCube();
    });
    updateCube();
})
();
