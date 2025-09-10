from flask import Flask, render_template, jsonify, request
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import statsmodels.api as sm
from statsmodels.tsa.arima.model import ARIMA
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import math
import random



app = Flask(__name__)

# Load sample data
def load_data():
    with open('static/data/sample_data.json', 'r') as f:
        data = json.load(f)
    return data

# Generate sales forecasting using ARIMA
def generate_forecast(sales_data, periods=12):
    dates = [datetime.strptime(d['date'], '%Y-%m-%d') for d in sales_data]
    sales = [d['sales'] for d in sales_data]
    
    # Create time series
    ts = pd.Series(sales, index=dates)
    
    # Fit ARIMA model
    model = ARIMA(ts, order=(1, 1, 1))
    model_fit = model.fit()
    
    # Generate forecast
    forecast = model_fit.forecast(steps=periods)
    
    # Prepare data for response
    last_date = max(dates)
    forecast_dates = [last_date + timedelta(days=(i+1)*30) for i in range(periods)]
    forecast_values = forecast.tolist()
    
    return forecast_dates, forecast_values

# Generate sales trend analysis
def analyze_trends(sales_data):
    dates = [datetime.strptime(d['date'], '%Y-%m-%d') for d in sales_data]
    sales = [d['sales'] for d in sales_data]
    
    # Calculate moving averages
    df = pd.DataFrame({'date': dates, 'sales': sales})
    df.set_index('date', inplace=True)
    df['ma_7'] = df['sales'].rolling(window=7).mean()
    df['ma_30'] = df['sales'].rolling(window=30).mean()
    
    # Calculate growth rate
    df['growth'] = df['sales'].pct_change() * 100
    
    return df

# Generate inventory analysis
def analyze_inventory(inventory_data):
    df = pd.DataFrame(inventory_data)
    
    # Calculate inventory turnover
    df['turnover'] = df['sales'] / df['stock']
    
    # Classify ABC analysis
    df['value'] = df['price'] * df['stock']
    df['value_percentage'] = (df['value'] / df['value'].sum()) * 100
    df['cumulative_percentage'] = df['value_percentage'].cumsum()
    
    # Assign ABC classification
    df['abc_class'] = np.where(df['cumulative_percentage'] <= 80, 'A', 
                              np.where(df['cumulative_percentage'] <= 95, 'B', 'C'))
    
    return df

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/dashboard-data')
def dashboard_data():
    data = load_data()
    return jsonify(data)

@app.route('/api/forecast', methods=['POST'])
def forecast():
    data = request.json
    sales_data = data.get('sales_data', [])
    
    if not sales_data:
        return jsonify({'error': 'No sales data provided'}), 400
    
    forecast_dates, forecast_values = generate_forecast(sales_data)
    
    # Convert dates to strings for JSON serialization
    forecast_dates_str = [d.strftime('%Y-%m-%d') for d in forecast_dates]
    
    return jsonify({
        'dates': forecast_dates_str,
        'values': forecast_values
    })

@app.route('/api/trends', methods=['POST'])
def trends():
    data = request.json
    sales_data = data.get('sales_data', [])
    
    if not sales_data:
        return jsonify({'error': 'No sales data provided'}), 400
    
    df = analyze_trends(sales_data)
    
    # Convert to dictionary for JSON response
    result = {
        'dates': [d.strftime('%Y-%m-%d') for d in df.index],
        'sales': df['sales'].tolist(),
        'ma_7': df['ma_7'].tolist(),
        'ma_30': df['ma_30'].tolist(),
        'growth': df['growth'].tolist()
    }
    
    return jsonify(result)

@app.route('/api/inventory-analysis', methods=['POST'])
def inventory_analysis():
    data = request.json
    inventory_data = data.get('inventory_data', [])
    
    if not inventory_data:
        return jsonify({'error': 'No inventory data provided'}), 400
    
    df = analyze_inventory(inventory_data)
    
    # Convert to dictionary for JSON response
    result = {
        'products': df['product'].tolist(),
        'turnover': df['turnover'].tolist(),
        'value': df['value'].tolist(),
        'abc_class': df['abc_class'].tolist()
    }
    
    return jsonify(result)


