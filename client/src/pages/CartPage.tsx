import { Link } from 'react-router-dom'
import { useCart } from '../cart/CartContext'
import { catalogueCurrency } from '../data/catalogueParts'

function CartPage() {
  const { items, itemCount, subtotal, storageError, setQuantity, removeItem, clearCart } = useCart()

  return (
    <section className="catalogue-page shopping-page">
      <div className="catalogue-page-heading">
        <div>
          <p className="eyebrow">YOUR SELECTION</p>
          <h1>Shopping cart</h1>
          <p>Review your parts before continuing to the demo checkout.</p>
        </div>
        <Link className="catalogue-card-view-link" to="/catalogue/cards">Continue browsing <span aria-hidden="true">→</span></Link>
      </div>

      {storageError && <p className="catalogue-cart-notice" role="alert">{storageError}</p>}

      {items.length === 0 ? (
        <div className="catalogue-empty-state cart-empty-state">
          <span className="cart-empty-icon" aria-hidden="true">□</span>
          <h2>Your cart is empty</h2>
          <p>Browse the parts catalogue and add items to get started.</p>
          <Link className="catalogue-primary-button" to="/catalogue/cards">Browse parts</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-panel" aria-label="Items in your cart">
            <div className="cart-items-heading">
              <h2>Items <span>{itemCount}</span></h2>
              <button type="button" className="cart-clear-button" onClick={clearCart}>Clear cart</button>
            </div>
            {items.map(({ part, quantity }) => (
              <article className="cart-line-item" key={part.id}>
                <img src={part.image} alt={part.imageAlt} />
                <div className="cart-line-details">
                  <span className="catalogue-category-tag">{part.category}</span>
                  <h3>{part.name}</h3>
                  <p>{part.id} · {part.vehicle}</p>
                  <span className="cart-line-price">{catalogueCurrency.format(part.price)} each</span>
                </div>
                <label className="cart-quantity">
                  <span>Qty</span>
                  <input
                    type="number"
                    min={1}
                    max={part.stock}
                    value={quantity}
                    aria-label={`Quantity for ${part.name}`}
                    onChange={(event) => setQuantity(part.id, Math.max(1, Math.min(part.stock, Number(event.target.value) || 1)))}
                  />
                </label>
                <div className="cart-line-total">
                  <strong>{catalogueCurrency.format(part.price * quantity)}</strong>
                  <button type="button" onClick={() => removeItem(part.id)} aria-label={`Remove ${part.name}`} title={`Remove ${part.name} from cart`}>Remove</button>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-summary-panel">
            <p className="eyebrow">ORDER SUMMARY</p>
            <h2>Summary</h2>
            <div className="cart-summary-row"><span>Items ({itemCount})</span><strong>{catalogueCurrency.format(subtotal)}</strong></div>
            <div className="cart-summary-row"><span>Shipping</span><span>Calculated later</span></div>
            <div className="cart-summary-total"><span>Subtotal</span><strong>{catalogueCurrency.format(subtotal)}</strong></div>
            <Link className="catalogue-primary-button cart-checkout-button" to="/checkout">Continue to demo checkout</Link>
            <div className="demo-checkout-note">
              <strong>Demo checkout only</strong>
              <span>No payment is collected. Your order will not be sent or saved.</span>
            </div>
            <p className="cart-currency-note">Prices are displayed in USD.</p>
          </aside>
        </div>
      )}
    </section>
  )
}

export default CartPage
