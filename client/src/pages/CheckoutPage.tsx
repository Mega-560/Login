import { useState, type FormEvent } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { catalogueApi, type CustomerOrder } from '../data/catalogueApi'
import { catalogueCurrency } from '../data/catalogueParts'
import type { SessionUser } from '../modules/auth/authApi'

function CheckoutPage() {
  const user = useOutletContext<SessionUser>()
  const { items, itemCount, subtotal, clearCart, catalogueLoading, refreshCatalogue } = useCart()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [shippingAddress, setShippingAddress] = useState('')
  const [confirmation, setConfirmation] = useState<CustomerOrder | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!items.length && !confirmation && !catalogueLoading) return <Navigate to="/cart" replace />

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const { order } = await catalogueApi.placeOrder({
        customerName: name.trim(),
        customerEmail: email.trim(),
        shippingAddress: shippingAddress.trim(),
        items: items.map(({ part, quantity }) => ({ partId: part.id, quantity })),
      })
      setConfirmation(order)
      clearCart()
      void refreshCatalogue()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not place your order.')
      void refreshCatalogue()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmation) {
    return (
      <section className="catalogue-page shopping-page checkout-page">
        <div className="checkout-confirmation">
          <span className="checkout-confirmation-icon" aria-hidden="true">✓</span>
          <p className="eyebrow">ORDER RECEIVED</p>
          <h1>Thank you, {confirmation.customerName}</h1>
          <p>Your order has been saved. Our team will confirm availability and delivery details. Payment is due after confirmation; no payment was collected online.</p>
          <div className="checkout-confirmation-summary">
            <span>Order number</span><strong>{confirmation.id}</strong>
            <span>Items</span><strong>{confirmation.items.reduce((count, item) => count + item.quantity, 0)}</strong>
            <span>Order total</span><strong>{catalogueCurrency.format(confirmation.subtotal)}</strong>
            <span>Order status</span><strong>{confirmation.status}</strong>
            <span>Payment status</span><strong>Due after confirmation</strong>
          </div>
          <div className="checkout-confirmation-actions">
            <Link className="catalogue-primary-button" to="/catalogue/cards">Continue shopping</Link>
            <Link className="catalogue-secondary-button" to="/orders">View order history</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="catalogue-page shopping-page checkout-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">ORDER DETAILS</p>
          <h1>Place your order</h1>
          <p>Submit your parts request. Inventory is checked again before the order is accepted.</p>
        </div>
        <Link className="catalogue-card-view-link" to="/cart">← Back to cart</Link>
      </div>

      <div className="checkout-demo-banner" role="note">
        <strong>Payment is not collected online.</strong>
        <span>Your order is stored as pending and an administrator will confirm it and arrange payment and delivery.</span>
      </div>
      {error && <p className="catalogue-feedback error" role="alert">{error}</p>}

      <div className="checkout-layout">
        <form className="checkout-details-panel" onSubmit={(event) => void placeOrder(event)}>
          <div className="checkout-section-heading">
            <span>01</span>
            <div><h2>Contact details</h2><p>We will use these details to confirm your order.</p></div>
          </div>
          <label className="checkout-field">Full name
            <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
          </label>
          <label className="checkout-field">Email address
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
          </label>

          <div className="checkout-section-heading checkout-payment-heading">
            <span>02</span>
            <div><h2>Delivery address</h2><p>Enter the address for this parts order.</p></div>
          </div>
          <label className="checkout-field">Full delivery address
            <textarea autoComplete="street-address" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} required maxLength={500} rows={4} />
          </label>
          <button type="submit" className="catalogue-primary-button checkout-complete-button" disabled={isSubmitting || !items.length}>
            {isSubmitting ? 'Saving order…' : `Place order · ${catalogueCurrency.format(subtotal)}`}
          </button>
          <p className="checkout-privacy-note">Your order and delivery details are stored securely with your account. Do not enter payment details here.</p>
        </form>

        <aside className="checkout-order-panel">
          <p className="eyebrow">YOUR ORDER</p>
          <h2>Order summary <span>{itemCount}</span></h2>
          <div className="checkout-order-items">
            {items.map(({ part, quantity }) => (
              <div className="checkout-order-line" key={part.id}>
                <img src={part.image} alt="" />
                <div><strong>{part.name}</strong><small>{quantity} × {catalogueCurrency.format(part.price)}</small></div>
                <b>{catalogueCurrency.format(part.price * quantity)}</b>
              </div>
            ))}
          </div>
          <div className="cart-summary-total"><span>Subtotal</span><strong>{catalogueCurrency.format(subtotal)}</strong></div>
          <p className="cart-currency-note">Shipping and payment are arranged after the order is confirmed. Prices are in USD.</p>
          <Link className="checkout-edit-cart" to="/cart">Edit cart</Link>
        </aside>
      </div>
    </section>
  )
}

export default CheckoutPage
