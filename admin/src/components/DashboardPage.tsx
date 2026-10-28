import { useRef } from 'react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  ArcElement,
  type ChartOptions,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

type ExportableChart = {
  toBase64Image: (type?: string, quality?: number) => string
}

function downloadChart(chart: ExportableChart | null, filename: string) {
  if (!chart) return

  const link = document.createElement('a')
  link.href = chart.toBase64Image('image/png', 1)
  link.download = `${filename}.png`
  link.click()
}

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
)

const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const inventory = [
  { category: 'Braking', units: 36 },
  { category: 'Filters', units: 97 },
  { category: 'Wheels & tyres', units: 23 },
  { category: 'Ignition', units: 49 },
]

const chartLegend = {
  position: 'bottom' as const,
  labels: {
    usePointStyle: true,
    pointStyle: 'circle' as const,
    boxWidth: 7,
    padding: 18,
  },
}

const salesData = {
  labels: months,
  datasets: [{
    label: 'Sales (USD)',
    data: [15800, 19400, 17250, 23100, 21800, 24860],
    borderColor: '#39765a',
    backgroundColor: 'rgba(95, 155, 112, 0.14)',
    fill: true,
    tension: 0.38,
    pointRadius: 3,
    pointHoverRadius: 5,
  }],
}

const ordersData = {
  labels: months,
  datasets: [{
    label: 'Orders',
    data: [118, 142, 131, 167, 159, 186],
    backgroundColor: '#83a98c',
    borderRadius: 4,
    maxBarThickness: 32,
  }],
}

const inventoryData = {
  labels: inventory.map(({ category }) => category),
  datasets: [{
    label: 'Units in stock',
    data: inventory.map(({ units }) => units),
    backgroundColor: ['#49785b', '#93ac7b', '#6c91a0', '#b3a36a'],
    borderRadius: 4,
    maxBarThickness: 30,
  }],
}

const orderStatusData = {
  labels: ['Delivered', 'Processing', 'Pending', 'Cancelled'],
  datasets: [{
    data: [112, 38, 27, 9],
    backgroundColor: ['#548365', '#8ba9ba', '#e4bd70', '#c98576'],
    borderColor: '#ffffff',
    borderWidth: 3,
    hoverOffset: 5,
  }],
}

const salesOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: chartLegend,
    tooltip: {
      callbacks: {
        label: (context) =>
          ` $${(context.parsed.y ?? 0).toLocaleString('en-US')}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#edf0eb' },
      ticks: {
        callback: (value: string | number) => `$${Number(value) / 1000}k`,
      },
    },
    x: { grid: { display: false } },
  },
}

const ordersOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: chartLegend,
    tooltip: { callbacks: { label: (context) => ` ${context.parsed.y ?? 0} orders` } },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#edf0eb' },
      ticks: { precision: 0 },
    },
    x: { grid: { display: false } },
  },
}

const inventoryOptions: ChartOptions<'bar'> = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (context) => ` ${context.parsed.x ?? 0} units` } },
  },
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: '#edf0eb' },
      ticks: { precision: 0 },
    },
    y: { grid: { display: false } },
  },
}

const orderStatusOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: { legend: chartLegend },
}

function DashboardPage() {
  const totalUnits = inventory.reduce((total, item) => total + item.units, 0)
  const salesChart = useRef<ChartJS<'line'>>(null)
  const inventoryChart = useRef<ChartJS<'bar'>>(null)
  const ordersChart = useRef<ChartJS<'bar'>>(null)
  const orderStatusChart = useRef<ChartJS<'doughnut'>>(null)

  return (
    <section className="admin-dashboard">
      <header className="admin-dashboard-heading">
        <div>
          <p className="eyebrow">OVERVIEW / OPERATIONS</p>
          <h1>Dashboard</h1>
          <p>Monitor inventory, sales performance, and order activity.</p>
        </div>
        <span className="admin-dashboard-period">Last 6 months <span aria-hidden="true">⌄</span></span>
      </header>

      <div className="admin-dashboard-demo-note" role="note">
        <strong>Sample analytics</strong>
        <span>Charts below use illustrative demo data. Live inventory, sales, and order reporting is not connected yet.</span>
      </div>

      <section className="admin-dashboard-stats" aria-label="Business summary">
        <article className="admin-dashboard-stat">
          <span>INVENTORY ON HAND</span>
          <strong>{totalUnits.toLocaleString()}</strong>
          <small>Units across 4 product categories</small>
          <i className="admin-stat-mark inventory" aria-hidden="true">▦</i>
        </article>
        <article className="admin-dashboard-stat">
          <span>SALES THIS MONTH</span>
          <strong>$24,860</strong>
          <small><b className="admin-stat-positive">+14.2%</b> vs. previous month</small>
          <i className="admin-stat-mark sales" aria-hidden="true">$</i>
        </article>
        <article className="admin-dashboard-stat">
          <span>ORDERS THIS MONTH</span>
          <strong>186</strong>
          <small><b className="admin-stat-positive">+9.8%</b> vs. previous month</small>
          <i className="admin-stat-mark orders" aria-hidden="true">↗</i>
        </article>
        <article className="admin-dashboard-stat">
          <span>LOW-STOCK PRODUCTS</span>
          <strong>4</strong>
          <small>Sample alert threshold: fewer than 10</small>
          <i className="admin-stat-mark low-stock" aria-hidden="true">!</i>
        </article>
      </section>

      <section className="admin-dashboard-chart-grid" aria-label="Inventory and sales charts">
        <article className="admin-chart-panel admin-chart-panel-wide">
          <div className="admin-chart-heading">
            <div><h2>Sales overview</h2><p>Monthly revenue · USD</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Sales</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(salesChart.current, 'sales-overview')}>Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-sales-chart">
            <Line ref={salesChart} data={salesData} options={salesOptions} aria-label="Line chart showing monthly sales in USD" role="img" />
          </div>
        </article>

        <article className="admin-chart-panel">
          <div className="admin-chart-heading">
            <div><h2>Inventory by category</h2><p>Available units by product type</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Stock</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(inventoryChart.current, 'inventory-by-category')}>Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-inventory-chart">
            <Bar ref={inventoryChart} data={inventoryData} options={inventoryOptions} aria-label="Bar chart showing inventory units by category" role="img" />
          </div>
        </article>

        <article className="admin-chart-panel">
          <div className="admin-chart-heading">
            <div><h2>Order activity</h2><p>Orders placed each month</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Orders</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(ordersChart.current, 'order-activity')}>Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-orders-chart">
            <Bar ref={ordersChart} data={ordersData} options={ordersOptions} aria-label="Bar chart showing monthly order counts" role="img" />
          </div>
        </article>

        <article className="admin-chart-panel">
          <div className="admin-chart-heading">
            <div><h2>Order status</h2><p>Breakdown of sample orders</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Fulfilment</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(orderStatusChart.current, 'order-status')}>Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-status-chart">
            <Doughnut ref={orderStatusChart} data={orderStatusData} options={orderStatusOptions} aria-label="Doughnut chart showing order status breakdown" role="img" />
          </div>
        </article>
      </section>
    </section>
  )
}

export default DashboardPage