# API endpoints for management
@app.route('/api/management-data')
def management_data():
    # Generate sample management data
    performance_data = [
        {'month': 'Jan', 'sales': 120000000, 'costs': 80000000, 'profit': 40000000},
        {'month': 'Feb', 'sales': 130000000, 'costs': 85000000, 'profit': 45000000},
        {'month': 'Mar', 'sales': 125000000, 'costs': 82000000, 'profit': 43000000},
        {'month': 'Apr', 'sales': 140000000, 'costs': 90000000, 'profit': 50000000},
        {'month': 'Mei', 'sales': 135000000, 'costs': 87000000, 'profit': 48000000},
        {'month': 'Jun', 'sales': 150000000, 'costs': 95000000, 'profit': 55000000}
    ]
    
    profitability_data = [
        {'product': 'Indomie Goreng', 'revenue': 30000000, 'cost': 18000000, 'profit': 12000000, 'margin': 40.0},
        {'product': 'Aqua 600ml', 'revenue': 25000000, 'cost': 15000000, 'profit': 10000000, 'margin': 40.0},
        {'product': 'Rokok Surya', 'revenue': 40000000, 'cost': 32000000, 'profit': 8000000, 'margin': 20.0},
        {'product': 'Pocari Sweat', 'revenue': 15000000, 'cost': 9000000, 'profit': 6000000, 'margin': 40.0},
        {'product': 'Teh Botol', 'revenue': 18000000, 'cost': 10800000, 'profit': 7200000, 'margin': 40.0}
    ]
    
    return jsonify({
        'performance_data': performance_data,
        'profitability_data': profitability_data
    })

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    # Simulate report generation
    report_data = {
        'report_id': 'RPT-' + datetime.now().strftime('%Y%m%d-%H%M%S'),
        'generated_at': datetime.now().isoformat(),
        'period': 'Bulanan',
        'summary': {
            'total_sales': 800000000,
            'total_costs': 520000000,
            'total_profit': 280000000,
            'avg_margin': 35.0,
            'growth_rate': 12.5
        },
        'details': 'Laporan detail kinerja manajemen...'
    }
    
    return jsonify(report_data)

@app.route('/api/analyze-performance', methods=['POST'])
def analyze_performance():
    # Simulate performance analysis
    analysis = {
        'avg_sales': 133333333,
        'avg_profit': 46666667,
        'avg_margin': 35.0,
        'monthly_growth': 8.3,
        'top_product': 'Rokok Surya',
        'top_category': 'Makanan & Minuman'
    }
    
    return jsonify(analysis)

# API endpoints for PPIC
@app.route('/api/ppic-data')
def ppic_data():
    # Generate sample PPIC data
    eoq_data = []
    for q in range(50, 501, 50):
        ordering_cost = (12000000 / q) * 25000  # D = 12,000,000 units/year, S = 25,000
        holding_cost = (q / 2) * 5000  # H = 5,000/unit/year
        total_cost = ordering_cost + holding_cost
        eoq_data.append({
            'quantity': q,
            'ordering_cost': ordering_cost,
            'holding_cost': holding_cost,
            'total_cost': total_cost
        })
    
    demand_data = []
    for i in range(1, 13):
        base_demand = 1000
        seasonality = 200 * math.sin(i * math.pi / 6)
        trend = 50 * i
        actual = base_demand + seasonality + trend + random.randint(-100, 100)
        forecast = base_demand + seasonality + trend
        error = actual - forecast
        
        demand_data.append({
            'period': f'Bulan {i}',
            'demand': actual,
            'forecast': forecast,
            'error': error
        })
    
    ordering_recommendations = [
        {'product': 'Indomie Goreng', 'eoq': 346, 'rop': 120, 'safety_stock': 40, 'frequency': 10},
        {'product': 'Aqua 600ml', 'eoq': 316, 'rop': 150, 'safety_stock': 50, 'frequency': 8},
        {'product': 'Rokok Surya', 'eoq': 283, 'rop': 80, 'safety_stock': 25, 'frequency': 13},
        {'product': 'Pocari Sweat', 'eoq': 245, 'rop': 60, 'safety_stock': 20, 'frequency': 15},
        {'product': 'Teh Botol', 'eoq': 268, 'rop': 90, 'safety_stock': 30, 'frequency': 12}
    ]
    
    return jsonify({
        'eoq_data': eoq_data,
        'demand_data': demand_data,
        'ordering_recommendations': ordering_recommendations
    })

@app.route('/api/calculate-eoq', methods=['POST'])
def calculate_eoq():
    # EOQ calculation
    D = 12000000  # Annual demand
    S = 25000     # Ordering cost per order
    H = 5000      # Holding cost per unit per year
    
    eoq = math.sqrt((2 * D * S) / H)
    optimal_orders = D / eoq
    ordering_cost = (D / eoq) * S
    holding_cost = (eoq / 2) * H
    total_cost = ordering_cost + holding_cost
    
    return jsonify({
        'eoq': round(eoq),
        'total_cost': total_cost,
        'ordering_cost': ordering_cost,
        'holding_cost': holding_cost,
        'optimal_orders': round(optimal_orders, 1)
    })

@app.route('/api/calculate-rop', methods=['POST'])
def calculate_rop():
    # ROP calculation
    d = 40000     # Daily demand
    L = 3         # Lead time in days
    Z = 1.65      # Z-score for 95% service level
    σ = 5000      # Standard deviation of daily demand
    
    lead_time_demand = d * L
    safety_stock = Z * σ * math.sqrt(L)
    rop = lead_time_demand + safety_stock
    
    return jsonify({
        'rop': round(rop),
        'safety_stock': round(safety_stock),
        'lead_time_demand': round(lead_time_demand),
        'service_level': 95
    })

@app.route('/api/optimize-inventory', methods=['POST'])
def optimize_inventory():
    # Inventory optimization simulation
    optimization = {
        'savings': 12500000,
        'stock_out_reduction': 35,
        'turnover_improvement': 22,
        'recommendation': 'Tingkatkan frekuensi pemesanan untuk produk kelas A, kurangi stock produk kelas C'
    }
    
    return jsonify(optimization)


if __name__ == "__main__":
    # untuk lokal testing
    app.run(host="0.0.0.0", port=5000)
