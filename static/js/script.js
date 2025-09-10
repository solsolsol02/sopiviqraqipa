document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to current tab
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Load data for the selected tab
            loadTabData(tabId);
        });
    });
    
    // Load initial dashboard data
    loadDashboardData();
    
    // Set up button event listeners
    document.getElementById('generate-report').addEventListener('click', generateReport);
    document.getElementById('analyze-performance').addEventListener('click', analyzePerformance);
    document.getElementById('calculate-eoq').addEventListener('click', calculateEOQ);
    document.getElementById('calculate-rop').addEventListener('click', calculateROP);
    document.getElementById('optimize-inventory').addEventListener('click', optimizeInventory);
    document.getElementById('update-stock').addEventListener('click', updateStock);
    document.getElementById('check-expiry').addEventListener('click', checkExpiry);
    document.getElementById('generate-inventory-report').addEventListener('click', generateInventoryReport);
});

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard-data');
        const data = await response.json();
        
        // Update KPI cards
        document.getElementById('total-sales').textContent = formatCurrency(data.total_sales);
        document.getElementById('inventory-value').textContent = formatCurrency(data.inventory_value);
        document.getElementById('growth-rate').textContent = `${data.growth_rate.toFixed(2)}%`;
        document.getElementById('top-product').textContent = data.top_product;
        
        // Create charts
        createSalesTrendChart(data.sales_data);
        createSalesForecastChart(data.sales_data);
        createABCAnalysisChart(data.inventory_data);
        createInventoryTurnoverChart(data.inventory_data);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load data for specific tab
