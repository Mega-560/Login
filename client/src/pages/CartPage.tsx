import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { catalogueCurrency } from '../data/catalogueParts'
import { useLanguage } from '../LanguageContext'

function CartPage() {
  const { t } = useLanguage()
  const { items, itemCount, subtotal, storageError, catalogueLoading, catalogueError, refreshCatalogue, setQuantity, removeItem, clearCart } = useCart()

  return (
    <section className="catalogue-page shopping-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">{t('YOUR SELECTION')}</p>
          <h1>{t('Shopping cart')}</h1>
          <p>{t('Review your parts before placing an order.')}</p>
        </div>
        <Link className="catalogue-card-view-link" to="/catalogue/cards">{t('Continue browsing')} <span aria-hidden="true">→</span></Link>
      </div>

      {storageError && <p className="catalogue-cart-notice" role="alert">{storageError}</p>}
      {catalogueLoading && <p className="catalogue-feedback" role="status">{t('Checking current inventory…')}</p>}
      {catalogueError && (
        <p className="catalogue-feedback error" role="alert">
          {catalogueError}{' '}
          <button type="button" className="catalogue-secondary-button" onClick={() => void refreshCatalogue()}>{t('Retry')}</button>
        </p>
      )}

      {items.length === 0 ? (
        <div className="catalogue-empty-state cart-empty-state">
          <span className="cart-empty-icon" aria-hidden="true">□</span>
          <h2>{t('Your cart is empty')}</h2>
          <p>{t('Browse the parts catalogue and add items to get started.')}</p>
          <Link className="catalogue-primary-button" to="/catalogue/cards">{t('Browse parts')}</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-panel" aria-label={t('Items in your cart')}>
            <div className="cart-items-heading">
              <h2>{t('Items')} <span>{itemCount}</span></h2>
              <button type="button" className="cart-clear-button" onClick={clearCart}>{t('Clear cart')}</button>
            </div>
            {items.map(({ part, quantity }) => (
              <article className="cart-line-item" key={part.id}>
                <img src={part.image} alt={part.imageAlt} />
                <div className="cart-line-details">
                  <span className="catalogue-category-tag">{part.category}</span>
                  <h3>{part.name}</h3>
                  <p>{part.id} · {part.vehicle}</p>
                  <span className="cart-line-price">{catalogueCurrency.format(part.price)} {t('each')}</span>
                </div>
                <label className="cart-quantity">
                  <span>{t('Qty')}</span>
                  <input
                    type="number"
                    min={1}
                    max={part.stock}
                    value={quantity}
                    aria-label={`${t('Quantity for')} ${part.name}`}
                    onChange={(event) => setQuantity(part.id, Math.max(1, Math.min(part.stock, Number(event.target.value) || 1)))}
                  />
                </label>
                <div className="cart-line-total">
                  <strong>{catalogueCurrency.format(part.price * quantity)}</strong>
                  <button type="button" onClick={() => removeItem(part.id)} aria-label={`${t('Remove')} ${part.name}`} title={`${t('Remove')} ${part.name} ${t('from cart')}`}>{t('Remove')}</button>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-summary-panel">
            <p className="eyebrow">{t('ORDER SUMMARY')}</p>
            <h2>{t('Summary')}</h2>
            <div className="cart-summary-row"><span>{t('Items')} ({itemCount})</span><strong>{catalogueCurrency.format(subtotal)}</strong></div>
            <div className="cart-summary-row"><span>{t('Shipping')}</span><span>{t('Calculated later')}</span></div>
            <div className="cart-summary-total"><span>{t('Subtotal')}</span><strong>{catalogueCurrency.format(subtotal)}</strong></div>
            <Link className="catalogue-primary-button cart-checkout-button" to="/checkout">{t('Continue to place order')}</Link>
            <div className="demo-checkout-note">
              <strong>{t('Payment is not collected online')}</strong>
              <span>{t('Your order will be saved for the parts team to review. Payment and delivery are arranged after confirmation.')}</span>
            </div>
            <p className="cart-currency-note">{t('Prices are displayed in USD.')}</p>
          </aside>
        </div>
      )}
    </section>
  )
}

export default CartPage
