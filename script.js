document.addEventListener("DOMContentLoaded", function () {
    // Scene buttons
    const scene1Button = document.getElementById("scene1-btn");
    const scene2Button = document.getElementById("scene2-btn");
    const scene3Button = document.getElementById("scene3-btn");

    // Annotation text
    const annotationText = document.getElementById("annotation-text");

    // SVG container
    const svg = d3.select("#scene");

    // State parameters
    const state = {
        currentScene: 1,
    };

    // Triggers for scene changes
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

    // Load the CSV data
    d3.csv("cars2017.csv").then(function (data) {
        // Prepare the data (parse strings to numbers where necessary)
        data.forEach(d => {
            d.EngineCylinders = +d.EngineCylinders;
            d.AverageHighwayMPG = +d.AverageHighwayMPG;
            d.AverageCityMPG = +d.AverageCityMPG;
        });

        // Function to update scene
        function updateScene() {
            svg.html(""); // Clear existing scene

            switch (state.currentScene) {
                case 1:
                    renderScene1(data);
                    annotationText.textContent = "Scene 1: Average Highway MPG by Car Make.";
                    break;
                case 2:
                    renderScene2(data);
                    annotationText.textContent = "Scene 2: Engine Cylinders vs Average City MPG.";
                    break;
                case 3:
                    renderScene3(data);
                    annotationText.textContent = "Scene 3: Fuel Type Distribution.";
                    break;
                default:
                    renderScene1(data);
                    annotationText.textContent = "Scene 1: Average Highway MPG by Car Make.";
            }
        }

        // Functions to render each scene
        function renderScene1(data) {
            // Aggregate data by car make
            const mpgByMake = d3.rollups(data, v => d3.mean(v, d => d.AverageHighwayMPG), d => d.Make);

            // Set dimensions and margins for the bar chart
            const margin = { top: 20, right: 30, bottom: 40, left: 100 },
                width = 800 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;

            const x = d3.scaleLinear()
                .domain([0, d3.max(mpgByMake, d => d[1])])
                .range([0, width]);

            const y = d3.scaleBand()
                .domain(mpgByMake.map(d => d[0]))
                .range([0, height])
                .padding(0.1);

            const chart = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            chart.append("g")
                .call(d3.axisLeft(y));

            chart.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            chart.selectAll(".bar")
                .data(mpgByMake)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", 0)
                .attr("y", d => y(d[0]))
                .attr("width", d => x(d[1]))
                .attr("height", y.bandwidth())
                .attr("fill", "#3f51b5");

            chart.selectAll(".label")
                .data(mpgByMake)
                .enter()
                .append("text")
                .attr("x", d => x(d[1]) - 3)
                .attr("y", d => y(d[0]) + y.bandwidth() / 2)
                .attr("dy", ".35em")
                .attr("fill", "#fff")
                .attr("text-anchor", "end")
                .text(d => d[1].toFixed(1));

            // Annotations for Scene 1
            const annotations = [
                {
                    note: {
                        label: "Highest Average Highway MPG",
                        title: "Acura",
                    },
                    x: x(35),
                    y: y("Acura"),
                    dy: -10,
                    dx: 40,
                    subject: { radius: 20 },
                },
            ];

            const makeAnnotations = d3.annotation()
                .type(d3.annotationCalloutCircle)
                .annotations(annotations);

            svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .call(makeAnnotations);
        }

        function renderScene2(data) {
            // Set dimensions and margins for the scatter plot
            const margin = { top: 20, right: 30, bottom: 50, left: 60 },
                width = 800 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;

            const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.EngineCylinders)])
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.AverageCityMPG)])
                .range([height, 0]);

            const chart = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            chart.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            chart.append("g")
                .call(d3.axisLeft(y));

            chart.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.EngineCylinders))
                .attr("cy", d => y(d.AverageCityMPG))
                .attr("r", 5)
                .attr("fill", "#f04e30")
                .attr("opacity", 0.6);

            // Annotations for Scene 2
            const annotations = [
                {
                    note: {
                        label: "Higher engine cylinders tend to have lower city MPG.",
                        title: "Trend Observation",
                    },
                    x: x(8),
                    y: y(12),
                    dy: -50,
                    dx: -70,
                    subject: { radius: 20, radiusPadding: 10 },
                },
            ];

            const makeAnnotations = d3.annotation()
                .type(d3.annotationCalloutCircle)
                .annotations(annotations);

            svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`)
                .call(makeAnnotations);
        }

        function renderScene3(data) {
            // Aggregate data by fuel type
            const fuelData = d3.rollups(data, v => v.length, d => d.Fuel);

            // Set dimensions and margins for the pie chart
            const width = 500,
                height = 500,
                radius = Math.min(width, height) / 2;

            const color = d3.scaleOrdinal(d3.schemeCategory10);

            const arc = d3.arc()
                .outerRadius(radius - 10)
                .innerRadius(0);

            const labelArc = d3.arc()
                .outerRadius(radius - 40)
                .innerRadius(radius - 40);

            const pie = d3.pie()
                .sort(null)
                .value(d => d[1]);

            const chart = svg.append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`);

            const g = chart.selectAll(".arc")
                .data(pie(fuelData))
                .enter()
                .append("g")
                .attr("class", "arc");

            g.append("path")
                .attr("d", arc)
                .style("fill", d => color(d.data[0]));

            g.append("text")
                .attr("transform", d => `translate(${labelArc.centroid(d)})`)
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .text(d => `${d.data[0]} (${d.data[1]})`);

            // Annotations for Scene 3
            const annotations = [
                {
                    note: {
                        label: "Gasoline is the most common fuel type.",
                        title: "Fuel Distribution",
                    },
                    x: 0,
                    y: 0,
                    dy: -100,
                    dx: 100,
                    subject: { radius: 60, radiusPadding: 10 },
                },
            ];

            const makeAnnotations = d3.annotation()
                .type(d3.annotationCalloutCircle)
                .annotations(annotations);

            svg.append("g")
                .attr("transform", `translate(${width / 2},${height / 2})`)
                .call(makeAnnotations);
        }

        // Initialize the first scene
        updateScene();
    });
});
