// ==============================
// Chart: Scatter Plot
// ==============================
export function renderCriticScatter(data, selector) {
  // Filter valid rows for both plots
  const filtered = data.filter(d =>
    d.Critic_Score && d.Critic_Count &&
    d.User_Score && d.User_Count &&
    !isNaN(d.Critic_Score) && !isNaN(d.Critic_Count) &&
    !isNaN(d.User_Score) && !isNaN(d.User_Count)
  );

  const width = 550; 
  const height = 250;
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const spacingBetweenPlots = 70;
  const plotWidth = (width - margin.left - margin.right - spacingBetweenPlots) / 2;
  const plotHeight = height - margin.top - margin.bottom;

  d3.select(selector).select("svg").remove();

  const svg = d3.select(selector)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMinYMid meet")
    .style("width", "100%")
    .style("height", "95%")
    .style("margin-left", "15px");

  const plots = [
    {
      xVar: d => d.Critic_Score / 10,
      yVar: d => d.Critic_Count,
      titleX: "Critic Score",
      titleY: "Critic Count",
      transform: `translate(${margin.left}, ${margin.top})`
    },
    {
      xVar: d => d.User_Score,
      yVar: d => d.User_Count,
      titleX: "User Score",
      titleY: "User Count",
      transform: `translate(${margin.left + plotWidth + spacingBetweenPlots}, ${margin.top})`
    }
  ];


  plots.forEach(plot => {
    const group = svg.append("g").attr("transform", plot.transform);

    const xVals = filtered.map(plot.xVar);
    const yVals = filtered.map(plot.yVar);

    const yMax = d3.max(yVals);
    const yPadding = yMax * 0.05;

    // === Fixed x-axis domain ===
    const x = d3.scaleLinear()
      .domain([0, 10])
      .range([0, plotWidth]);

    const y = d3.scaleLinear()
      .domain([0, yMax + yPadding])
      .range([plotHeight, 0]);

    // Axes
    group.append("g")
      .attr("transform", `translate(0, ${plotHeight})`)
      .call(d3.axisBottom(x));

    group.append("g")
      .call(d3.axisLeft(y));

    // Dots
    group.selectAll("circle")
      .data(filtered)
      .enter()
      .append("circle")
      .attr("cx", d => x(plot.xVar(d)))
      .attr("cy", d => y(plot.yVar(d)))
      .attr("r", 4)
      .attr("fill", "#ff69b4")
      .attr("opacity", 0.7);

    // Axis labels
    group.append("text")
      .attr("x", plotWidth / 2)
      .attr("y", plotHeight + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(plot.titleX);

    group.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -plotHeight / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(plot.titleY);

    // === Linear Regression Line ===
    const xMean = d3.mean(xVals);
    const yMean = d3.mean(yVals);
    const slope = d3.sum(xVals.map((xVal, i) => (xVal - xMean) * (yVals[i] - yMean))) /
                  d3.sum(xVals.map(xVal => (xVal - xMean) ** 2));
    const intercept = yMean - slope * xMean;

    const linePoints = [
      { x: 0, y: intercept },
      { x: 10, y: slope * 10 + intercept }
    ];

    group.append("line")
      .attr("x1", x(linePoints[0].x))
      .attr("y1", y(linePoints[0].y))
      .attr("x2", x(linePoints[1].x))
      .attr("y2", y(linePoints[1].y))
      .style("stroke", "black")
      .style("stroke-width", 1.5)
      .style("stroke-dasharray", "4 4");
  });
}

// ==============================
// Chart: Dual-Axis Bar & Dot Plot
// ==============================
export function renderDualAxisChart(data, selector) {
  // Clear previous SVG and tooltips
  d3.select(selector).select("svg").remove();
  d3.select("body").selectAll(".tooltip").remove();

  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 130, bottom: 30, left: 180 };

  const svg = d3.select(selector)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const validData = data.filter(d =>
    d.Game_Title && d.Critic_Score && d.User_Score && d.Critic_Count && d.User_Count &&
    !isNaN(d.Critic_Score) && !isNaN(d.User_Score) && !isNaN(d.Critic_Count) && !isNaN(d.User_Count)
  );

  const aggregatedData = Array.from(d3.group(validData, d => d.Game_Title), ([key, values]) => {
    const totalCriticCount = d3.sum(values, d => d.Critic_Count);
    const totalUserCount = d3.sum(values, d => d.User_Count);
    const avgCriticScore = d3.mean(values, d => d.Critic_Score);
    const avgUserScore = d3.mean(values, d => d.User_Score);

    return {
      gameTitle: key,
      totalReviewCount: totalCriticCount + totalUserCount,
      avgCriticScore,
      avgUserScore
    };
  }).filter(d => d.gameTitle);

  const top10Games = aggregatedData
    .sort((a, b) => d3.descending(a.totalReviewCount, b.totalReviewCount))
    .slice(0, 10);

  if (top10Games.length === 0) {
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#666")
      .text("No top 10 games by review volume found");
    return;
  }

  const yScale = d3.scaleBand()
    .domain(top10Games.map(d => d.gameTitle))
    .range([0, innerHeight])
    .padding(0.1);

  const xCountScale = d3.scaleLinear()
    .domain([0, d3.max(top10Games, d => d.totalReviewCount) * 1.1 || 1])
    .range([0, innerWidth]);

  const xScoreScale = d3.scaleLinear()
    .domain([0, 10])
    .range([0, innerWidth]);

  // Y-axis
  g.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScale));

  // Bars: Total Review Count
  const bars = g.selectAll(".bar")
    .data(top10Games)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("y", d => yScale(d.gameTitle))
    .attr("x", 0)
    .attr("height", yScale.bandwidth())
    .attr("width", d => xCountScale(d.totalReviewCount))
    .attr("fill", "#ff69b4")
    .attr("opacity", 0.8);

  // Circles: Critic Score
  const criticDots = g.selectAll(".dot-critic")
    .data(top10Games)
    .enter()
    .append("circle")
    .attr("class", "dot-critic")
    .attr("cy", d => yScale(d.gameTitle) + yScale.bandwidth() / 3)
    .attr("cx", d => xScoreScale(d.avgCriticScore / 10))
    .attr("r", 5)
    .attr("fill", "#ff1493");

  // Circles: User Score
  const userDots = g.selectAll(".dot-user")
    .data(top10Games)
    .enter()
    .append("circle")
    .attr("class", "dot-user")
    .attr("cy", d => yScale(d.gameTitle) + (2 * yScale.bandwidth() / 3))
    .attr("cx", d => xScoreScale(d.avgUserScore))
    .attr("r", 5)
    .attr("fill", "#ffc0cb");

  // Tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
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

  // === Shared Hover Functions ===
  function handleMouseOver(event, d) {
    g.selectAll(".dot-critic")
      .filter(dc => dc.gameTitle === d.gameTitle)
      .attr("fill", "#c71585")
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5);

    g.selectAll(".dot-user")
      .filter(du => du.gameTitle === d.gameTitle)
      .attr("fill", "#ff69b4")
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5);

    g.selectAll(".bar")
      .filter(bar => bar.gameTitle === d.gameTitle)
      .attr("fill", "#d94f94")
      .attr("stroke", "#333")
      .attr("stroke-width", 1);

    tooltip.transition().duration(200).style("opacity", 0.9).style("visibility", "visible");
    tooltip.html(`
      <strong>${d.gameTitle}</strong><br/>
      Total Reviews: ${d.totalReviewCount}<br/>
      Avg Critic Score: ${(d.avgCriticScore / 10).toFixed(2)} / 10<br/>
      Avg User Score: ${d.avgUserScore.toFixed(2)} / 10
    `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  }

  function handleMouseOut(event, d) {
    g.selectAll(".dot-critic")
      .filter(dc => dc.gameTitle === d.gameTitle)
      .attr("fill", "#ff1493")
      .attr("stroke", "none");

    g.selectAll(".dot-user")
      .filter(du => du.gameTitle === d.gameTitle)
      .attr("fill", "#ffc0cb")
      .attr("stroke", "none");

    g.selectAll(".bar")
      .filter(bar => bar.gameTitle === d.gameTitle)
      .attr("fill", "#ff69b4")
      .attr("stroke", "none");

    tooltip.transition().duration(500).style("opacity", 0).style("visibility", "hidden");
  }

  // Attach events to bars and dots
  bars
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .style("cursor", "pointer");

  criticDots
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .style("cursor", "pointer");

  userDots
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .style("cursor", "pointer");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + innerWidth + 40}, ${margin.top})`);

  legend.append("circle")
    .attr("r", 6).attr("fill", "#ff1493").attr("cy", 0);
  legend.append("text")
    .text("Critic Score").attr("x", 12).attr("y", 4).style("font-size", "12px");

  legend.append("circle")
    .attr("r", 6).attr("fill", "#ffc0cb").attr("cy", 20);
  legend.append("text")
    .text("User Score").attr("x", 12).attr("y", 24).style("font-size", "12px");
}

// ==============================
// Chart: Dual Barplot
// ==============================
export function renderDualBarChart(data, selector) {
  // Remove any existing SVG
  d3.select(selector).select("svg").remove();

  // Dimensions and margins
  const margin = { top: 40, right: 80, bottom: 60, left: 180 },
        width  = 700 - margin.left - margin.right,
        height = 330 - margin.top  - margin.bottom;

  // Create the SVG container
  const svg = d3.select(selector)
    .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .style("width", "100%")
      .style("height", "auto")
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  // Tooltip div
  const tooltip = d3.select("body")
    .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(255, 255, 255, 0.7)")
      .style("color", "black")
      .style("padding", "4px 8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("opacity", 0);

  // 1) Aggregate by Publisher
  const agg = Array.from(
    d3.rollup(
      data,
      v => ({
        critic: d3.mean(v, d => d.Critic_Score / 10),
        user:   d3.mean(v, d => +d.User_Score)
      }),
      d => d.Publisher
    ),
    ([publisher, stats]) => ({ publisher, ...stats })
  );

  // 2) Take top 10 by average critic score
  const top10 = agg.sort((a, b) => b.critic - a.critic).slice(0, 10);

  // 3) Scales
  const y0 = d3.scaleBand()
    .domain(top10.map(d => d.publisher))
    .range([0, height])
    .paddingInner(0.2);

  const y1 = d3.scaleBand()
    .domain(["critic", "user"])
    .range([0, y0.bandwidth()])
    .padding(0.1);

  const x = d3.scaleLinear()
    .domain([0, d3.max(top10, d => Math.max(d.critic, d.user))])
    .nice()
    .range([0, width]);

  // 4) Axes
  const yAxis = d3.axisLeft(y0)
    .tickSize(0)
    .tickPadding(8);

  const xAxis = d3.axisBottom(x)
    .ticks(5);

  svg.append("g")
    .call(yAxis)
    .selectAll("text")
      .attr("font-size", "12px");

  // 5) Draw grouped bars
  const groups = svg.selectAll(".publisher")
    .data(top10)
    .join("g")
      .attr("class", "publisher")
      .attr("transform", d => `translate(0,${y0(d.publisher)})`);

  groups.selectAll("rect")
    .data(d => [
      { key: "critic", value: d.critic, publisher: d.publisher },
      { key: "user",   value: d.user,   publisher: d.publisher }
    ])
    .join("rect")
      .attr("class", d => `bar ${d.key}`)
      .attr("y", d => y1(d.key))
      .attr("height", y1.bandwidth())
      .attr("x", 0)
      .attr("width", d => x(d.value))
      // initial colors:
      .attr("fill", d => d.key === "critic" ? "#ff69b4" : "#ffc0cb")
    .on("mouseover", (event, d) => {
      // hover highlight:
      const highlight = d.key === "critic" ? "#ff87c3" : "#facfd7";
      d3.select(event.currentTarget).attr("fill", highlight);

      tooltip
        .html(
          `<strong>${d.publisher}</strong><br/>
          ${d.key === "critic" ? "Critic" : "User"} Score: ${d.value.toFixed(2)}`
        )
        .style("left",  (event.pageX + 10) + "px")
        .style("top",   (event.pageY - 25) + "px")
        .transition().duration(100)
        .style("opacity", 1);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left",  (event.pageX + 10) + "px")
        .style("top",   (event.pageY - 25) + "px");
    })
    .on("mouseout", (event, d) => {
      // revert to original color
      d3.select(event.currentTarget)
        .attr("fill", d.key === "critic" ? "#ff69b4" : "#ffc0cb");
      tooltip.transition().duration(100).style("opacity", 0);
    });

  // 6) Averages for vertical reference lines
  const avgCritic = d3.mean(top10, d => d.critic);
  const avgUser   = d3.mean(top10, d => d.user);

  // Function to draw vertical reference line
  function drawRefLine(value, label, color, yOffset = 0) {
    svg.append("line")
      .attr("x1", x(value))
      .attr("x2", x(value))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", color)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4 2");

    svg.append("text")
      .attr("x", x(value) + 4)
      .attr("y", 12 + yOffset)
      .text(label)
      .attr("font-size", "11px")
      .attr("fill", color);
  }

  drawRefLine(avgCritic, `Avg Critic: ${avgCritic.toFixed(2)}`, "black");
  drawRefLine(avgUser, `Avg User: ${avgUser.toFixed(2)}`, "red", 16);

  // 7) Legend
  const legend = svg.append("g")
    .attr("transform", `translate(0, ${-margin.top/2})`);

  const legendData = [
    { key: "critic", color: "#ff69b4", label: "Avg Critic Score" },
    { key: "user",   color: "#ffc0cb", label: "Avg User Score" }
  ];

  legend.selectAll("g")
    .data(legendData)
    .join("g")
      .attr("transform", (d,i) => `translate(${i*180},0)`)
    .call(g => {
      g.append("rect")
        .attr("width", 16)
        .attr("height", 16)
        .attr("fill", d => d.color);

      g.append("text")
        .attr("x", 24)
        .attr("y", 12)
        .text(d => d.label)
        .attr("font-size", "12px");
    });
}

// ==============================
// Chart: Treemap Square 
// ==============================
export function renderTreemapChart(data, selector) {
  d3.select(selector).select("svg").remove();
  d3.selectAll(".treemap-tooltip").remove(); // remove any previous tooltip

  const width = 600;
  const height = 260;

  const grouped = d3.groups(data, d => d.Rating, d => d.Genre)
    .map(([rating, genres]) => ({
      name: rating || "Unknown",
      children: genres.map(([genre, records]) => ({
        name: genre || "Unknown",
        value: records.length,
      }))
    }));

  const ratings = grouped.map(d => d.name);

  const customColors = ["#ffc0cb", "#e12a8c", "#ff98c3", "#ff69b4"];
  const color = d3.scaleOrdinal()
    .domain(ratings)
    .range(customColors);

  const root = d3.hierarchy({ name: "root", children: grouped })
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  d3.treemap()
    .size([width, height])
    .paddingInner(2)
    .paddingOuter(4)(root);

  const svg = d3.select(selector)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "90%")
    .style("height", "100%")
    .style("margin-left", "32px");

  // Tooltip setup
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "treemap-tooltip")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(255, 255, 255, 0.7)")
    .style("color", "black")
    .style("padding", "4px 8px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("opacity", 0);

  // Add rectangles for each genre (leaf node)
  const nodes = svg.selectAll(".genre-node")
    .data(root.leaves())
    .enter()
    .append("g")
    .attr("class", "genre-node")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  nodes.append("rect")
    .attr("width", d => d.x1 - d.x0)
    .attr("height", d => d.y1 - d.y0)
    .attr("fill", d => color(d.parent.data.name))
    .attr("stroke", "#fff")
    .on("mousemove", function(event, d) {
      // Lighten color
      const originalColor = color(d.parent.data.name);
      const lighten = d3.color(originalColor).brighter(0.2).formatHex();
      d3.select(this).attr("fill", lighten);

      // Show tooltip
      tooltip.transition().duration(100).style("opacity", 0.95);
      tooltip.html(
        `<strong>Rating:</strong> ${d.parent.data.name}<br/>
        <strong>Genre:</strong> ${d.data.name}<br/>
        <strong>Game Count:</strong> ${d.data.value}`
      )
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function(event, d) {
      // Revert color
      d3.select(this).attr("fill", color(d.parent.data.name));
      tooltip.transition().duration(300).style("opacity", 0);
    });

  nodes.append("text")
    .attr("x", 4)
    .attr("y", 14)
    .attr("font-size", "10px")
    .attr("fill", "white")
    .text(d => d.data.name.length > 12 ? d.data.name.slice(0, 12) + "…" : d.data.name);

  // Add Rating labels (non-leaf nodes)
  svg.selectAll(".rating-label")
    .data(root.children)
    .enter()
    .append("text")
    .attr("class", "rating-label")
    .attr("x", d => d.x0 + 10)
    .attr("y", d => d.y0 + 40)
    .attr("font-size", "12px")
    .attr("font-weight", "bold")
    .attr("fill", "#000")
    .text(d => d.data.name);
}
