document.addEventListener("DOMContentLoaded", function () {
    const svg = d3.select("#scene");
    const margin = { top: 50, right: 50, bottom: 50, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const stateDropdown = document.getElementById("stateDropdown");
    const dateFromInput = document.getElementById("dateFrom");
    const dateToInput = document.getElementById("dateTo");

    let data; // Will store CSV data
    let currentState = "ALL"; // Default to "ALL"
    let dateFrom = "2020-01-21"; // Default date range start
    let dateTo = "2020-12-31"; // Default date range end

    // Fetch data and render the initial plot
    d3.csv("us-states.csv").then(csvData => {
        data = csvData.map(d => ({
            date: d3.timeParse("%Y-%m-%d")(d.date),
            state: d.state,
            cases: +d.cases,
            deaths: +d.deaths
        }));

        const uniqueStates = Array.from(new Set(data.map(d => d.state)));
        // Add an "ALL" option to the dropdown
        const allOption = document.createElement("option");
        allOption.value = "ALL";
        allOption.textContent = "ALL";
        stateDropdown.appendChild(allOption);

        uniqueStates.forEach(state => {
            const option = document.createElement("option");
            option.value = state;
            option.textContent = state;
            stateDropdown.appendChild(option);
        });

        renderScene1();
    });

    // Update the plot when the state or date range changes
    stateDropdown.addEventListener("change", () => {
        currentState = stateDropdown.value;
        renderScene1();
    });

    dateFromInput.addEventListener("change", () => {
        dateFrom = dateFromInput.value;
        renderScene1();
    });

    dateToInput.addEventListener("change", () => {
        dateTo = dateToInput.value;
        renderScene1();
    });

    function renderScene1() {
        // Filter data based on the selected date range
        const filteredData = data.filter(d => {
            return d.date >= new Date(dateFrom) && d.date <= new Date(dateTo);
        });

        // Set x and y scales
        const x = d3.scaleTime()
            .domain(d3.extent(filteredData, d => d.date))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.cases)])
            .range([height, 0]);

        // Clear previous SVG contents
        svg.html("");

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add x-axis
        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %d")).ticks(5))
            .append("text")
            .attr("fill", "#000")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("dy", "-0.5em")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Date");

        // Add y-axis
        chart.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("dy", "0.5em")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("transform", "rotate(-90)")
            .text("Cases");

        // Create a tooltip for displaying deaths information
        const tooltip = svg.append("text")
            .attr("class", "tooltip")
            .attr("x", margin.left)
            .attr("y", margin.top / 2)
            .attr("font-size", "14px")
            .attr("fill", "#333")
            .style("visibility", "hidden");

        if (currentState === "ALL") {
            // Group data by state
            const dataByState = d3.group(filteredData, d => d.state);

            const color = d3.scaleOrdinal()
                .domain(Array.from(dataByState.keys()))
                .range(d3.schemeCategory10);

            dataByState.forEach((stateData, state) => {
                // Add line for each state
                const line = chart.append("path")
                    .datum(stateData)
                    .attr("fill", "none")
                    .attr("stroke", color(state))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.date))
                        .y(d => y(d.cases))
                    )
                    .attr("id", `line-${state}`)
                    .on("click", () => {
                        const totalDeaths = d3.sum(stateData, d => d.deaths);
                        tooltip.text(`${state}: Total Deaths = ${totalDeaths}`)
                            .style("visibility", "visible")
                            .attr("x", width / 2)
                            .attr("text-anchor", "middle")
                            .attr("fill", color(state));
                    });

                // Add circles for each data point for tooltip
                chart.selectAll(`circle.${state}`)
                    .data(stateData)
                    .enter()
                    .append("circle")
                    .attr("class", state)
                    .attr("cx", d => x(d.date))
                    .attr("cy", d => y(d.cases))
                    .attr("r", 3)
                    .attr("fill", color(state))
                    .attr("opacity", 0.7)
                    .append("title")
                    .text(d => `${state}: ${d.cases}`);
            });

            // Add plot title
            svg.append("text")
                .attr("x", width / 2 + margin.left)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .attr("font-weight", "bold")
                .text(`COVID-19 Cases for All States (${dateFrom} to ${dateTo})`);

        } else {
            // Filter data for the selected state
            const stateData = filteredData.filter(d => d.state === currentState);

            // Add line for selected state
            const line = chart.append("path")
                .datum(stateData)
                .attr("fill", "none")
                .attr("stroke", "#f04e30")
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => x(d.date))
                    .y(d => y(d.cases))
                )
                .on("click", () => {
                    const totalDeaths = d3.sum(stateData, d => d.deaths);
                    tooltip.text(`${currentState}: Total Deaths = ${totalDeaths}`)
                        .style("visibility", "visible")
                        .attr("x", width / 2)
                        .attr("text-anchor", "middle")
                        .attr("fill", "#f04e30");
                });

            // Add circles for each data point
            chart.selectAll("circle")
                .data(stateData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.cases))
                .attr("r", 3)
                .attr("fill", "#f04e30")
                .attr("opacity", 0.8)
                .append("title")
                .text(d => `${currentState}: ${d.cases}`);

            // Add plot title
            svg.append("text")
                .attr("x", width / 2 + margin.left)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .attr("font-weight", "bold")
                .text(`COVID-19 Cases in ${currentState} (${dateFrom} to ${dateTo})`);
        }
    }
});
Key Changes and Additions
Tooltip for Deaths:

