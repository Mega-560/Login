import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import type { SessionUser } from '../modules/auth/authApi'
import { useCart } from '../cart/CartContext'

type DemoPaymentMethod = 'card' | 'upi'
type CheckoutCurrency = 'USD' | 'INR'

interface ExchangeRate {
  rate: number
  date: string
}

interface CheckoutConfirmation {
  reference: string
  total: number
  count: number
  currency: CheckoutCurrency
  exchangeRate: number
  rateDate: string | null
}

function formatCurrency(amount: number, currency: CheckoutCurrency) {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function readExchangeRate(payload: unknown): ExchangeRate | null {
  if (typeof payload !== 'object' || payload === null || !('rates' in payload) || !('date' in payload)) return null
  const rates = payload.rates
  if (typeof rates !== 'object' || rates === null || !('INR' in rates)) return null
  const rate = rates.INR
  const date = payload.date
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || typeof date !== 'string') return null
  return { rate, date }
}

function CheckoutPage() {
  const user = useOutletContext<SessionUser>()
  const { items, itemCount, subtotal, clearCart } = useCart()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [paymentMethod, setPaymentMethod] = useState<DemoPaymentMethod>('card')
  const [currency, setCurrency] = useState<CheckoutCurrency>('USD')
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null)
  const [exchangeLoading, setExchangeLoading] = useState(false)
  const [exchangeError, setExchangeError] = useState('')
  const [exchangeRequest, setExchangeRequest] = useState(0)
  const [confirmation, setConfirmation] = useState<CheckoutConfirmation | null>(null)

  useEffect(() => {
    if (currency === 'USD') {
      setExchangeRate(null)
      setExchangeError('')
      setExchangeLoading(false)
      return
    }

    const controller = new AbortController()
    setExchangeRate(null)
    setExchangeError('')
    setExchangeLoading(true)

    async function loadExchangeRate() {
      try {
        const response = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR', {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Exchange-rate service returned ${response.status}.`)
        const result = readExchangeRate(await response.json())
        if (!result) throw new Error('Exchange-rate service returned an invalid USD to INR rate.')
        setExchangeRate(result)
      } catch (error) {
        if (controller.signal.aborted) return
        setExchangeError(error instanceof Error ? error.message : 'Could not load the USD to INR exchange rate.')
      } finally {
        if (!controller.signal.aborted) setExchangeLoading(false)
      }
    }

    void loadExchangeRate()
    return () => controller.abort()
  }, [currency, exchangeRequest])

  if (!items.length && !confirmation) return <Navigate to="/cart" replace />

  function completeDemoCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const rate = currency === 'USD' ? 1 : exchangeRate?.rate
    if (!rate) return
    setConfirmation({
      reference: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      total: subtotal * rate,
      count: itemCount,
      currency,
      exchangeRate: rate,
      rateDate: currency === 'INR' ? exchangeRate?.date ?? null : null,
    })
    clearCart()
  }

  const activeRate = currency === 'USD' ? 1 : exchangeRate?.rate
  const canCompleteCheckout = !exchangeLoading && !exchangeError && activeRate !== undefined && activeRate !== null
  const formatCheckoutAmount = (amount: number) => activeRate === undefined || activeRate === null
    ? '—'
    : formatCurrency(amount * activeRate, currency)

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
            <span>Demo total</span><strong>{formatCurrency(confirmation.total, confirmation.currency)}</strong>
            {confirmation.currency === 'INR' && confirmation.rateDate && (
              <>
                <span>Exchange rate</span>
                <strong>1 USD = {formatCurrency(confirmation.exchangeRate, 'INR')} · {confirmation.rateDate}</strong>
              </>
            )}
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
          <button type="submit" className="catalogue-primary-button checkout-complete-button" disabled={!canCompleteCheckout}>
            {exchangeLoading
              ? 'Loading exchange rate…'
              : `Simulate checkout · ${canCompleteCheckout ? formatCheckoutAmount(subtotal) : 'Rate unavailable'}`}
          </button>
          <p className="checkout-privacy-note">Do not enter payment credentials. This demo does not connect to Razorpay or another payment provider.</p>
        </form>

        <aside className="checkout-order-panel">
          <p className="eyebrow">YOUR ORDER</p>
          <h2>Order summary <span>{itemCount}</span></h2>
          <label className="checkout-currency-field" htmlFor="checkout-currency">
            Display currency
            <select id="checkout-currency" value={currency} onChange={(event) => setCurrency(event.currentTarget.value === 'INR' ? 'INR' : 'USD')}>
              <option value="USD">USD · US Dollar</option>
              <option value="INR">INR · Indian Rupee</option>
            </select>
          </label>
          {exchangeLoading && <p className="checkout-exchange-status" role="status">Loading the latest available USD to INR exchange rate…</p>}
          {exchangeError && (
            <div className="checkout-exchange-error" role="alert">
              <span>{exchangeError} Select USD or try again.</span>
              <button type="button" onClick={() => setExchangeRequest((request) => request + 1)}>Try again</button>
            </div>
          )}
          <div className="checkout-order-items">
            {items.map(({ part, quantity }) => (
              <div className="checkout-order-line" key={part.id}>
                <img src={part.image} alt="" />
                <div><strong>{part.name}</strong><small>{quantity} × {formatCheckoutAmount(part.price)}</small></div>
                <b>{formatCheckoutAmount(part.price * quantity)}</b>
              </div>
            ))}
          </div>
          <div className="cart-summary-total"><span>Subtotal</span><strong>{formatCheckoutAmount(subtotal)}</strong></div>
          <p className="cart-currency-note">
            {currency === 'INR' && exchangeRate
              ? `Converted using 1 USD = ${formatCurrency(exchangeRate.rate, 'INR')} (rate date: ${exchangeRate.date}). `
              : ''}
            Taxes and shipping are not calculated in this demo.
          </p>
          <Link className="checkout-edit-cart" to="/cart">Edit cart</Link>
        </aside>
      </div>
    </section>
  )
}

export default CheckoutPage
