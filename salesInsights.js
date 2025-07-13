// ==============================
// Chart: Bar Chart
// ==============================
export function renderBarChart(data, selector) {
  const topSelling = data.sort((a, b) => b.Global_Sales - a.Global_Sales).slice(0, 10);

  const gameTitles = topSelling.map(d => d.Game_Title);
  const sales = topSelling.map(d => d.Global_Sales);
  const developers = topSelling.map(d => d.Developer);
  const publishers = topSelling.map(d => d.Publisher);

  const margin = { top: 20, right: 20, bottom: 50, left: 100 };

  const container = d3.select(selector);
  const width = 500;
  const height = 300;

  function formatNumberAdaptive(value) {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + ' B';
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + ' M';
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + ' K';
    } else {
      return value.toString(); // For anything less than 1000
    }
  }

  d3.select(selector).select("svg").remove();

  const svg = d3.select(selector)
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left + 30},${margin.top})`);

  const minThreshold = 10;
  const adjustedMax = Math.max(d3.max(sales), minThreshold);

  const x = d3.scaleLinear()
    .domain([0, adjustedMax / 1_000_000]) // Scale in millions
    .nice()
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(gameTitles)
    .range([0, height])
    .padding(0.1);

  // Tooltip div
  const tooltip = d3.select("body").append("div")
    .attr("class", "bar-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("padding", "6px 10px")
    .style("font-size", "12px")
    .style("color", "#333")
    .style("pointer-events", "none")
    .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.1)");

  // Bars
  svg.selectAll(".bar")
    .data(topSelling)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", 0)
    .attr("y", d => y(d.Game_Title))
    .attr("width", d => x(d.Global_Sales / 1_000_000))
    .attr("height", y.bandwidth())
    .attr("fill", "#ff69b4")
    .on("mouseover", function (event, d) {
      tooltip.style("visibility", "visible")
        .html(`
          <strong>${d.Game_Title}</strong><br/>
          Sales: ${formatNumberAdaptive(d.Global_Sales)}<br/>
          Developer: ${d.Developer}<br/>
          Publisher: ${d.Publisher}
        `);
      d3.select(this).style("opacity", 0.8);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", (event.pageY - 28) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
      d3.select(this).style("opacity", 1);
    });

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y))
    .style("font-size", "11px");

  svg.append("text")
    .attr("x", -50)
    .attr("y", height / 60 - 10)
    .attr("transform", "rotate(0)")
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Top Selling Games");

  // Average sales line
  const avgSales = d3.mean(sales);
  const medX = x(avgSales / 1_000_000);

  svg.append("line")
    .attr("x1", medX)
    .attr("x2", medX)
    .attr("y1", 0)
    .attr("y2", height)
    .style("stroke", "black")
    .style("stroke-dasharray", "4 4")
    .style("stroke-width", 1.5);

  svg.append("text")
    .attr("x", medX + 5)
    .attr("y", 10)
    .attr("text-anchor", "start")
    .style("font-size", "10px")
    .style("fill", "black")
    .text(`Average: ${formatNumberAdaptive(avgSales)}`);
}

// ==============================
// Chart: Donut Chart
// ==============================

export function renderDonutChart(data, selector) {
  const width = 300;
  const height = 300;
  const margin = 30;
  const radius = Math.min(width, height) / 2 - margin;

  function formatNumberAdaptive(value) {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + ' B';
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + ' M';
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + ' K';
    } else {
      return value.toString(); // For anything less than 1000
    }
  }

  d3.select(selector).select("svg").remove();

  const svg = d3.select(selector)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const color = d3.scaleOrdinal()
    .domain(Object.keys(data))
    .range(["#ff69b4", "#ffc0cb", "#FF5E82", "#FF1187"]);

  const pie = d3.pie()
    .value(d => d[1]);

  const data_ready = pie(Object.entries(data)).filter(d => d.data[1] > 0);

  // Draw arcs
  const arcPath = d3.arc()
  .innerRadius(radius * 0.6)
  .outerRadius(radius);

  // Tooltip div
  const tooltip = d3.select("body").append("div")
    .attr("class", "bar-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("padding", "6px 10px")
    .style("font-size", "12px")
    .style("color", "#333")
    .style("pointer-events", "none")
    .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.1)");

  const arcs = svg.selectAll('path')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', arcPath)
    .attr('fill', d => color(d.data[0]))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      tooltip.style("visibility", "visible")
        .html(`<strong>${d.data[0]}</strong>: ${formatNumberAdaptive(d.data[1])}`);
      d3.select(this).style("opacity", 0.8);
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", (event.pageY - 28) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", function () {
      tooltip.style("visibility", "hidden");
      d3.select(this).style("opacity", 1);
    });

  // Total in center
  const total = d3.sum(Object.values(data));
  svg.append("text")
    .text(`${formatNumberAdaptive(total)}`)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", "16px")
    .style("fill", "#444");

  // Labels
  const labelMap = {
    "JP Sales": "JP",
    "NA Sales": "NA",
    "EU Sales": "EU",
    "Other Sales": "Other Region"
  };

  // Helper to get angle mid-point
  function midAngle(d) {
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }
  // Leader lines and external labels
  const outerArc = d3.arc()
    .innerRadius(radius * 1.1) // slightly outside
    .outerRadius(radius * 1.1);

  // leader line
  svg.selectAll('polyline')
    .data(data_ready)
    .enter()
    .append('polyline')
    .attr('points', function (d) {
      const posA = d3.arc()
        .innerRadius(radius * 0.9)
        .outerRadius(radius)
        .centroid(d); // point on arc
      const posB = outerArc.centroid(d); // point just outside
      const posC = outerArc.centroid(d); // same as B, but shifted horizontally
      posC[0] = radius * 1.3 * (midAngle(d) < Math.PI ? 1 : -1); // label anchor X
      return [posA, posB, posC];
    })
    .style("fill", "none")
    .style("stroke", "#ccc")
    .style("stroke-width", "1px");

  // labels
  svg.selectAll('label')
  .data(data_ready)
  .enter()
  .append('text')
  .attr('transform', function (d) {
    const pos = outerArc.centroid(d);
    pos[0] = radius * 1.35 * (midAngle(d) < Math.PI ? 1 : -1);
    return `translate(${pos})`;
  })
  .attr("text-anchor", d => midAngle(d) < Math.PI ? "start" : "end")
  .style("font-size", "11px")
  .style("fill", "#333")
  .each(function (d) {
    const label = labelMap[d.data[0]] || d.data[0];
    const total = d3.sum(data_ready, d => d.data[1]);
    const percent = ((d.data[1] / total) * 100).toFixed(1) + '%';

    d3.select(this)
      .append("tspan")
      .attr("x", 0)
      .attr("dy", 0) // top line
      .text(label)
      .style("font-size", "12px");

    d3.select(this)
      .append("tspan")
      .attr("x", 0)
      .attr("dy", "1.2em") // second line (below)
      .style("font-size", "10px")
      .style("fill", "#666")
      .text(percent);
  });
}

// ==============================
// Chart: Area Chart
// ==============================
export function renderAreaChart(data, selector) {
  // Remove existing SVG and tooltip for this chart
  d3.select(selector).select("svg").remove();
  d3.select("body").selectAll(".area-tooltip").remove();

  const width = 570;
  const height = 300;
  const margin = { top: 20, right: 150, bottom: 60, left: 70 };

  const svg = d3.select(selector)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .style("margin-left", "15px");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Tooltip 
  const tooltip = d3.select("body").append("div")
    .attr("class", "area-tooltip")
    .style("position", "absolute")
    .style("padding", "10px")
    .style("background", "rgba(255, 255, 255, 0.95)")
    .style("color", "#333")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 10);

  const validData = data.filter(d => d.Release_Year && d.Global_Sales && !isNaN(+d.Release_Year));

  if (validData.length === 0) {
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#666")
      .text("No data available for current filters");
    return;
  }

  const nested = d3.rollups(
    validData,
    v => d3.sum(v, d => d.Global_Sales),
    d => +d.Release_Year,
    d => d.Genre
  );

  const years = Array.from(new Set(validData.map(d => +d.Release_Year))).sort();
  const genres = Array.from(new Set(validData.map(d => d.Genre))).sort();

  const stackData = years.map(year => {
    const yearData = { year: year };
    genres.forEach(genre => {
      const found = nested.find(([y]) => y === year);
      if (found) {
        const genreFound = found[1].find(([g]) => g === genre);
        yearData[genre] = genreFound ? genreFound[1] : 0;
      } else {
        yearData[genre] = 0;
      }
    });
    return yearData;
  });

  const stack = d3.stack()
    .keys(genres)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const series = stack(stackData);

  const xScale = d3.scaleLinear()
    .domain(d3.extent(years))
    .range([0, innerWidth]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(series, d => d3.max(d, d => d[1])) || 1])
    .range([innerHeight, 0]);

  const colorScale = d3.scaleOrdinal()
    .domain(genres)
    .range(d3.schemeCategory10);

  const area = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveCardinal);

  function formatNumberAdaptive(value) {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2) + ' B';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(2) + ' M';
    if (value >= 1_000) return (value / 1_000).toFixed(2) + ' K';
    return value.toString();
  }

  g.selectAll(".area")
    .data(series)
    .enter()
    .append("path")
    .attr("class", "area")
    .attr("d", area)
    .attr("fill", d => colorScale(d.key))
    .attr("opacity", 0.7)
    .attr("stroke", "white")
    .attr("stroke-width", 0.5)
    .on("mouseover", function(event, d) {
      d3.select(this).attr("opacity", 0.9);

      const mouseX = xScale.invert(d3.pointer(event, this)[0]);
      const closestIndex = d3.bisectLeft(years, mouseX);
      const safeIndex = Math.max(0, closestIndex - 1);
      const yearDataPoint = d[safeIndex];
      const genreSales = yearDataPoint[1] - yearDataPoint[0];

      tooltip
        .html(
          `<strong>Year:</strong> ${yearDataPoint.data.year}<br/>
           <strong>Genre:</strong> ${d.key}<br/>
           <strong>Sales:</strong> ${formatNumberAdaptive(genreSales)}`
        )
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px")
        .transition()
        .duration(150)
        .style("opacity", 1);
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      d3.select(this).attr("opacity", 0.7);
      tooltip.transition().duration(300).style("opacity", 0);
    });

  // X Axis
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(
      d3.axisBottom(xScale)
        .tickValues(d3.range(2000, 2017, 2))
        .tickFormat(d3.format("d"))
    );

  // Y Axis
  g.append("g")
    .call(d3.axisLeft(yScale).tickFormat(formatNumberAdaptive));

  // Axis Labels
  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 45)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Release Year");

  // Legend
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - margin.right + 20},${margin.top})`);

  genres.forEach((genre, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    row.append("rect")
      .attr("width", 12)
      .attr("height", 12)
      .attr("fill", colorScale(genre));

    row.append("text")
      .attr("x", 18)
      .attr("y", 10)
      .attr("font-size", "11px")
      .text(genre);
  });
}

