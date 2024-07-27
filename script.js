document.addEventListener("DOMContentLoaded", function () {
  const scene1Button = document.getElementById("scene1-btn");
  const scene2Button = document.getElementById("scene2-btn");
  const scene3Button = document.getElementById("scene3-btn");
  const annotationText = document.getElementById("annotation-text");
  const svg = d3.select("#scene");
  const state = {
    currentScene: 1,
  };

  scene1Button.addEventListener("click", function () {
    state.currentScene = 1;
    updateScene();
  });

  scene2Button.addEventListener("click", function () {
    state.currentScene = 2;
    updateScene();
  });

  scene3Button.addEventListener("click", function () {
    state.currentScene = 3;
    updateScene();
  });

  function updateScene() {
    svg.html("");
    switch (state.currentScene) {
      case 1:
        renderScene1();
        annotationText.textContent = "Scene 1";
        break;
      case 2:
        renderScene2();
        annotationText.textContent = "Scene 2";
        break;
      case 3:
        renderScene3();
        annotationText.textContent = "Scene 3";
        break;
      default:
        renderScene1();
        annotationText.textContent = "Scene 1";
    }
  }

  function renderScene1() {
    svg
      .append("circle")
      .attr("cx", 200)
      .attr("cy", 200)
      .attr("r", 50)
      .attr("fill", "red");
  }

  function renderScene2() {
    svg
      .append("rect")
      .attr("x", 150)
      .attr("y", 150)
      .attr("width", 100)
      .attr("height", 100)
      .attr("fill", "green");
  }

  function renderScene3() {
    svg
      .append("line")
      .attr("x1", 100)
      .attr("y1", 100)
      .attr("x2", 300)
      .attr("y2", 300)
      .attr("stroke", "blue")
      .attr("stroke-width", 5);
  }
  updateScene();
});