function loadTabData(tabId) {
    switch(tabId) {
        case 'manajemen':
            loadManagementData();
            break;
        case 'ppic':
            loadPPICData();
            break;
        case 'inventory':
            loadInventoryData();
            break;
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
}

// Create sales trend chart
function createSalesTrendChart(salesData) {
    const ctx = document.getElementById('sales-trend-chart').getContext('2d');
    
    // Process data for chart
    const dates = salesData.map(item => item.date);
    const sales = salesData.map(item => item.sales);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Penjualan',
                data: sales,
                borderColor: '#0055a5',
                backgroundColor: 'rgba(0, 85, 165, 0.1)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Tren Penjualan Harian'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Create sales forecast chart
async function createSalesForecastChart(salesData) {
    try {
        const response = await fetch('/api/forecast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sales_data: salesData })
        });
        
        const forecastData = await response.json();
        
        const ctx = document.getElementById('sales-forecast-chart').getContext('2d');
        
        // Process data for chart
        const historicalDates = salesData.map(item => item.date);
        const historicalSales = salesData.map(item => item.sales);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: [...historicalDates, ...forecastData.dates],
                datasets: [
                    {
                        label: 'Data Historis',
                        data: [...historicalSales, ...Array(forecastData.values.length).fill(null)],
                        borderColor: '#0055a5',
                        backgroundColor: 'rgba(0, 85, 165, 0.1)',
                        fill: true
                    },
                    {
                        label: 'Forecast',
                        data: [...Array(historicalSales.length).fill(null), ...forecastData.values],
                        borderColor: '#ff6384',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: true,
                        borderDash: [5, 5]
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Forecasting Penjualan'
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating forecast chart:', error);
    }
}

// Create ABC analysis chart
async function createABCAnalysisChart(inventoryData) {
    try {
        const response = await fetch('/api/inventory-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inventory_data: inventoryData })
        });
        
        const analysisData = await response.json();
        
        const ctx = document.getElementById('abc-analysis-chart').getContext('2d');
        
        // Count products by ABC class
        const classCounts = {
            A: analysisData.abc_class.filter(c => c === 'A').length,
            B: analysisData.abc_class.filter(c => c === 'B').length,
            C: analysisData.abc_class.filter(c => c === 'C').length
        };
        
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Kelas A', 'Kelas B', 'Kelas C'],
                datasets: [{
                    data: [classCounts.A, classCounts.B, classCounts.C],
                    backgroundColor: [
                        '#4caf50',
                        '#ff9800',
                        '#f44336'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Distribusi Kelas ABC'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} produk (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating ABC analysis chart:', error);
    }
}

// Create inventory turnover chart
async function createInventoryTurnoverChart(inventoryData) {
    try {
        const response = await fetch('/api/inventory-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inventory_data: inventoryData })
        });
        
        const analysisData = await response.json();
        
        const ctx = document.getElementById('inventory-turnover-chart').getContext('2d');
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: analysisData.products,
                datasets: [{
                    label: 'Inventory Turnover',
                    data: analysisData.turnover,
                    backgroundColor: '#0055a5'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Inventory Turnover by Product'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Turnover Ratio'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating inventory turnover chart:', error);
    }
}

// Management functions
async function loadManagementData() {
    try {
        const response = await fetch('/api/management-data');
        const data = await response.json();
        
        // Create performance chart
        createPerformanceChart(data.performance_data);
        
        // Create profitability chart
        createProfitabilityChart(data.profitability_data);
        
        // Populate performance table
        populatePerformanceTable(data.performance_data);
        
    } catch (error) {
        console.error('Error loading management data:', error);
    }
}

function createPerformanceChart(performanceData) {
    const ctx = document.getElementById('performance-chart').getContext('2d');
    
    const months = performanceData.map(item => item.month);
    const sales = performanceData.map(item => item.sales);
    const costs = performanceData.map(item => item.costs);
    const profit = performanceData.map(item => item.profit);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Penjualan',
                    data: sales,
                    backgroundColor: '#4caf50',
                    order: 3
                },
                {
                    label: 'Biaya',
                    data: costs,
                    backgroundColor: '#f44336',
                    order: 2
                },
                {
                    label: 'Profit',
                    data: profit,
                    type: 'line',
                    borderColor: '#2196f3',
                    borderWidth: 2,
                    fill: false,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Kinerja Bulanan'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function createProfitabilityChart(profitabilityData) {
    const ctx = document.getElementById('profitability-chart').getContext('2d');
    
    const products = profitabilityData.map(item => item.product);
    const revenue = profitabilityData.map(item => item.revenue);
    const cost = profitabilityData.map(item => item.cost);
    const profit = profitabilityData.map(item => item.profit);
    const margin = profitabilityData.map(item => item.margin);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: products,
            datasets: [
                {
                    label: 'Pendapatan',
                    data: revenue,
                    backgroundColor: '#4caf50',
                    order: 3
                },
                {
                    label: 'Biaya',
                    data: cost,
                    backgroundColor: '#f44336',
                    order: 2
                },
                {
                    label: 'Profit',
                    data: profit,
                    backgroundColor: '#2196f3',
                    order: 1
                },
                {
                    label: 'Margin (%)',
                    data: margin,
                    type: 'line',
                    borderColor: '#ff9800',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1',
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Analisis Profitabilitas per Produk'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                },
                y1: {
                    position: 'right',
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function populatePerformanceTable(performanceData) {
    const tableBody = document.querySelector('#performance-table tbody');
    tableBody.innerHTML = '';
    
    performanceData.forEach(item => {
        const row = document.createElement('tr');
        const margin = ((item.profit / item.sales) * 100).toFixed(2);
        
        row.innerHTML = `
            <td>${item.month}</td>
            <td>${formatCurrency(item.sales)}</td>
            <td>${formatCurrency(item.costs)}</td>
            <td>${formatCurrency(item.profit)}</td>
            <td>${margin}%</td>
        `;
        
        tableBody.appendChild(row);
    });
}

async function generateReport() {
    try {
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const reportData = await response.json();
        
        // Simulate report download
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `laporan-manajemen-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('Laporan berhasil digenerate dan didownload!');
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Terjadi kesalahan saat generate laporan');
    }
}

async function analyzePerformance() {
    try {
        const response = await fetch('/api/analyze-performance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const analysis = await response.json();
        
        // Display performance analysis
        let analysisText = `Analisis Kinerja:\n`;
        analysisText += `Rata-rata Penjualan: ${formatCurrency(analysis.avg_sales)}\n`;
        analysisText += `Rata-rata Profit: ${formatCurrency(analysis.avg_profit)}\n`;
        analysisText += `Margin Rata-rata: ${analysis.avg_margin}%\n`;
        analysisText += `Pertumbuhan Bulanan: ${analysis.monthly_growth}%\n`;
        analysisText += `Produk Terbaik: ${analysis.top_product}\n`;
        analysisText += `Kategori Terbaik: ${analysis.top_category}`;
        
        alert(analysisText);
    } catch (error) {
        console.error('Error analyzing performance:', error);
        alert('Terjadi kesalahan saat menganalisis kinerja');
    }
}

// PPIC functions
async function loadPPICData() {
    try {
        const response = await fetch('/api/ppic-data');
        const data = await response.json();
        
        // Create EOQ chart
        createEOQChart(data.eoq_data);
        
        // Create demand pattern chart
        createDemandPatternChart(data.demand_data);
        
        // Populate ordering table
        populateOrderingTable(data.ordering_recommendations);
        
    } catch (error) {
        console.error('Error loading PPIC data:', error);
    }
}

function createEOQChart(eoqData) {
    const ctx = document.getElementById('eoq-chart').getContext('2d');
    
    const quantities = eoqData.map(item => item.quantity);
    const orderingCosts = eoqData.map(item => item.ordering_cost);
    const holdingCosts = eoqData.map(item => item.holding_cost);
    const totalCosts = eoqData.map(item => item.total_cost);
    
    // Find EOQ point (minimum total cost)
    const minTotalCost = Math.min(...totalCosts);
    const eoqIndex = totalCosts.indexOf(minTotalCost);
    const eoqPoint = quantities[eoqIndex];
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: quantities,
            datasets: [
                {
                    label: 'Biaya Pemesanan',
                    data: orderingCosts,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: true
                },
                {
                    label: 'Biaya Penyimpanan',
                    data: holdingCosts,
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true
                },
                {
                    label: 'Total Biaya',
                    data: totalCosts,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    borderWidth: 3
                },
                {
                    label: 'EOQ',
                    data: quantities.map((q, i) => i === eoqIndex ? minTotalCost : null),
                    pointBackgroundColor: '#ff9800',
                    pointBorderColor: '#ff9800',
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    showLine: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Analisis EOQ (Economic Order Quantity = ${eoqPoint})`
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Jumlah Pesanan'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Biaya'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function createDemandPatternChart(demandData) {
    const ctx = document.getElementById('demand-pattern-chart').getContext('2d');
    
    const periods = demandData.map(item => item.period);
    const demand = demandData.map(item => item.demand);
    const forecast = demandData.map(item => item.forecast);
    const error = demandData.map(item => item.error);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: periods,
            datasets: [
                {
                    label: 'Permintaan Aktual',
                    data: demand,
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Peramalan',
                    data: forecast,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    borderDash: [5, 5],
                    tension: 0.4
                },
                {
                    label: 'Error',
                    data: error,
                    borderColor: '#f44336',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    fill: true,
                    tension: 0.4,
                    hidden: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Pola Permintaan dan Peramalan'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Jumlah'
                    }
                }
            }
        }
    });
}

function populateOrderingTable(orderingData) {
    const tableBody = document.querySelector('#ordering-table tbody');
    tableBody.innerHTML = '';
    
    orderingData.forEach(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.product}</td>
            <td>${item.eoq}</td>
            <td>${item.rop}</td>
            <td>${item.safety_stock}</td>
            <td>${item.frequency} hari</td>
        `;
        
        tableBody.appendChild(row);
    });
}

async function calculateEOQ() {
    try {
        const response = await fetch('/api/calculate-eoq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const eoqData = await response.json();
        
        // Display EOQ calculation results
        let resultText = `Hasil Perhitungan EOQ:\n`;
        resultText += `EOQ: ${eoqData.eoq} unit\n`;
        resultText += `Total Biaya: ${formatCurrency(eoqData.total_cost)}\n`;
        resultText += `Biaya Pemesanan: ${formatCurrency(eoqData.ordering_cost)}\n`;
        resultText += `Biaya Penyimpanan: ${formatCurrency(eoqData.holding_cost)}\n`;
        resultText += `Jumlah Pemesanan Optimal per Tahun: ${eoqData.optimal_orders}x`;
        
        alert(resultText);
    } catch (error) {
        console.error('Error calculating EOQ:', error);
        alert('Terjadi kesalahan saat menghitung EOQ');
    }
}

async function calculateROP() {
    try {
        const response = await fetch('/api/calculate-rop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const ropData = await response.json();
        
        // Display ROP calculation results
        let resultText = `Hasil Perhitungan ROP:\n`;
        resultText += `ROP: ${ropData.rop} unit\n`;
        resultText += `Safety Stock: ${ropData.safety_stock} unit\n`;
        resultText += `Lead Time Demand: ${ropData.lead_time_demand} unit\n`;
        resultText += `Service Level: ${ropData.service_level}%`;
        
        alert(resultText);
    } catch (error) {
        console.error('Error calculating ROP:', error);
        alert('Terjadi kesalahan saat menghitung ROP');
    }
}

async function optimizeInventory() {
    try {
        const response = await fetch('/api/optimize-inventory', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const optimization = await response.json();
        
        // Display optimization results
        let resultText = `Hasil Optimasi Inventory:\n`;
        resultText += `Total Penghematan: ${formatCurrency(optimization.savings)}\n`;
        resultText += `Pengurangan Stock Out: ${optimization.stock_out_reduction}%\n`;
        resultText += `Peningkatan Turnover: ${optimization.turnover_improvement}%\n`;
        resultText += `Rekomendasi: ${optimization.recommendation}`;
        
        alert(resultText);
    } catch (error) {
        console.error('Error optimizing inventory:', error);
        alert('Terjadi kesalahan saat mengoptimasi inventory');
    }
}

// Inventory functions
async function loadInventoryData() {
    // Implementation for loading inventory data
    console.log('Loading inventory data...');
}

async function updateStock() {
    // Implementation for stock update
    console.log('Updating stock...');
}

async function checkExpiry() {
    // Implementation for expiry check
    console.log('Checking expiry dates...');
}

async function generateInventoryReport() {
    // Implementation for inventory report generation
    console.log('Generating inventory report...');
}