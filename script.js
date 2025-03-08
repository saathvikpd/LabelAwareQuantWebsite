// File paths for different bit widths
const fileMap = {
  "3": "Quantization_Log_resnet50_3bit.csv",
  "4": "Quantization_Log_resnet50_4bit.csv",
  "8": "Quantization_Log_resnet50_8bit.csv",
  "16": "Quantization_Log_resnet50_16bit.csv",
  "32": "Quantization_Log_resnet50_32bit.csv"
};

// Set up chart dimensions
const margin = { top: 40, right: 40, bottom: 50, left: 70 },
      width = 800 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// Create SVG element
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Define color mappings for different bit-widths
const colorMap = {
  "Original Top1 Accuracy": {
    "3": "#FFA500", "4": "#FF8C00", "8": "#E67E22", "16": "#D35400", "32": "#A04000"
  },
  "Quantized Top1 Accuracy": {
    "3": "#1976D2", "4": "#1E88E5", "8": "#42A5F5", "16": "#64B5F6", "32": "#90CAF9"
  },
  "Fine-Tuned Top1 Accuracy": {
    "3": "#43A047", "4": "#2E7D32", "8": "#66BB6A", "16": "#81C784", "32": "#A5D6A7"
  },
  "Quant+FT Top1 Accuracy": {
    "3": "#E53935", "4": "#D32F2F", "8": "#FF7043", "16": "#F44336", "32": "#EF9A9A"
  }
};

// Function to get selected values from a multi-select dropdown
function getSelectedValues(id) {
  return Array.from(document.getElementById(id).selectedOptions).map(option => option.value);
}

// Load and update data
function updateChart() {
  const bitWidths = getSelectedValues("bit-width");
  const yAxisSelection = getSelectedValues("y-axis");

  let allData = [];

  // Load all selected bit-width CSVs
  Promise.all(bitWidths.map(bit => d3.csv("./logfiles/" + fileMap[bit]))).then(files => {
    files.forEach((data, index) => {
      data.forEach(d => {
        d["Median_KL"] = +d["Median_KL"];
        yAxisSelection.forEach(yAxis => d[yAxis] = +d[yAxis]);
        d.bitWidth = bitWidths[index]; // Attach bit-width label
        allData.push(d);
      });
    });

    // Define scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(allData, d => d["Median_KL"]))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(allData, d => d3.max(yAxisSelection, yAxis => d[yAxis]))])
      .range([height, 0]);

    // Remove old plots
    svg.selectAll(".scatter-group, .trend-line, .axis").remove();

    // Draw axes
    svg.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .attr("class", "axis")
      .call(d3.axisLeft(yScale));

    // Draw scatter plots for each Y-axis value & bit-width
    yAxisSelection.forEach(yAxis => {
      bitWidths.forEach(bit => {
        const dataSubset = allData.filter(d => d.bitWidth === bit);
        const color = colorMap[yAxis][bit];

        const scatterGroup = svg.append("g").attr("class", "scatter-group");

        scatterGroup.selectAll("circle")
          .data(dataSubset)
          .enter()
          .append("circle")
          .attr("cx", d => xScale(d["Median_KL"]))
          .attr("cy", d => yScale(d[yAxis]))
          .attr("r", 5)
          .attr("fill", color)
          .attr("opacity", 0.8)
          .attr("stroke", "#333")
          .attr("stroke-width", 1);

        // Add log trend line
        addLogLine(dataSubset, xScale, yScale, yAxis, color);
      });
    });

    // Update legend
    updateLegend(yAxisSelection, bitWidths);
  });
}

// Function to compute and draw a logarithmic best-fit line
function addLogLine(data, xScale, yScale, yAxis, color) {
  if (data.length < 2) return; // Not enough data points for regression

  // Sort data by x value
  const sortedData = data.sort((a, b) => a["Median_KL"] - b["Median_KL"]);

  // Convert to log function: y = a * ln(x) + b
  const xVals = sortedData.map(d => Math.log(d["Median_KL"]));
  const yVals = sortedData.map(d => d[yAxis]);

  // Compute regression coefficients using least squares
  const n = xVals.length;
  const sumX = d3.sum(xVals);
  const sumY = d3.sum(yVals);
  const sumXY = d3.sum(xVals.map((x, i) => x * yVals[i]));
  const sumXX = d3.sum(xVals.map(x => x * x));

  const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - a * sumX) / n;

  // Compute trend line points
  const trendData = sortedData.map(d => ({
    x: d["Median_KL"],
    y: a * Math.log(d["Median_KL"]) + b
  }));

  // Draw line
  svg.append("path")
    .datum(trendData)
    .attr("class", "trend-line")
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .attr("d", d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
    );
}

// Function to update the legend
function updateLegend(yAxisSelection, bitWidths) {
  d3.select("#chart").selectAll(".legend").remove();

  const legend = d3.select("#chart")
    .append("div")
    .attr("class", "legend")
    .style("display", "flex")
    .style("justify-content", "center")
    .style("margin-top", "10px");

  yAxisSelection.forEach(yAxis => {
    bitWidths.forEach(bit => {
      const color = colorMap[yAxis][bit];
      legend.append("div")
        .style("display", "flex")
        .style("align-items", "center")
        .style("margin-right", "15px")
        .html(`<svg width="20" height="20"><circle cx="10" cy="10" r="8" fill="${color}"></circle></svg> ${yAxis} (${bit}-bit)`);
    });
  });
}

// Add event listeners for multi-select
document.getElementById("bit-width").addEventListener("change", updateChart);
document.getElementById("y-axis").addEventListener("change", updateChart);

// Initialize chart
updateChart();