// ==============================
// Chart: Bubble Plot
// ==============================
export function renderBubblePlot(data, selector) {
  // Remove existing content
  d3.select(selector).selectAll("*").remove();
  d3.select("body").selectAll(".bubble-tooltip").remove();

  // Wrap chart in a container
  const container = d3.select(selector)
    .style("position", "relative");

  const width = 600;
  const height = 400;

  function formatNumberAdaptive(value) {
    if (value >= 1_000_000_000) {
      return (value / 1_000_000_000).toFixed(2) + ' B';
    } else if (value >= 1_000_000) {
      return (value / 1_000_000).toFixed(2) + ' M';
    } else if (value >= 1_000) {
      return (value / 1_000).toFixed(2) + ' K';
    } else {
      return value.toString(); // For anything less than 1000
    }
  }

  // Create SVG with zoom group
  const svg = container.append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

  const zoomGroup = svg.append("g");

  // Create tooltip div
  const tooltip = d3.select("body").append("div")
    .attr("class", "bubble-tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("padding", "6px 10px")
    .style("font-size", "12px")
    .style("color", "#333")
    .style("pointer-events", "none")
    .style("box-shadow", "0px 2px 5px rgba(0,0,0,0.1)");


  // Add Reset Button
  const resetButton = container.append("button")
    .text("Reset Zoom")
    .style("position", "absolute")
    .style("bottom", "10px")
    .style("right", "10px")
    .style("padding", "5px 10px")
    .style("font-size", "12px")
    .style("background-color", "#ff69b4")
    .style("color", "white")
    .style("border", "none")
    .style("border-radius", "6px")
    .style("cursor", "pointer")
    .on("click", () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    });

  // Zoom behavior with constraint
  const zoom = d3.zoom()
    .scaleExtent([0.8, 3])
    .on("zoom", event => {
      const t = event.transform;
      const clampedX = Math.max(width * (1 - t.k), Math.min(t.x, 0));
      const clampedY = Math.max(height * (1 - t.k), Math.min(t.y, 0));
      zoomGroup.attr("transform", d3.zoomIdentity.translate(clampedX, clampedY).scale(t.k));
    });

  svg.call(zoom);

  // Aggregate sales by platform
  const salesData = Array.from(
    d3.rollup(
      data,
      v => d3.sum(v, d => d.Global_Sales),
      d => d.Platform
    ),
    ([platform, sales]) => ({ platform, sales })
  );

  const color = d3.scaleOrdinal()
    .domain(salesData.map(d => d.platform))
    .range(d3.schemeCategory10);

  // Create bubble layout
  const root = d3.pack()
    .size([width, height])
    .padding(5)(
      d3.hierarchy({ children: salesData })
        .sum(d => d.sales)
    );

  const node = zoomGroup.selectAll("g")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => color(d.data.platform))
    .attr("stroke", "white")
    .style("stroke-width", "2px");

  node.append("text")
    .text(d => d.data.platform)
    .attr("text-anchor", "middle")
    .attr("dy", "0.3em")
    .style("fill", "white")
    .style("font-size", "10px");

  // Tooltips
  node.select("circle")
  .on("mouseover", function (event, d) {
    d3.select(this)
      .attr("stroke", "#333")
      .attr("stroke-width", 3)
      .attr("fill", d3.color(color(d.data.platform)).darker(-0.3));

    tooltip.style("visibility", "visible")
      .html(`
        <strong>Platform:</strong> ${d.data.platform}<br/>
        <strong>Copies Sold:</strong> ${formatNumberAdaptive(d.data.sales)}
      `);
  })
  .on("mousemove", function (event) {
    tooltip
      .style("top", (event.pageY - 28) + "px")
      .style("left", (event.pageX + 10) + "px");
  })
  .on("mouseout", function (event, d) {
    d3.select(this)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("fill", color(d.data.platform));

    tooltip.style("visibility", "hidden");
  });

}
