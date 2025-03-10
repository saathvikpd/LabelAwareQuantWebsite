// File paths for different bit widths
const fileMap = {
  "3": "Quantization_Log_resnet50_3bit.csv",
  "4": "Quantization_Log_resnet50_4bit.csv",
  "8": "Quantization_Log_resnet50_8bit.csv",
  "16": "Quantization_Log_resnet50_16bit.csv",
  "32": "Quantization_Log_resnet50_32bit.csv",
  "mp4": "Quantization_Log_resnet50_mp4bit.csv",
  "mpasc4": "Quantization_Log_resnet50_mpasc4bit.csv"
};

// Set up chart dimensions (increase right margin for legend)
const margin = { top: 40, right: 300, bottom: 50, left: 70 }, // More right space for legend
      width = 900 - margin.left - margin.right,
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
  "Original Top1 Accuracy": { "3": "#FFA500", "4": "#FF8C00", "8": "#E67E22", "16": "#D35400", "32": "#A04000" , "mp4": "#EDAF97", "mpasc4": "#FE938C"},
  "Quantized Top1 Accuracy": { "3": "#1976D2", "4": "#1E88E5", "8": "#42A5F5", "16": "#64B5F6", "32": "#90CAF9" , "mp4": "#B9C0DA", "mpasc4": "#4ECDC4"},
  "Fine-Tuned Top1 Accuracy": { "3": "#43A047", "4": "#2E7D32", "8": "#66BB6A", "16": "#81C784", "32": "#A5D6A7" , "mp4": "#48A9A6", "mpasc4": "#C4E7D4"},
  "Quant+FT Top1 Accuracy": { "3": "#E53935", "4": "#D32F2F", "8": "#FF7043", "16": "#F44336", "32": "#EF9A9A" , "mp4": "#FF6B6B", "mpasc4": "#E3879E"}
};

const legendMap = 
{
    "yAxis": 
    {
        "Original Top1 Accuracy": "Original",
        "Quantized Top1 Accuracy": "Quantized",
        "Fine-Tuned Top1 Accuracy": "Fine-Tuned",
        "Quant+FT Top1 Accuracy": "FT + Quant"
    },
    "bit":
    {
        "3": "3-bit",
        "4": "4-bit",
        "8": "8-bit",
        "16": "16-bit",
        "32": "32-bit",
        "mp4": "4-bit MP (5 + 3)",
        "mpasc4": "4-bit MP (3 + 5)"
        
    }
}

// Get selected values from checkboxes
function getCheckedValues(id) {
  return Array.from(document.querySelectorAll(`#${id} input:checked`)).map(cb => cb.value);
}

// // Load and update data
// function updateChart() {
//   const bitWidths = getCheckedValues("bit-width-options");
//   const yAxisSelection = getCheckedValues("y-axis-options");

//   let allData = [];

//   // Load all selected bit-width CSVs
//   Promise.all(bitWidths.map(bit => d3.csv("./logfiles/" + fileMap[bit]))).then(files => {
//     files.forEach((data, index) => {
//       data.forEach(d => {
//         d["Median_KL"] = +d["Median_KL"];
//         yAxisSelection.forEach(yAxis => d[yAxis] = +d[yAxis]);
//         d.bitWidth = bitWidths[index];
//         allData.push(d);
//       });
//     });

//     // Define scales
//     const xScale = d3.scaleLinear()
//       .domain(d3.extent(allData, d => d["Median_KL"]))
//       .range([0, width]);

//     const yScale = d3.scaleLinear()
//       .domain([0.3, d3.max(allData, d => d3.max(yAxisSelection, yAxis => d[yAxis]))])
//       .range([height, 0]);

//     // Remove old plots
//     svg.selectAll(".scatter-group, .trend-line, .axis").remove();

//     // Draw axes
//     svg.append("g")
//       .attr("class", "axis")
//       .attr("transform", `translate(0,${height})`)
//       .call(d3.axisBottom(xScale));

