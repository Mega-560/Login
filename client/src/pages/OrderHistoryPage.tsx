import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { catalogueApi, type CustomerOrder } from '../data/catalogueApi'
import { catalogueCurrency } from '../data/catalogueParts'
import './catalogueOperations.css'

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function OrderHistoryPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    catalogueApi.getOrders()
      .then((loadedOrders) => {
        if (active) setOrders(loadedOrders)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load your order history.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <section className="catalogue-page shopping-page client-order-history">
      <header className="catalogue-page-heading">
        <div><p className="eyebrow">YOUR ACCOUNT</p><h1>Order history</h1><p>Track the status and payment state of your parts orders.</p></div>
        <Link className="catalogue-card-view-link" to="/catalogue/cards">Continue shopping <span aria-hidden="true">→</span></Link>
      </header>
      {error && <p className="catalogue-feedback error" role="alert">{error}</p>}
      {isLoading ? <p className="catalogue-empty" role="status">Loading your orders…</p>
        : orders.length === 0
          ? <div className="catalogue-empty-state"><h2>No orders yet</h2><p>Orders you place from the parts catalogue will appear here.</p><Link className="catalogue-primary-button" to="/catalogue/cards">Browse parts</Link></div>
          : <div className="client-order-list">
            {orders.map((order) => (
              <article className="client-order-card" key={order.id}>
                <header><div><p className="eyebrow">ORDER {order.id}</p><h2>{dateTime.format(new Date(order.createdAt))}</h2></div><div className="client-order-statuses"><span className={`client-order-status status-${order.status}`}>{order.status}</span><span className="client-order-status">Payment {order.paymentStatus}</span></div></header>
                <section className="client-order-shipment" aria-label="Shipping and tracking">
                  <strong>Shipping: {order.shippingStatus.replaceAll('_', ' ')}</strong>
                  {order.shippingCarrier && <span>Carrier: {order.shippingCarrier}</span>}
                  {order.trackingNumber && <span>Tracking number: {order.trackingNumber}</span>}
                  {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer">Track shipment <span aria-hidden="true">↗</span></a>}
                  {order.estimatedDelivery && <span>Estimated delivery: {new Date(`${order.estimatedDelivery}T00:00:00`).toLocaleDateString()}</span>}
                  {order.partnerName && <span>Fulfilled through: {order.partnerName} ({order.partnerType})</span>}
                </section>
                <ul>
                  {order.items.map((item) => <li key={item.partId}><span>{item.partName} <small>{item.partId} · {item.quantity} × {catalogueCurrency.format(item.unitPrice)}</small></span><strong>{catalogueCurrency.format(item.unitPrice * item.quantity)}</strong></li>)}
                </ul>
                <footer><span>Delivery address: {order.shippingAddress}</span><strong>Subtotal {catalogueCurrency.format(order.subtotal)}</strong></footer>
                {order.paymentStatus === 'due' && <p className="client-order-payment-note">Payment has not been collected online. The team will arrange payment after confirming your order.</p>}
              </article>
            ))}
          </div>}
    </section>
  )
}

export default OrderHistoryPage
