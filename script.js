// ==============================
// Section: Navigation Handling
// ==============================

const salesBtn = document.getElementById('salesInsightsBtn');
const qualityBtn = document.getElementById('gameQualityBtn');

const salesDashboard = document.getElementById('sales-dashboard');
const qualityDashboard = document.getElementById('quality-dashboard');

salesBtn.addEventListener('click', () => {
  salesDashboard.classList.remove('hidden');
  qualityDashboard.classList.add('hidden');
});

qualityBtn.addEventListener('click', () => {
  salesDashboard.classList.add('hidden');
  qualityDashboard.classList.remove('hidden');
});

// ==============================
// Section: Chart Module Imports
// ==============================
import { renderBarChart, renderDonutChart, renderAreaChart, renderBubblePlot } from './salesInsights.js';
import { renderCriticScatter, renderDualAxisChart, renderDualBarChart, renderTreemapChart } from './gameQuality.js';

// ==============================
// Section: Global Variables
// ==============================
let fullDataset = [];

// ==============================
// Section: Data Load & Init
// ==============================
d3.csv("data/games.csv").then(data => {
  preprocessData(data);
  fullDataset = data;
  initializeFilters(data);
  renderCharts(data);
});

// ==============================
// Section: Data Preprocessing
// ==============================
function preprocessData(data) {
  data.forEach(d => {
    d.Release_Year = d.Release_Year; 

    d.NA_Sales = +d.NA_Sales * 1_000_000;
    d.EU_Sales = +d.EU_Sales * 1_000_000;
    d.JP_Sales = +d.JP_Sales * 1_000_000;
    d.Other_Sales = +d.Other_Sales * 1_000_000;
    d.Global_Sales = +d.Global_Sales * 1_000_000;

    d.Critic_Score = +d.Critic_Score;
    d.Critic_Count = +d.Critic_Count;
    d.User_Score = +d.User_Score;
    d.User_Count = +d.User_Count;
  });
}

// ==============================
// Section: Filters
// ==============================

function initializeFilters(data) {
  const yearFilter = document.getElementById('yearFilter');
  const genreFilter = document.getElementById('genreFilter');
  const platformFilter = document.getElementById('platformFilter');

  const years = d3.range(2000, 2017, 2);
  const genres = Array.from(new Set(data.map(d => d.Genre))).sort();
  const platforms = Array.from(new Set(data.map(d => d.Platform))).sort();

  populateDropdown(yearFilter, years);
  populateDropdown(genreFilter, genres);
  populateDropdown(platformFilter, platforms);

  [yearFilter, genreFilter, platformFilter].forEach(select => {
    select.addEventListener('change', () => applyFilters(fullDataset));
  });

  document.getElementById('clearFilters').addEventListener('click', () => {
    yearFilter.value = 'All';
    genreFilter.value = 'All';
    platformFilter.value = 'All';
    applyFilters(fullDataset);
  });
}

function populateDropdown(selectElement, values) {
  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    selectElement.appendChild(option);
  });
}

// ==============================
// Section: Filter Logic
// ==============================

function applyFilters(data) {
  const year = document.getElementById('yearFilter').value;
  const genre = document.getElementById('genreFilter').value;
  const platform = document.getElementById('platformFilter').value;

  let filtered = data;

  if (year !== 'All') {
    filtered = filtered.filter(d => d.Release_Year === year);
  }
  if (genre !== 'All') {
    filtered = filtered.filter(d => d.Genre === genre);
  }
  if (platform !== 'All') {
    filtered = filtered.filter(d => d.Platform === platform);
  }

  renderCharts(filtered);
}

// ==============================
// Section: Chart Rendering
// ==============================

function renderCharts(filteredData) {
  const salesByRegion = {
    "NA Sales": d3.sum(filteredData, d => d.NA_Sales),
    "EU Sales": d3.sum(filteredData, d => d.EU_Sales),
    "JP Sales": d3.sum(filteredData, d => d.JP_Sales),
    "Other Sales": d3.sum(filteredData, d => d.Other_Sales)
  };

  const genre = document.getElementById('genreFilter').value;
  const platform = document.getElementById('platformFilter').value;

  let areaChartData = fullDataset;
  if (genre !== 'All') {
    areaChartData = areaChartData.filter(d => d.Genre === genre);
  }
  if (platform !== 'All') {
    areaChartData = areaChartData.filter(d => d.Platform === platform);
  }

  renderKPIs(filteredData);
  renderBarChart(filteredData, '#chart-top-selling');  
  renderDonutChart(salesByRegion, '#chart-region-sales');
  renderAreaChart(areaChartData, '#chart-genre-trend'); 
  renderBubblePlot(filteredData, '#chart-platform-bubble');

  renderCriticScatter(filteredData, '#chart-critic-score');
  renderDualAxisChart(filteredData, '#chart-review-volume'); 
  renderDualBarChart(filteredData, '#chart-top-rated'); 
  renderTreemapChart(filteredData, '#chart-rating-distribution');
}

// ==============================
// Section: KPI Rendering
// ==============================

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

function renderKPIs(data) {
  // Total Global Sales
  const totalSales = (
    d3.sum(data, d => d.NA_Sales) +
    d3.sum(data, d => d.EU_Sales) +
    d3.sum(data, d => d.JP_Sales) +
    d3.sum(data, d => d.Other_Sales)
  ).toFixed(2);

  // Top Platform
  const topPlatform = d3.rollups(
    data,
    v => d3.sum(v, d => d.Global_Sales),
    d => d.Platform
  ).sort((a, b) => d3.descending(a[1], b[1]))[0]?.[0] || "N/A";

  // Top Genre
  const topGenre = d3.rollups(
    data,
    v => d3.sum(v, d => d.Global_Sales),
    d => d.Genre
  ).sort((a, b) => d3.descending(a[1], b[1]))[0]?.[0] || "N/A";

  // Top Title
  const topTitle = data.sort((a, b) => d3.descending(a.Global_Sales, b.Global_Sales))[0]?.Game_Title || "N/A";

  // Top Developer
  const topDeveloper = d3.rollups(
    data,
    v => d3.sum(v, d => d.Global_Sales),
    d => d.Developer
  ).sort((a, b) => d3.descending(a[1], b[1]))[0]?.[0] || "N/A";

  // Inject values into DOM
  document.getElementById('total-sales').textContent = formatNumberAdaptive(+totalSales);
  document.getElementById('top-platform').textContent = topPlatform;
  document.getElementById('top-genre').textContent = topGenre;
  document.getElementById('top-title').textContent = topTitle;
  document.getElementById('top-developer').textContent = topDeveloper;
}