//     svg.append("g")
//       .attr("class", "axis")
//       .call(d3.axisLeft(yScale));

//     // ✅ ADD X-AXIS LABEL
//     svg.append("text")
//       .attr("class", "axis-label")
//       .attr("text-anchor", "middle")
//       .attr("x", width / 2)
//       .attr("y", height + margin.bottom - 10) // Position below x-axis
//       .attr("font-size", "14px")
//       .attr("fill", "#333")
//       .text("Median ICD"); // Change label text as needed

//     // ✅ ADD Y-AXIS LABEL
//     svg.append("text")
//       .attr("class", "axis-label")
//       .attr("text-anchor", "middle")
//       .attr("x", -height / 2)
//       .attr("y", -margin.left + 20) // Position beside y-axis
//       .attr("transform", "rotate(-90)") // Rotate for Y-axis
//       .attr("font-size", "14px")
//       .attr("fill", "#333")
//       .text("Top-1 Accuracy"); // Change label text as needed

//     // Draw scatter plots for each Y-axis value & bit-width
//     yAxisSelection.forEach(yAxis => {
//       bitWidths.forEach(bit => {
//         const dataSubset = allData.filter(d => d.bitWidth === bit);
//         const color = colorMap[yAxis][bit];

//         const scatterGroup = svg.append("g").attr("class", "scatter-group");

//         scatterGroup.selectAll("circle")
//           .data(dataSubset)
//           .enter()
//           .append("circle")
//           .attr("cx", d => xScale(d["Median_KL"]))
//           .attr("cy", d => yScale(d[yAxis]))
//           .attr("r", 5)
//           .attr("fill", color)
//           .attr("opacity", 0.8)
//           .attr("stroke", "#333")
//           .attr("stroke-width", 1);

//         // Add log trend line
//         addLogLine(dataSubset, xScale, yScale, yAxis, color);
//       });
//     });

//     // Update legend (ensure it renders properly)
//     updateLegend(yAxisSelection, bitWidths);
//   });
// }

