import { useState, type FormEvent } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { catalogueApi, type CustomerOrder } from '../data/catalogueApi'
import { catalogueCurrency } from '../data/catalogueParts'
import type { SessionUser } from '../modules/auth/authApi'
import { useLanguage } from '../LanguageContext'

function CheckoutPage() {
  const { t } = useLanguage()
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
          <p className="eyebrow">{t('ORDER RECEIVED')}</p>
          <h1>{t('Thank you,')} {confirmation.customerName}</h1>
          <p>{t('Your order has been saved. Our team will confirm availability and delivery details. Payment is due after confirmation; no payment was collected online.')}</p>
          <div className="checkout-confirmation-summary">
            <span>{t('Order number')}</span><strong>{confirmation.id}</strong>
            <span>{t('Items')}</span><strong>{confirmation.items.reduce((count, item) => count + item.quantity, 0)}</strong>
            <span>{t('Order total')}</span><strong>{catalogueCurrency.format(confirmation.subtotal)}</strong>
            <span>{t('Order status')}</span><strong>{t(confirmation.status)}</strong>
            <span>{t('Payment status')}</span><strong>{t('Due after confirmation')}</strong>
          </div>
          <div className="checkout-confirmation-actions">
            <Link className="catalogue-primary-button" to="/catalogue/cards">{t('Continue shopping')}</Link>
            <Link className="catalogue-secondary-button" to="/orders">{t('View order history')}</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="catalogue-page shopping-page checkout-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">{t('ORDER DETAILS')}</p>
          <h1>{t('Place your order')}</h1>
          <p>{t('Submit your parts request. Inventory is checked again before the order is accepted.')}</p>
        </div>
        <Link className="catalogue-card-view-link" to="/cart">← {t('Back to cart')}</Link>
      </div>

      <div className="checkout-demo-banner" role="note">
        <strong>{t('Payment is not collected online.')}</strong>
        <span>{t('Your order is stored as pending and an administrator will confirm it and arrange payment and delivery.')}</span>
      </div>
      {error && <p className="catalogue-feedback error" role="alert">{error}</p>}

      <div className="checkout-layout">
        <form className="checkout-details-panel" onSubmit={(event) => void placeOrder(event)}>
          <div className="checkout-section-heading">
            <span>01</span>
            <div><h2>{t('Contact details')}</h2><p>{t('We will use these details to confirm your order.')}</p></div>
          </div>
          <label className="checkout-field">{t('Full name')}
            <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
          </label>
          <label className="checkout-field">{t('Email address')}
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
          </label>

          <div className="checkout-section-heading checkout-payment-heading">
            <span>02</span>
            <div><h2>{t('Delivery address')}</h2><p>{t('Enter the address for this parts order.')}</p></div>
          </div>
          <label className="checkout-field">{t('Full delivery address')}
            <textarea autoComplete="street-address" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} required maxLength={500} rows={4} />
          </label>
          <button type="submit" className="catalogue-primary-button checkout-complete-button" disabled={isSubmitting || !items.length}>
            {isSubmitting ? t('Saving order…') : `${t('Place order')} · ${catalogueCurrency.format(subtotal)}`}
          </button>
          <p className="checkout-privacy-note">{t('Your order and delivery details are stored securely with your account. Do not enter payment details here.')}</p>
        </form>

        <aside className="checkout-order-panel">
          <p className="eyebrow">{t('YOUR ORDER')}</p>
          <h2>{t('Order summary')} <span>{itemCount}</span></h2>
          <div className="checkout-order-items">
            {items.map(({ part, quantity }) => (
              <div className="checkout-order-line" key={part.id}>
                <img src={part.image} alt="" />
                <div><strong>{part.name}</strong><small>{quantity} × {catalogueCurrency.format(part.price)}</small></div>
                <b>{catalogueCurrency.format(part.price * quantity)}</b>
              </div>
            ))}
          </div>
          <div className="cart-summary-total"><span>{t('Subtotal')}</span><strong>{catalogueCurrency.format(subtotal)}</strong></div>
          <p className="cart-currency-note">{t('Shipping and payment are arranged after the order is confirmed. Prices are in USD.')}</p>
          <Link className="checkout-edit-cart" to="/cart">{t('Edit cart')}</Link>
        </aside>
      </div>
    </section>
  )
}

export default CheckoutPage
