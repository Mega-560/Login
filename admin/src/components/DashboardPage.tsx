import { useEffect, useRef, useState } from 'react'
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
import { adminApi, type AdminCataloguePart, type CustomerOrder } from '../adminApi'

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

function getThemeColor(property: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim() || fallback
}

function withAlpha(hex: string, alpha: number) {
  const channels = hex.match(/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i)
  if (!channels) return hex
  const [, red, green, blue] = channels
  return `rgba(${Number.parseInt(red, 16)}, ${Number.parseInt(green, 16)}, ${Number.parseInt(blue, 16)}, ${alpha})`
}

function DownloadIcon() {
  return (
    <svg className="admin-chart-export-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.5v7" />
      <path d="m5.25 7.25 2.75 2.75 2.75-2.75" />
      <path d="M3 11v2h10v-2" />
    </svg>
  )
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

const chartLegend = {
  position: 'bottom' as const,
  labels: {
    usePointStyle: true,
    pointStyle: 'circle' as const,
    boxWidth: 7,
    padding: 18,
  },
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
      grid: { color: () => getThemeColor('--theme-border', '#edf0eb') },
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
      grid: { color: () => getThemeColor('--theme-border', '#edf0eb') },
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
      grid: { color: () => getThemeColor('--theme-border', '#edf0eb') },
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
  const [parts, setParts] = useState<AdminCataloguePart[]>([])
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([adminApi.getCatalogueParts(), adminApi.getOrders()])
      .then(([loadedParts, loadedOrders]) => {
        if (!active) return
        setParts(loadedParts)
        setOrders(loadedOrders)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load dashboard data.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const activeParts = parts.filter((part) => part.active)
  const totalUnits = activeParts.reduce((total, part) => total + part.stock, 0)
  const monthStarts = Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    date.setHours(0, 0, 0, 0)
    return date
  })
  const monthLabels = monthStarts.map((date) => new Intl.DateTimeFormat(undefined, { month: 'short' }).format(date))
  const monthlyOrders = monthStarts.map((month, index) => {
    const nextMonth = monthStarts[index + 1]
    return orders.filter(({ createdAt }) => {
      const created = new Date(createdAt)
      return created >= month && (nextMonth ? created < nextMonth : created <= new Date())
    })
  })
  const ordersPerMonth = monthlyOrders.map((monthOrders) => monthOrders.length)
  const orderValuePerMonth = monthlyOrders.map((monthOrders) =>
    monthOrders.filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.subtotal, 0))
  const categoryInventory = Array.from(activeParts.reduce((totals, part) => {
    totals.set(part.category, (totals.get(part.category) ?? 0) + part.stock)
    return totals
  }, new Map<string, number>()), ([category, units]) => ({ category, units }))
  const pendingOrders = orders.filter((order) => order.status === 'pending').length
  const thisMonthOrders = ordersPerMonth[ordersPerMonth.length - 1] ?? 0
  const lowStockParts = activeParts.filter((part) => part.stock < 10).length
  const orderStatusCounts = ['confirmed', 'fulfilled', 'pending', 'cancelled'].map((status) =>
    orders.filter((order) => order.status === status).length)
  const themeAccent = getThemeColor('--theme-accent', '#3b82f6')
  ChartJS.defaults.color = getThemeColor('--theme-muted', '#707477')
  const salesChart = useRef<ChartJS<'line'>>(null)
  const inventoryChart = useRef<ChartJS<'bar'>>(null)
  const ordersChart = useRef<ChartJS<'bar'>>(null)
  const orderStatusChart = useRef<ChartJS<'doughnut'>>(null)
  const themedSalesData = {
    labels: monthLabels,
    datasets: [{
      label: 'Order subtotal (USD)',
      data: orderValuePerMonth,
      borderColor: themeAccent,
      backgroundColor: withAlpha(themeAccent, 0.14),
      fill: true,
      tension: 0.38,
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  }
  const themedOrdersData = {
    labels: monthLabels,
    datasets: [{
      label: 'Orders',
      data: ordersPerMonth,
      backgroundColor: themeAccent,
      borderRadius: 4,
      maxBarThickness: 32,
    }],
  }
  const themedInventoryData = {
    labels: categoryInventory.map(({ category }) => category),
    datasets: [{
      label: 'Units in stock',
      data: categoryInventory.map(({ units }) => units),
      backgroundColor: categoryInventory.map((_, index) => withAlpha(themeAccent, Math.max(0.35, 1 - index * 0.15))),
      borderRadius: 4,
      maxBarThickness: 30,
    }],
  }
  const themedOrderStatusData = {
    labels: ['Confirmed', 'Fulfilled', 'Pending', 'Cancelled'],
    datasets: [{
      data: orderStatusCounts,
      backgroundColor: [themeAccent, withAlpha(themeAccent, 0.72), '#e4bd70', '#c98576'],
      borderColor: getThemeColor('--theme-surface', '#ffffff'),
      borderWidth: 3,
      hoverOffset: 5,
    }],
  }

  return (
    <section className="admin-dashboard">
      <header className="admin-dashboard-heading">
        <div>
          <p className="eyebrow">OVERVIEW / OPERATIONS</p>
          <h1>Dashboard</h1>
          <p>Monitor live inventory, customer order activity, and order values.</p>
        </div>
        <span className="admin-dashboard-period">Last 6 months</span>
      </header>

      {error && <div className="admin-dashboard-demo-note" role="alert"><strong>Dashboard unavailable</strong><span>{error}</span></div>}
      {isLoading && <div className="admin-dashboard-demo-note" role="status"><strong>Loading</strong><span>Fetching live inventory and orders…</span></div>}

      <section className="admin-dashboard-stats" aria-label="Business summary">
        <article className="admin-dashboard-stat">
          <span>INVENTORY ON HAND</span>
          <strong>{totalUnits.toLocaleString()}</strong>
          <small>Units across {categoryInventory.length} active categories</small>
          <i className="admin-stat-mark inventory" aria-hidden="true">▦</i>
        </article>
        <article className="admin-dashboard-stat">
          <span>AWAITING REVIEW</span>
          <strong>{pendingOrders}</strong>
          <small>Orders that need admin confirmation</small>
          <i className="admin-stat-mark sales" aria-hidden="true">!</i>
        </article>
        <article className="admin-dashboard-stat">
          <span>ORDERS THIS MONTH</span>
          <strong>{thisMonthOrders}</strong>
          <small>Orders placed this calendar month</small>
          <i className="admin-stat-mark orders" aria-hidden="true">↗</i>
        </article>
        <article className="admin-dashboard-stat">
          <span>LOW-STOCK PRODUCTS</span>
          <strong>{lowStockParts}</strong>
          <small>Active parts with fewer than 10 units</small>
          <i className="admin-stat-mark low-stock" aria-hidden="true">!</i>
        </article>
      </section>

      <section className="admin-dashboard-chart-grid" aria-label="Inventory and sales charts">
        <article className="admin-chart-panel admin-chart-panel-wide">
          <div className="admin-chart-heading">
            <div><h2>Order value overview</h2><p>Monthly order subtotals · USD, not payments received</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Order value</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(salesChart.current, 'order-value-overview')}><DownloadIcon />Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-sales-chart">
            <Line ref={salesChart} data={themedSalesData} options={salesOptions} aria-label="Line chart showing monthly order subtotals in USD" role="img" />
          </div>
        </article>

        <article className="admin-chart-panel">
          <div className="admin-chart-heading">
            <div><h2>Inventory by category</h2><p>Available units by product type</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Stock</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(inventoryChart.current, 'inventory-by-category')}><DownloadIcon />Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-inventory-chart">
            <Bar ref={inventoryChart} data={themedInventoryData} options={inventoryOptions} aria-label="Bar chart showing inventory units by category" role="img" />
          </div>
        </article>

        <article className="admin-chart-panel">
          <div className="admin-chart-heading">
            <div><h2>Order activity</h2><p>Orders placed each month</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Orders</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(ordersChart.current, 'order-activity')}><DownloadIcon />Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-orders-chart">
            <Bar ref={ordersChart} data={themedOrdersData} options={ordersOptions} aria-label="Bar chart showing monthly order counts" role="img" />
          </div>
        </article>

        <article className="admin-chart-panel">
          <div className="admin-chart-heading">
            <div><h2>Order status</h2><p>Current order fulfillment states</p></div>
            <div className="admin-chart-actions">
              <span className="admin-chart-badge">Fulfilment</span>
              <button type="button" className="admin-chart-export" onClick={() => downloadChart(orderStatusChart.current, 'order-status')}><DownloadIcon />Export PNG</button>
            </div>
          </div>
          <div className="admin-chart-canvas admin-status-chart">
            <Doughnut ref={orderStatusChart} data={themedOrderStatusData} options={orderStatusOptions} aria-label="Doughnut chart showing order status breakdown" role="img" />
          </div>
        </article>
      </section>
    </section>
  )
}

export default DashboardPage