function updateChart() {
  const bitWidths = getCheckedValues("bit-width-options");
  const yAxisSelection = getCheckedValues("y-axis-options");
  const evalMethod = document.getElementById("evaluation-toggle").checked ? "Sub" : "All"; // Get evaluation method

  let allData = [];

  // Load all selected bit-width CSVs
  Promise.all(bitWidths.map(bit => d3.csv("./logfiles/" + fileMap[bit]))).then(files => {
    files.forEach((data, index) => {
      data.forEach(d => {
        d["Median_KL"] = +d["Median_KL"];
        
        // Adjust Y-axis selection based on evaluation method
        yAxisSelection.forEach(yAxis => {
          const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;
          d[columnName] = +d[columnName];
        });

        d.bitWidth = bitWidths[index];
        allData.push(d);
      });
    });

    // Define scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(allData, d => d["Median_KL"]))
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0.3, d3.max(allData, d => d3.max(yAxisSelection, yAxis => {
        const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;
        return d[columnName];
      }))])
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

    // ✅ ADD X-AXIS LABEL
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("font-size", "14px")
      .attr("fill", "#333")
      .text("Median ICD");

    // ✅ ADD Y-AXIS LABEL
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .attr("transform", "rotate(-90)")
      .attr("font-size", "14px")
      .attr("fill", "#333")
      .text("Top-1 Accuracy");

    // // Draw scatter plots for each Y-axis value & bit-width
    // yAxisSelection.forEach(yAxis => {
    //   bitWidths.forEach(bit => {
    //     const dataSubset = allData.filter(d => d.bitWidth === bit);
    //     const color = colorMap[yAxis][bit];

    //     const scatterGroup = svg.append("g").attr("class", "scatter-group");

    //     scatterGroup.selectAll("circle")
    //       .data(dataSubset)
    //       .enter()
    //       .append("circle")
    //       .attr("cx", d => xScale(d["Median_KL"]))
    //       .attr("cy", d => {
    //         const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;
    //         return yScale(d[columnName]);
    //       })
    //       .attr("r", 5)
    //       .attr("fill", color)
    //       .attr("opacity", 0.8)
    //       .attr("stroke", "#333")
    //       .attr("stroke-width", 1);

    //     // Add log trend line
    //     addLogLine(dataSubset, xScale, yScale, yAxis, color);
    //   });
    // });

    // yAxisSelection.forEach(yAxis => {
    //   bitWidths.forEach(bit => {
    //     const dataSubset = allData.filter(d => d.bitWidth === bit);
    //     const color = colorMap[yAxis][bit];
    
    //     const scatterGroup = svg.append("g").attr("class", "scatter-group");
    
    //     // Append circles WITHOUT transitions
    //     scatterGroup.selectAll("circle")
    //       .data(dataSubset)
    //       .enter()
    //       .append("circle")
    //       .attr("cx", d => xScale(d["Median_KL"]))
    //       .attr("cy", d => {
    //         const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;
    //         return yScale(d[columnName]);
    //       })
    //       .attr("r", 5)
    //       .attr("fill", color)
    //       .attr("opacity", 0.8)
    //       .attr("stroke", "#333")
    //       .attr("stroke-width", 1);
    
    //     // ✅ Call trend line function
    //     addLogLine(dataSubset, xScale, yScale, yAxis, color, bit);
    //   });
    // });

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
          .attr("cy", d => {
            const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;
            return yScale(d[columnName]);
          })
          .attr("r", 5)
          .attr("fill", color)
          .attr("opacity", 0.8)
          .attr("stroke", "#333")
          .attr("stroke-width", 1)
          // ✅ Add Hover Events for Tooltip
          .on("mouseover", function(event, d) {
            const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;
            d3.select("#tooltip")
              .style("display", "block")
              .html(
                `<strong>${legendMap["yAxis"][yAxis]} (${legendMap["bit"][bit]})</strong><br>
                 <strong>Median ICD:</strong> ${d["Median_KL"].toFixed(3)}<br>
                 <strong>Top-1 Accuracy:</strong> ${d[columnName].toFixed(3)}`
              );
          })
          .on("mousemove", function(event) {
            d3.select("#tooltip")
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 20) + "px");
          })
          .on("mouseout", function() {
            d3.select("#tooltip").style("display", "none");
          });
    
        // ✅ Call trend line function
        addLogLine(dataSubset, xScale, yScale, yAxis, color, bit);
      });
    });




    // Update legend
    updateLegend(yAxisSelection, bitWidths);
  });

  // Update label text
  document.getElementById("evaluation-label").textContent = evalMethod;
}




// Function to update the legend inside the plot
function updateLegend(yAxisSelection, bitWidths) {
  svg.selectAll(".legend-group").remove(); // Remove old legend

  const legendGroup = svg.append("g")
    .attr("class", "legend-group")
    .attr("transform", `translate(${width + 100}, 20)`); // Positioned inside the chart

  let legendY = 0; // Initial Y position

  yAxisSelection.forEach(yAxis => {
    if (!colorMap[yAxis]) return; // Prevent undefined access

    bitWidths.forEach(bit => {
      if (!colorMap[yAxis][bit]) return; // Skip undefined bit-widths

      const color = colorMap[yAxis][bit];

      console.log(color);

      const legendItem = legendGroup.append("g")
        .attr("transform", `translate(0, ${legendY})`);

      // Add color circle
      legendItem.append("circle")
        .attr("cx", 0)
        .attr("cy", 5)
        .attr("r", 6)
        .attr("fill", color)
        .attr("stroke", "#333")
        .attr("stroke-width", 1);

      // Add text label
      legendItem.append("text")
        .attr("x", 12)
        .attr("y", 8)
        .attr("font-size", "12px")
        .attr("fill", "#000")
        .text(`${legendMap["yAxis"][yAxis]} (${legendMap["bit"][bit]})`)
        .attr("alignment-baseline", "middle"); // Ensure proper vertical alignment

      legendY += 18; // Move the next legend item down
    });
  });
}


