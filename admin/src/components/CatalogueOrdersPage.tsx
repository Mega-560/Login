import { useEffect, useState, type FormEvent } from 'react'
import { adminApi, type AdminBusinessPartner, type CustomerOrder } from '../adminApi'
import './CatalogueOperations.css'

const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' })
const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function CatalogueOrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [partners, setPartners] = useState<AdminBusinessPartner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyOrderId, setBusyOrderId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([adminApi.getOrders(), adminApi.getBusinessPartners()])
      .then(([loadedOrders, loadedPartners]) => {
        if (active) {
          setOrders(loadedOrders)
          setPartners(loadedPartners)
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load customer orders.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function updateStatus(order: CustomerOrder, status: CustomerOrder['status']) {
    setError('')
    setNotice('')
    setBusyOrderId(order.id)
    try {
      const updated = await adminApi.updateOrderStatus(order.id, status)
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item))
      setNotice(`Order ${order.id} is now ${updated.status}.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this order.')
    } finally {
      setBusyOrderId('')
    }
  }

  async function saveLogistics(event: FormEvent<HTMLFormElement>, order: CustomerOrder) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusyOrderId(order.id)
    const formData = new FormData(event.currentTarget)
    try {
      const updated = await adminApi.updateOrderLogistics(order.id, {
        shippingStatus: String(formData.get('shippingStatus')) as CustomerOrder['shippingStatus'],
        shippingCarrier: String(formData.get('shippingCarrier') ?? ''),
        trackingNumber: String(formData.get('trackingNumber') ?? ''),
        trackingUrl: String(formData.get('trackingUrl') ?? ''),
        estimatedDelivery: String(formData.get('estimatedDelivery') ?? ''),
        partnerId: String(formData.get('partnerId') ?? ''),
      })
      setOrders((current) => current.map((item) => item.id === order.id ? updated : item))
      setNotice(`Shipping details for order ${order.id} have been saved.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save shipping details.')
    } finally {
      setBusyOrderId('')
    }
  }

  return (
    <section className="admin-page catalogue-operations">
      <header className="admin-page-heading">
        <div>
          <p className="eyebrow">SALES / FULFILLMENT</p>
          <h1>Customer orders</h1>
          <p className="admin-page-subtitle">Review submitted orders and update their fulfillment status.</p>
        </div>
      </header>
      <div className="admin-dashboard-stats">
        <article className="admin-dashboard-stat"><span>TOTAL ORDERS</span><strong>{orders.length}</strong></article>
        <article className="admin-dashboard-stat"><span>AWAITING REVIEW</span><strong>{orders.filter((order) => order.status === 'pending').length}</strong></article>
        <article className="admin-dashboard-stat"><span>PAYMENT DUE</span><strong>{orders.filter((order) => order.paymentStatus === 'due').length}</strong></article>
      </div>
      <p className="catalogue-operations-payment-note"><strong>Payment processing is not configured.</strong> Every order is recorded as payment due; confirming or fulfilling an order does not collect payment.</p>
      {error && <p className="catalogue-operations-feedback is-error" role="alert">{error}</p>}
      {notice && <p className="catalogue-operations-feedback" role="status">{notice}</p>}
      {isLoading ? <p className="catalogue-operations-empty">Loading customer orders…</p> : orders.length === 0
        ? <p className="catalogue-operations-empty">No customer orders have been placed yet.</p>
        : <div className="catalogue-order-list">
          {orders.map((order) => (
            <article className="catalogue-order-card" key={order.id}>
              <header className="catalogue-order-heading">
                <div><p className="eyebrow">ORDER {order.id}</p><h2>{order.customerName}</h2><a href={`mailto:${order.customerEmail}`}>{order.customerEmail}</a></div>
                <div className="catalogue-order-badges">
                  <span className={`catalogue-status-tag status-${order.status}`}>{order.status}</span>
                  <span className="catalogue-status-tag">Payment {order.paymentStatus}</span>
                </div>
              </header>
              <div className="catalogue-order-meta"><span>Placed {dateTime.format(new Date(order.createdAt))}</span><span>{order.shippingAddress}</span></div>
              <form className="catalogue-logistics-form" onSubmit={(event) => void saveLogistics(event, order)}>
                <h3>Shipping &amp; partner fulfillment</h3>
                <div className="catalogue-logistics-fields">
                  <label>Shipping status
                    <select name="shippingStatus" defaultValue={order.shippingStatus} disabled={order.status === 'cancelled'}>
                      <option value="not_shipped">Not shipped</option>
                      <option value="preparing">Preparing</option>
                      <option value="shipped">Shipped</option>
                      <option value="in_transit">In transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="exception">Exception</option>
                    </select>
                  </label>
                  <label>Dealer or retailer
                    <select name="partnerId" defaultValue={order.partnerId ?? ''} disabled={order.status === 'cancelled'}>
                      <option value="">No partner assigned</option>
                      {order.partnerId && partners.some((partner) => partner.id === order.partnerId && !partner.active) && order.partnerName && (
                        <option value={order.partnerId}>{order.partnerName} (inactive)</option>
                      )}
                      {partners.filter((partner) => partner.active).map((partner) => (
                        <option value={partner.id} key={partner.id}>{partner.name} ({partner.type})</option>
                      ))}
                    </select>
                  </label>
                  <label>Carrier
                    <input name="shippingCarrier" defaultValue={order.shippingCarrier ?? ''} maxLength={100} disabled={order.status === 'cancelled'} />
                  </label>
                  <label>Tracking number
                    <input name="trackingNumber" defaultValue={order.trackingNumber ?? ''} maxLength={120} disabled={order.status === 'cancelled'} />
                  </label>
                  <label>Tracking URL
                    <input name="trackingUrl" type="url" defaultValue={order.trackingUrl ?? ''} maxLength={500} placeholder="https://" disabled={order.status === 'cancelled'} />
                  </label>
                  <label>Estimated delivery
                    <input name="estimatedDelivery" type="date" defaultValue={order.estimatedDelivery ?? ''} disabled={order.status === 'cancelled'} />
                  </label>
                </div>
                <button type="submit" disabled={busyOrderId === order.id || order.status === 'cancelled'}>
                  {busyOrderId === order.id ? 'Saving…' : 'Save shipping details'}
                </button>
              </form>
              <ul className="catalogue-order-items">
                {order.items.map((item) => <li key={item.partId}><span>{item.partName} <small>({item.partId}) × {item.quantity}</small></span><strong>{money.format(item.unitPrice * item.quantity)}</strong></li>)}
              </ul>
              <footer className="catalogue-order-footer">
                <strong>Subtotal {money.format(order.subtotal)}</strong>
                <div className="catalogue-operations-actions">
                  {order.status === 'pending' && <>
                    <button type="button" disabled={busyOrderId === order.id} onClick={() => void updateStatus(order, 'confirmed')}>Confirm</button>
                    <button type="button" disabled={busyOrderId === order.id} onClick={() => void updateStatus(order, 'cancelled')}>Cancel order</button>
                  </>}
                  {order.status === 'confirmed' && <>
                    <button type="button" disabled={busyOrderId === order.id} onClick={() => void updateStatus(order, 'fulfilled')}>Mark fulfilled</button>
                    <button type="button" disabled={busyOrderId === order.id} onClick={() => void updateStatus(order, 'cancelled')}>Cancel order</button>
                  </>}
                  {busyOrderId === order.id && <span role="status">Saving…</span>}
                </div>
              </footer>
            </article>
          ))}
        </div>}
    </section>
  )
}

export default CatalogueOrdersPage
