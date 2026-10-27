import { useState, type FormEvent } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import type { SessionUser } from '../modules/auth/authApi'
import { useCart } from '../cart/CartContext'
import { catalogueCurrency } from '../data/catalogueParts'

type DemoPaymentMethod = 'card' | 'upi'

function CheckoutPage() {
  const user = useOutletContext<SessionUser>()
  const { items, itemCount, subtotal, clearCart } = useCart()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [paymentMethod, setPaymentMethod] = useState<DemoPaymentMethod>('card')
  const [confirmation, setConfirmation] = useState<{ reference: string; total: number; count: number } | null>(null)

  if (!items.length && !confirmation) return <Navigate to="/cart" replace />

  function completeDemoCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConfirmation({
      reference: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      total: subtotal,
      count: itemCount,
    })
    clearCart()
  }

  if (confirmation) {
    return (
      <section className="catalogue-page shopping-page checkout-page">
        <div className="checkout-confirmation">
          <span className="checkout-confirmation-icon" aria-hidden="true">✓</span>
          <p className="eyebrow">DEMO CHECKOUT COMPLETE</p>
          <h1>Thank you, {name}</h1>
          <p>This was a local demo only. No payment was processed and no order was submitted or saved.</p>
          <div className="checkout-confirmation-summary">
            <span>Demo reference</span><strong>{confirmation.reference}</strong>
            <span>Items</span><strong>{confirmation.count}</strong>
            <span>Demo total</span><strong>{catalogueCurrency.format(confirmation.total)}</strong>
          </div>
          <Link className="catalogue-primary-button" to="/catalogue/cards">Return to parts catalogue</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="catalogue-page shopping-page checkout-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">SECURE CHECKOUT PREVIEW</p>
          <h1>Demo checkout</h1>
          <p>Review your details and simulate a checkout without sending payment information.</p>
        </div>
        <Link className="catalogue-card-view-link" to="/cart">← Back to cart</Link>
      </div>

      <div className="checkout-demo-banner" role="note">
        <strong>Demo mode — no real payment gateway is connected.</strong>
        <span>This page does not collect card or bank details, charge an account, or submit an order.</span>
      </div>

      <div className="checkout-layout">
        <form className="checkout-details-panel" onSubmit={completeDemoCheckout}>
          <div className="checkout-section-heading">
            <span>01</span>
            <div><h2>Contact details</h2><p>Used only for this local demo preview.</p></div>
          </div>
          <label className="checkout-field">Full name
            <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
          </label>
          <label className="checkout-field">Email address
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>

          <div className="checkout-section-heading checkout-payment-heading">
            <span>02</span>
            <div><h2>Demo payment method</h2><p>Choose an option to preview the checkout flow.</p></div>
          </div>
          <label className={`checkout-payment-option${paymentMethod === 'card' ? ' selected' : ''}`}>
            <input type="radio" name="demo-payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
            <span className="checkout-payment-icon" aria-hidden="true">▰</span>
            <span><strong>Credit or debit card</strong><small>Demo selection only · no card details requested</small></span>
            <span className="checkout-payment-badge">DEMO</span>
          </label>
          <label className={`checkout-payment-option${paymentMethod === 'upi' ? ' selected' : ''}`}>
            <input type="radio" name="demo-payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
            <span className="checkout-payment-icon" aria-hidden="true">⌁</span>
            <span><strong>UPI / online banking</strong><small>Demo selection only · no bank connection</small></span>
            <span className="checkout-payment-badge">DEMO</span>
          </label>
          <button type="submit" className="catalogue-primary-button checkout-complete-button">Simulate checkout · {catalogueCurrency.format(subtotal)}</button>
          <p className="checkout-privacy-note">Do not enter payment credentials. This demo does not connect to Razorpay or another payment provider.</p>
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
          <p className="cart-currency-note">Displayed in USD. Taxes and shipping are not calculated in this demo.</p>
          <Link className="checkout-edit-cart" to="/cart">Edit cart</Link>
        </aside>
      </div>
    </section>
  )
}

export default CheckoutPage