// // Function to compute and draw a logarithmic best-fit line
// function addLogLine(data, xScale, yScale, yAxis, color) {
//   if (data.length < 2) return;

//   const sortedData = data.sort((a, b) => a["Median_KL"] - b["Median_KL"]);
//   const xVals = sortedData.map(d => Math.log(d["Median_KL"]));
//   const yVals = sortedData.map(d => d[yAxis]);

//   const n = xVals.length;
//   const sumX = d3.sum(xVals);
//   const sumY = d3.sum(yVals);
//   const sumXY = d3.sum(xVals.map((x, i) => x * yVals[i]));
//   const sumXX = d3.sum(xVals.map(x => x * x));

//   const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
//   const b = (sumY - a * sumX) / n;

//   const trendData = sortedData.map(d => ({
//     x: d["Median_KL"],
//     y: a * Math.log(d["Median_KL"]) + b
//   }));

//   svg.append("path")
//     .datum(trendData)
//     .attr("class", "trend-line")
//     .attr("fill", "none")
//     .attr("stroke", color)
//     .attr("stroke-width", 2)
//     .attr("d", d3.line()
//       .x(d => xScale(d.x))
//       .y(d => yScale(d.y))
//     );
// }

// function addLogLine(data, xScale, yScale, yAxis, color) {
//   if (data.length < 2) return;

//   const evalMethod = document.getElementById("evaluation-toggle").checked ? "Sub" : "All";
//   const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;

//   // Sort data for line fitting
//   const sortedData = data.sort((a, b) => a["Median_KL"] - b["Median_KL"]);

//   // Extract values for regression
//   const xVals = sortedData.map(d => Math.log(d["Median_KL"]));
//   const yVals = sortedData.map(d => d[columnName]);

//   // Compute logarithmic regression coefficients
//   const n = xVals.length;
//   const sumX = d3.sum(xVals);
//   const sumY = d3.sum(yVals);
//   const sumXY = d3.sum(xVals.map((x, i) => x * yVals[i]));
//   const sumXX = d3.sum(xVals.map(x => x * x));

//   const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
//   const b = (sumY - a * sumX) / n;

//   // Generate best-fit line data
//   const trendData = sortedData.map(d => ({
//     x: d["Median_KL"],
//     y: a * Math.log(d["Median_KL"]) + b
//   }));

//   // Draw best-fit line
//   svg.append("path")
//     .datum(trendData)
//     .attr("class", "trend-line")
//     .attr("fill", "none")
//     .attr("stroke", color)
//     .attr("stroke-width", 2)
//     .attr("d", d3.line()
//       .x(d => xScale(d.x))
//       .y(d => yScale(d.y))
//     );
// }


// function addLogLine(data, xScale, yScale, yAxis, color, bit) {
//   if (data.length < 2) return;

//   const evalMethod = document.getElementById("evaluation-toggle").checked ? "Sub" : "All";
//   const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;

//   // Sort data for regression
//   const sortedData = data.sort((a, b) => a["Median_KL"] - b["Median_KL"]);

//   // Extract values for regression
//   const xVals = sortedData.map(d => Math.log(d["Median_KL"]));
//   const yVals = sortedData.map(d => d[columnName]);

//   // Compute logarithmic regression coefficients
//   const n = xVals.length;
//   const sumX = d3.sum(xVals);
//   const sumY = d3.sum(yVals);
//   const sumXY = d3.sum(xVals.map((x, i) => x * yVals[i]));
//   const sumXX = d3.sum(xVals.map(x => x * x));

//   const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
//   const b = (sumY - a * sumX) / n;

//   // Generate trend line data
//   const trendData = sortedData.map(d => ({
//     x: d["Median_KL"],
//     y: a * Math.log(d["Median_KL"]) + b
//   }));

