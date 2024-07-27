function calculateBestFitLine(data) {
    const xSeries = data.map(d => d.EngineCylinders);
    const ySeries = data.map(d => d.AverageCityMPG);
    const xMean = d3.mean(xSeries);
    const yMean = d3.mean(ySeries);

    // Calculate coefficients for the line of best fit
    const numerator = d3.sum(xSeries.map((x, i) => (x - xMean) * (ySeries[i] - yMean)));
    const denominator = d3.sum(xSeries.map(x => (x - xMean) ** 2));

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Calculate R^2
    const yPredicted = xSeries.map(x => slope * x + intercept);
    const ssTotal = d3.sum(ySeries.map(y => (y - yMean) ** 2));
    const ssResidual = d3.sum(ySeries.map((y, i) => (y - yPredicted[i]) ** 2));
    const rSquared = 1 - ssResidual / ssTotal;

    return {
        x1: d3.min(xSeries),
        y1: slope * d3.min(xSeries) + intercept,
        x2: d3.max(xSeries),
        y2: slope * d3.max(xSeries) + intercept,
        rSquared: rSquared
    };
}

document.addEventListener("DOMContentLoaded", function () {
    // Load the CSV data
    d3.csv("cars2017.csv").then(function (data) {
        // Prepare the data (parse strings to numbers where necessary)
        data.forEach(d => {
            d.EngineCylinders = +d.EngineCylinders;
            d.AverageHighwayMPG = +d.AverageHighwayMPG;
            d.AverageCityMPG = +d.AverageCityMPG;
        });
        
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

        // Initialize the first scene
        updateScene();

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

            const y = d3.scaleLinear()
                .domain([0, 140])  // Set the scale between 0 and 140
                .range([height, 0]);

            const y = d3.scaleLinear()
                .domain([0, 140])  // Set the scale between 0 and 140
                .range([height, 0]);

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
            const margin = { top: 40, right: 30, bottom: 70, left: 70 },
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
        
            // Append X axis
            chart.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .append("text") // Axis title
                .attr("class", "axis-title")
                .attr("x", width / 2)
                .attr("y", 40)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .text("Engine Cylinders");
        
            // Append Y axis
            chart.append("g")
                .call(d3.axisLeft(y))
                .append("text") // Axis title
                .attr("class", "axis-title")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -50)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .text("Average City MPG");
        
            // Plot title
            chart.append("text")
                .attr("class", "plot-title")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text("Engine Cylinders vs. Average City MPG");
        
            // Scatter plot circles
            chart.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.EngineCylinders))
                .attr("cy", d => y(d.AverageCityMPG))
                .attr("r", 5)
                .attr("fill", "#f04e30")
                .attr("opacity", 0.6);
        
            // Line of best fit
            const lineData = calculateBestFitLine(data);
            chart.append("line")
                .attr("class", "best-fit-line")
                .attr("x1", x(lineData.x1))
                .attr("y1", y(lineData.y1))
                .attr("x2", x(lineData.x2))
                .attr("y2", y(lineData.y2))
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2);
        
            // R^2 Text
            chart.append("text")
                .attr("x", width - 100)
                .attr("y", 20)
                .attr("fill", "steelblue")
                .style("font-size", "12px")
                .text(`R² = ${lineData.rSquared.toFixed(3)}`);
        
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
            // // Aggregate data by fuel type
            // const fuelData = d3.rollups(data, v => v.length, d => d.Fuel);

            // // Set dimensions and margins for the pie chart
            // const width = 500,
            //     height = 500,
            //     radius = Math.min(width, height) / 2;

            // const color = d3.scaleOrdinal(d3.schemeCategory10);

            // const arc = d3.arc()
            //     .outerRadius(radius - 10)
            //     .innerRadius(0);

            // const labelArc = d3.arc()
            //     .outerRadius(radius - 40)
            //     .innerRadius(radius - 40);

            // const pie = d3.pie()
            //     .sort(null)
            //     .value(d => d[1]);

            // const chart = svg.append("g")
            //     .attr("transform", `translate(${width / 2},${height / 2})`);

            // const g = chart.selectAll(".arc")
            //     .data(pie(fuelData))
            //     .enter()
            //     .append("g")
            //     .attr("class", "arc");

            // g.append("path")
            //     .attr("d", arc)
            //     .style("fill", d => color(d.data[0]));

            // g.append("text")
            //     .attr("transform", d => `translate(${labelArc.centroid(d)})`)
            //     .attr("dy", ".35em")
            //     .attr("text-anchor", "middle")
            //     .text(d => `${d.data[0]} (${d.data[1]})`);

            // // Annotations for Scene 3
            // const annotations = [
            //     {
            //         note: {
            //             label: "Gasoline is the most common fuel type.",
            //             title: "Fuel Distribution",
            //         },
            //         x: 0,
            //         y: 0,
            //         dy: -100,
            //         dx: 100,
            //         subject: { radius: 60, radiusPadding: 10 },
            //     },
            // ];

            // const makeAnnotations = d3.annotation()
            //     .type(d3.annotationCalloutCircle)
            //     .annotations(annotations);

            // svg.append("g")
            //     .attr("transform", `translate(${width / 2},${height / 2})`)
            //     .call(makeAnnotations);
            // Set dimensions and margins for the scatter plot
            const margin = { top: 40, right: 30, bottom: 70, left: 70 },
                width = 800 - margin.left - margin.right,
                height = 400 - margin.top - margin.bottom;
        
            const x = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.EngineCylinders)])
                .range([0, width]);
        
            const y = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.AverageHighwayMPG)])
                .range([height, 0]);
        
            const chart = svg.append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);
        
            // Append X axis
            chart.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x))
                .append("text") // Axis title
                .attr("class", "axis-title")
                .attr("x", width / 2)
                .attr("y", 40)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .text("Engine Cylinders");
        
            // Append Y axis
            chart.append("g")
                .call(d3.axisLeft(y))
                .append("text") // Axis title
                .attr("class", "axis-title")
                .attr("transform", "rotate(-90)")
                .attr("x", -height / 2)
                .attr("y", -50)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .text("Average Highway MPG");
        
            // Plot title
            chart.append("text")
                .attr("class", "plot-title")
                .attr("x", width / 2)
                .attr("y", -10)
                .attr("fill", "black")
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text("Engine Cylinders vs. Average Highway MPG");
        
            // Scatter plot circles
            chart.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.EngineCylinders))
                .attr("cy", d => y(d.AverageHighwayMPG))
                .attr("r", 5)
                .attr("fill", "#f04e30")
                .attr("opacity", 0.6);
        
            // Line of best fit
            const lineData = calculateBestFitLine(data);
            chart.append("line")
                .attr("class", "best-fit-line")
                .attr("x1", x(lineData.x1))
                .attr("y1", y(lineData.y1))
                .attr("x2", x(lineData.x2))
                .attr("y2", y(lineData.y2))
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2);
        
            // R^2 Text
            chart.append("text")
                .attr("x", width - 100)
                .attr("y", 20)
                .attr("fill", "steelblue")
                .style("font-size", "12px")
                .text(`R² = ${lineData.rSquared.toFixed(3)}`);
        
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
    });
});