We added a text element (tooltip) at the top of the SVG to display the number of deaths. This text is initially hidden and only becomes visible when a state line is clicked.
Click Event on Lines:

the number of deaths is not showing up tho....
ChatGPT
Let's troubleshoot and refine the code to ensure the number of deaths is correctly displayed when a user clicks on a state in the visualization.

Here's a detailed approach to solving this issue:

Ensure Event Listeners Are Attached Correctly: We need to make sure the event listeners for clicking on the lines are properly set up.
Display Tooltip Properly: The tooltip should be correctly positioned and its visibility managed properly.
Calculate Total Deaths: Ensure the logic for calculating total deaths is correct and that the tooltip is updated with this information.
Let's review and correct the code to implement these features effectively.

Updated JavaScript Code (script.js)
javascript
Copy code
document.addEventListener("DOMContentLoaded", function () {
    const svg = d3.select("#scene");
    const margin = { top: 50, right: 50, bottom: 50, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const stateDropdown = document.getElementById("stateDropdown");
    const dateFromInput = document.getElementById("dateFrom");
    const dateToInput = document.getElementById("dateTo");

    let data; // Will store CSV data
    let currentState = "ALL"; // Default to "ALL"
    let dateFrom = "2020-01-21"; // Default date range start
    let dateTo = "2020-12-31"; // Default date range end

    // Fetch data and render the initial plot
    d3.csv("us-states.csv").then(csvData => {
        data = csvData.map(d => ({
            date: d3.timeParse("%Y-%m-%d")(d.date),
            state: d.state,
            cases: +d.cases,
            deaths: +d.deaths
        }));

        const uniqueStates = Array.from(new Set(data.map(d => d.state)));
        // Add an "ALL" option to the dropdown
        const allOption = document.createElement("option");
        allOption.value = "ALL";
        allOption.textContent = "ALL";
        stateDropdown.appendChild(allOption);

        uniqueStates.forEach(state => {
            const option = document.createElement("option");
            option.value = state;
            option.textContent = state;
            stateDropdown.appendChild(option);
        });

        renderScene1();
    });

    // Update the plot when the state or date range changes
    stateDropdown.addEventListener("change", () => {
        currentState = stateDropdown.value;
        renderScene1();
    });

    dateFromInput.addEventListener("change", () => {
        dateFrom = dateFromInput.value;
        renderScene1();
    });

    dateToInput.addEventListener("change", () => {
        dateTo = dateToInput.value;
        renderScene1();
    });

    function renderScene1() {
        // Filter data based on the selected date range
        const filteredData = data.filter(d => {
            return d.date >= new Date(dateFrom) && d.date <= new Date(dateTo);
        });

        // Set x and y scales
        const x = d3.scaleTime()
            .domain(d3.extent(filteredData, d => d.date))
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.cases)])
            .range([height, 0]);

        // Clear previous SVG contents
        svg.html("");

        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Add x-axis
        chart.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b %d")).ticks(5))
            .append("text")
            .attr("fill", "#000")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("dy", "-0.5em")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text("Date");

        // Add y-axis
        chart.append("g")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("fill", "#000")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("dy", "0.5em")
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .attr("transform", "rotate(-90)")
            .text("Cases");

        // Create a tooltip for displaying deaths information
        const tooltip = svg.append("text")
            .attr("class", "tooltip")
            .attr("x", margin.left)
            .attr("y", margin.top - 20)
            .attr("font-size", "14px")
            .attr("fill", "#333")
            .style("visibility", "hidden")
            .style("background-color", "white")
            .style("padding", "4px")
            .style("border", "1px solid #999");

        if (currentState === "ALL") {
            // Group data by state
            const dataByState = d3.group(filteredData, d => d.state);

            const color = d3.scaleOrdinal()
                .domain(Array.from(dataByState.keys()))
                .range(d3.schemeCategory10);

            dataByState.forEach((stateData, state) => {
                // Add line for each state
                const line = chart.append("path")
                    .datum(stateData)
                    .attr("fill", "none")
                    .attr("stroke", color(state))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.date))
                        .y(d => y(d.cases))
                    )
                    .attr("id", `line-${state}`)
                    .on("click", () => {
                        // Calculate total deaths for the state in the selected date range
                        const totalDeaths = d3.sum(stateData, d => d.deaths);

                        // Display tooltip with total deaths
                        tooltip.text(`${state}: Total Deaths = ${totalDeaths}`)
                            .style("visibility", "visible")
                            .attr("x", width / 2)
                            .attr("text-anchor", "middle")
                            .attr("fill", color(state));
                    });

                // Add circles for each data point for tooltip
                chart.selectAll(`circle.${state}`)
                    .data(stateData)
                    .enter()
                    .append("circle")
                    .attr("class", state)
                    .attr("cx", d => x(d.date))
                    .attr("cy", d => y(d.cases))
                    .attr("r", 3)
                    .attr("fill", color(state))
                    .attr("opacity", 0.7)
                    .append("title")
                    .text(d => `${state}: ${d.cases}`);
            });

            // Add plot title
            svg.append("text")
                .attr("x", width / 2 + margin.left)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .attr("font-weight", "bold")
                .text(`COVID-19 Cases for All States (${dateFrom} to ${dateTo})`);

        } else {
            // Filter data for the selected state
            const stateData = filteredData.filter(d => d.state === currentState);

            // Add line for selected state
            const line = chart.append("path")
                .datum(stateData)
                .attr("fill", "none")
                .attr("stroke", "#f04e30")
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => x(d.date))
                    .y(d => y(d.cases))
                )
                .on("click", () => {
                    // Calculate total deaths for the selected state in the date range
                    const totalDeaths = d3.sum(stateData, d => d.deaths);

                    // Display tooltip with total deaths
                    tooltip.text(`${currentState}: Total Deaths = ${totalDeaths}`)
                        .style("visibility", "visible")
                        .attr("x", width / 2)
                        .attr("text-anchor", "middle")
                        .attr("fill", "#f04e30");
                });

            // Add circles for each data point
            chart.selectAll("circle")
                .data(stateData)
                .enter()
                .append("circle")
                .attr("cx", d => x(d.date))
                .attr("cy", d => y(d.cases))
                .attr("r", 3)
                .attr("fill", "#f04e30")
                .attr("opacity", 0.8)
                .append("title")
                .text(d => `${currentState}: ${d.cases}`);

            // Add plot title
            svg.append("text")
                .attr("x", width / 2 + margin.left)
                .attr("y", margin.top / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "20px")
                .attr("font-weight", "bold")
                .text(`COVID-19 Cases in ${currentState} (${dateFrom} to ${dateTo})`);
        }
    }
});