//   // Create a unique class for each trend line
//   const trendLineClass = `trend-line-${yAxis.replace(/\s+/g, '-')}-${bit}`;

//   // Remove old line for this specific bit width and Y-axis before adding a new one
//   svg.selectAll(`.${trendLineClass}`).remove();

//   // Append new trend line
//   svg.append("path")
//     .datum(trendData)
//     .attr("class", `trend-line ${trendLineClass}`)
//     .attr("fill", "none")
//     .attr("stroke", color)
//     .attr("stroke-width", 2)
//     .attr("opacity", 0.8)
//     .attr("d", d3.line()
//       .x(d => xScale(d.x))
//       .y(() => height) // Start at the bottom
//     )
//     .transition().duration(1000) // Smooth transition
//     .attr("d", d3.line()
//       .x(d => xScale(d.x))
//       .y(d => yScale(d.y))
//     );
// }

function addLogLine(data, xScale, yScale, yAxis, color, bit) {
  if (data.length < 2) return;

  const evalMethod = document.getElementById("evaluation-toggle").checked ? "Sub" : "All";
  const columnName = evalMethod === "Sub" ? `${yAxis} (Pick Sub)` : yAxis;

  // Sort data for regression
  const sortedData = data.sort((a, b) => a["Median_KL"] - b["Median_KL"]);

  // Compute logarithmic regression coefficients
  const xVals = sortedData.map(d => Math.log(d["Median_KL"]));
  const yVals = sortedData.map(d => d[columnName]);
  const n = xVals.length;
  const sumX = d3.sum(xVals);
  const sumY = d3.sum(yVals);
  const sumXY = d3.sum(xVals.map((x, i) => x * yVals[i]));
  const sumXX = d3.sum(xVals.map(x => x * x));

  const a = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - a * sumX) / n;

  // Generate trend line data
  const trendData = sortedData.map(d => ({
    x: d["Median_KL"],
    y: a * Math.log(d["Median_KL"]) + b
  }));

  // Create a unique class for each trend line
  const trendLineClass = `trend-line-${yAxis.replace(/\s+/g, '-')}-${bit}`;

  // Define line generator
  const lineGenerator = d3.line()
    .x(d => xScale(d.x))
    .y(d => yScale(d.y));

  // Remove old line if it exists
  svg.selectAll(`.${trendLineClass}`).remove();

  // Append new trend line
  svg.append("path")
    .attr("class", `trend-line ${trendLineClass}`)
    .attr("fill", "none")
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .attr("opacity", 0.8)
    .attr("d", lineGenerator(trendData));
}






// Function to switch tabs
function openTab(evt, tabName) {
  let tabContents = document.querySelectorAll(".tab-content");
  let tabButtons = document.querySelectorAll(".tab-button");

  // Hide all tab contents
  tabContents.forEach(content => content.classList.remove("active"));

  // Remove "active" class from all buttons
  tabButtons.forEach(button => button.classList.remove("active"));

  // Show the clicked tab
  document.getElementById(tabName).classList.add("active");

  // Highlight the clicked tab button
  evt.currentTarget.classList.add("active");
}

// Set the default tab to "Introduction" on page load
document.addEventListener("DOMContentLoaded", function() {
  openTab(null, "results"); 
  document.querySelector(".tab-button").click();
});


// Add event listeners for multi-select checkboxes
document.querySelectorAll("#bit-width-options input").forEach(cb => cb.addEventListener("change", updateChart));
document.querySelectorAll("#y-axis-options input").forEach(cb => cb.addEventListener("change", updateChart));

document.addEventListener("DOMContentLoaded", function() {
  // Find and click the "Results" tab button
  let resultsTabButton = document.querySelector("button[onclick*='results']");
  if (resultsTabButton) {
    resultsTabButton.click(); // Simulate a user clicking the tab
  }
});


// Add event listener for toggle change
document.getElementById("evaluation-toggle").addEventListener("change", updateChart);

// Initialize chart
updateChart();
