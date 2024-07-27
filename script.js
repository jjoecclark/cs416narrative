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

        if (currentState === "ALL") {
            // Group data by state
            const dataByState = d3.group(filteredData, d => d.state);

            const color = d3.scaleOrdinal()
                .domain(Array.from(dataByState.keys()))
                .range(d3.schemeCategory10);

            dataByState.forEach((stateData, state) => {
                // Add line for each state
                chart.append("path")
                    .datum(stateData)
                    .attr("fill", "none")
                    .attr("stroke", color(state))
                    .attr("stroke-width", 1.5)
                    .attr("d", d3.line()
                        .x(d => x(d.date))
                        .y(d => y(d.cases))
                    )
                    .append("title")
                    .text(state);

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
            chart.append("path")
                .datum(stateData)
                .attr("fill", "none")
                .attr("stroke", "#f04e30")
                .attr("stroke-width", 2)
                .attr("d", d3.line()
                    .x(d => x(d.date))
                    .y(d => y(d.cases))
                );

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
