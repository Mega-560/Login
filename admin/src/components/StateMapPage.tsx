import { useEffect, useRef, useState } from 'react'
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

interface IndiaRegion {
  name: string
  code: string
  capital: string
  zone: string
  lat: number
  lng: number
  dealers: number
  orders: number
}

const regions: IndiaRegion[] = [
  { name: 'Andhra Pradesh', code: 'AP', capital: 'Amaravati', zone: 'South', lat: 16.5062, lng: 80.648, dealers: 38, orders: 124 },
  { name: 'Arunachal Pradesh', code: 'AR', capital: 'Itanagar', zone: 'Northeast', lat: 27.0844, lng: 93.6053, dealers: 12, orders: 31 },
  { name: 'Assam', code: 'AS', capital: 'Dispur', zone: 'Northeast', lat: 26.1433, lng: 91.7898, dealers: 29, orders: 96 },
  { name: 'Bihar', code: 'BR', capital: 'Patna', zone: 'East', lat: 25.5941, lng: 85.1376, dealers: 33, orders: 108 },
  { name: 'Chhattisgarh', code: 'CG', capital: 'Raipur', zone: 'Central', lat: 21.2514, lng: 81.6296, dealers: 22, orders: 74 },
  { name: 'Goa', code: 'GA', capital: 'Panaji', zone: 'West', lat: 15.4909, lng: 73.8278, dealers: 9, orders: 27 },
  { name: 'Gujarat', code: 'GJ', capital: 'Gandhinagar', zone: 'West', lat: 23.2156, lng: 72.6369, dealers: 41, orders: 139 },
  { name: 'Haryana', code: 'HR', capital: 'Chandigarh', zone: 'North', lat: 30.7333, lng: 76.7794, dealers: 24, orders: 83 },
  { name: 'Himachal Pradesh', code: 'HP', capital: 'Shimla', zone: 'North', lat: 31.1048, lng: 77.1734, dealers: 16, orders: 52 },
  { name: 'Jharkhand', code: 'JH', capital: 'Ranchi', zone: 'East', lat: 23.3441, lng: 85.3096, dealers: 18, orders: 61 },
  { name: 'Karnataka', code: 'KA', capital: 'Bengaluru', zone: 'South', lat: 12.9716, lng: 77.5946, dealers: 47, orders: 158 },
  { name: 'Kerala', code: 'KL', capital: 'Thiruvananthapuram', zone: 'South', lat: 8.5241, lng: 76.9366, dealers: 31, orders: 103 },
  { name: 'Madhya Pradesh', code: 'MP', capital: 'Bhopal', zone: 'Central', lat: 23.2599, lng: 77.4126, dealers: 37, orders: 121 },
  { name: 'Maharashtra', code: 'MH', capital: 'Mumbai', zone: 'West', lat: 19.076, lng: 72.8777, dealers: 58, orders: 196 },
  { name: 'Manipur', code: 'MN', capital: 'Imphal', zone: 'Northeast', lat: 24.817, lng: 93.9368, dealers: 11, orders: 36 },
  { name: 'Meghalaya', code: 'ML', capital: 'Shillong', zone: 'Northeast', lat: 25.5788, lng: 91.8933, dealers: 10, orders: 32 },
  { name: 'Mizoram', code: 'MZ', capital: 'Aizawl', zone: 'Northeast', lat: 23.7271, lng: 92.7176, dealers: 8, orders: 25 },
  { name: 'Nagaland', code: 'NL', capital: 'Kohima', zone: 'Northeast', lat: 25.6751, lng: 94.1086, dealers: 9, orders: 29 },
  { name: 'Odisha', code: 'OD', capital: 'Bhubaneswar', zone: 'East', lat: 20.2961, lng: 85.8245, dealers: 28, orders: 92 },
  { name: 'Punjab', code: 'PB', capital: 'Chandigarh', zone: 'North', lat: 30.7333, lng: 76.7794, dealers: 26, orders: 88 },
  { name: 'Rajasthan', code: 'RJ', capital: 'Jaipur', zone: 'North', lat: 26.9124, lng: 75.7873, dealers: 35, orders: 117 },
  { name: 'Sikkim', code: 'SK', capital: 'Gangtok', zone: 'Northeast', lat: 27.3389, lng: 88.6065, dealers: 6, orders: 18 },
  { name: 'Tamil Nadu', code: 'TN', capital: 'Chennai', zone: 'South', lat: 13.0827, lng: 80.2707, dealers: 52, orders: 174 },
  { name: 'Telangana', code: 'TS', capital: 'Hyderabad', zone: 'South', lat: 17.385, lng: 78.4867, dealers: 34, orders: 112 },
  { name: 'Tripura', code: 'TR', capital: 'Agartala', zone: 'Northeast', lat: 23.8315, lng: 91.2868, dealers: 7, orders: 22 },
  { name: 'Uttar Pradesh', code: 'UP', capital: 'Lucknow', zone: 'North', lat: 26.8467, lng: 80.9462, dealers: 63, orders: 216 },
  { name: 'Uttarakhand', code: 'UK', capital: 'Dehradun', zone: 'North', lat: 30.3165, lng: 78.0322, dealers: 15, orders: 49 },
  { name: 'West Bengal', code: 'WB', capital: 'Kolkata', zone: 'East', lat: 22.5726, lng: 88.3639, dealers: 45, orders: 151 },
  { name: 'Andaman and Nicobar Islands', code: 'AN', capital: 'Port Blair', zone: 'Islands', lat: 11.6234, lng: 92.7265, dealers: 4, orders: 11 },
  { name: 'Chandigarh', code: 'CH', capital: 'Chandigarh', zone: 'North', lat: 30.7333, lng: 76.7794, dealers: 5, orders: 16 },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DN', capital: 'Daman', zone: 'West', lat: 20.3974, lng: 72.8328, dealers: 6, orders: 19 },
  { name: 'Delhi', code: 'DL', capital: 'New Delhi', zone: 'North', lat: 28.6139, lng: 77.209, dealers: 32, orders: 109 },
  { name: 'Jammu and Kashmir', code: 'JK', capital: 'Srinagar (summer), Jammu (winter)', zone: 'North', lat: 34.0837, lng: 74.7973, dealers: 19, orders: 64 },
  { name: 'Ladakh', code: 'LA', capital: 'Leh', zone: 'North', lat: 34.1526, lng: 77.5771, dealers: 5, orders: 14 },
  { name: 'Lakshadweep', code: 'LD', capital: 'Kavaratti', zone: 'Islands', lat: 10.5667, lng: 72.6417, dealers: 3, orders: 8 },
  { name: 'Puducherry', code: 'PY', capital: 'Puducherry', zone: 'South', lat: 11.9416, lng: 79.8083, dealers: 6, orders: 20 },
]

let googleMapsLoaded: Promise<void> | null = null

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (!googleMapsLoaded) {
    setOptions({ key: apiKey, v: 'weekly' })
    googleMapsLoaded = importLibrary('maps').then(() => undefined).catch((error: unknown) => {
      googleMapsLoaded = null
      throw error
    })
  }
  return googleMapsLoaded
}

function StateMapPage() {
  const [selectedRegion, setSelectedRegion] = useState(regions[0])
  const [mapError, setMapError] = useState('')
  const mapElement = useRef<HTMLDivElement>(null)
  const map = useRef<google.maps.Map | null>(null)
  const markers = useRef(new Map<string, google.maps.Marker>())
  const markerListeners = useRef<google.maps.MapsEventListener[]>([])
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ?? ''
  const estimatedRevenue = selectedRegion.orders * 18500

  useEffect(() => {
    if (!apiKey || !mapElement.current) return
    let isMounted = true

    void loadGoogleMaps(apiKey)
      .then(() => {
        if (!isMounted || !mapElement.current) return

        const mapInstance = new google.maps.Map(mapElement.current, {
          center: { lat: 22.5, lng: 82.5 },
          zoom: 4.6,
          minZoom: 3,
          restriction: {
            latLngBounds: { north: 38, south: 5, west: 66, east: 100 },
            strictBounds: false,
          },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        })

        map.current = mapInstance
        regions.forEach((region) => {
          const marker = new google.maps.Marker({
            map: mapInstance,
            position: { lat: region.lat, lng: region.lng },
            title: `${region.name} — ${region.capital}`,
            label: { text: region.code, color: '#ffffff', fontSize: '9px', fontWeight: '700' },
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: region.code === selectedRegion.code ? 10 : 8,
              fillColor: region.code === selectedRegion.code ? '#d19056' : '#568369',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          })
          markerListeners.current.push(marker.addListener('click', () => setSelectedRegion(region)))
          markers.current.set(region.code, marker)
        })
      })
      .catch(() => {
        if (isMounted) setMapError('Google Maps could not be loaded. Check the API key, enabled Maps JavaScript API, billing, and allowed referrers.')
      })

    return () => {
      isMounted = false
      markerListeners.current.forEach((listener) => listener.remove())
      markerListeners.current = []
      markers.current.forEach((marker) => marker.setMap(null))
      markers.current.clear()
      map.current = null
    }
  }, [apiKey])

  useEffect(() => {
    const mapInstance = map.current
    if (!mapInstance) return

    const location = { lat: selectedRegion.lat, lng: selectedRegion.lng }
    mapInstance.panTo(location)
    if ((mapInstance.getZoom() ?? 0) < 6) mapInstance.setZoom(6)

    markers.current.forEach((marker, code) => {
      const selected = code === selectedRegion.code
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: selected ? 10 : 8,
        fillColor: selected ? '#d19056' : '#568369',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      })
      marker.setZIndex(selected ? 2 : 1)
    })
  }, [selectedRegion])

  return (
    <section className="india-page">
      <header className="india-heading">
        <div>
          <p className="eyebrow">OPERATIONS / REGIONAL COVERAGE</p>
          <h1>India state map</h1>
          <p>Choose a state or union territory to explore its dealer coverage.</p>
        </div>
        <label className="india-state-select">
          <span>Jump to a region</span>
          <select
            value={selectedRegion.code}
            onChange={(event) => {
              const nextRegion = regions.find((region) => region.code === event.target.value)
              if (nextRegion) setSelectedRegion(nextRegion)
            }}
          >
            {regions.map((region) => (
              <option key={region.code} value={region.code}>{region.name}</option>
            ))}
          </select>
        </label>
      </header>

      <div className="india-demo-note" role="note">
        <strong>Illustrative data</strong>
        <span>Dealer and order figures are sample values for this preview. Connect your dealer and order API to show live regional details.</span>
      </div>

      <div className="india-content-grid">
        <section className="india-map-panel" aria-label="Interactive Google map of India">
          <div className="india-map-panel-heading">
            <div><h2>Explore by region</h2><p>Select a marker to see state details</p></div>
            <span className="india-region-count">{regions.length} regions</span>
          </div>
          <div className="india-map-frame">
            {apiKey
              ? <div ref={mapElement} className="india-google-map" role="application" aria-label="Google map with selectable state and union territory markers" />
              : (
                <div className="india-map-message">
                  <strong>Google Maps API key required</strong>
                  <span>Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to <code>admin/.env.local</code>, then restart the admin app.</span>
                </div>
              )}
            {mapError && <p className="india-map-error" role="alert">{mapError}</p>}
          </div>
          <p className="india-map-hint">Click a marker, or use the region menu below to explore each location.</p>
        </section>

        <aside className="india-detail-panel" aria-live="polite">
          <div className="india-detail-topline"><span>{selectedRegion.zone} zone</span><span className="india-detail-dot" /></div>
          <p className="india-detail-eyebrow">REGIONAL OVERVIEW</p>
          <h2>{selectedRegion.name}</h2>
          <p className="india-capital">Capital: <strong>{selectedRegion.capital}</strong></p>
          <div className="india-detail-stats">
            <article><span>DEALERS</span><strong>{selectedRegion.dealers}</strong><small>Sample active locations</small></article>
            <article><span>ORDERS THIS MONTH</span><strong>{selectedRegion.orders}</strong><small>Illustrative order count</small></article>
            <article className="india-revenue-stat"><span>EST. MONTHLY SALES</span><strong>₹{estimatedRevenue.toLocaleString('en-IN')}</strong><small>Sample estimate · INR</small></article>
          </div>
          <div className="india-detail-footer">
            <span className="india-detail-icon" aria-hidden="true">⌖</span>
            <div><strong>Regional hub</strong><span>{selectedRegion.capital}</span></div>
          </div>
        </aside>
      </div>

      <section className="india-region-list" aria-labelledby="india-region-list-title">
        <div className="india-region-list-heading">
          <div><h2 id="india-region-list-title">All states and union territories</h2><p>Select a region to update the map and overview.</p></div>
          <span>{regions.length} total</span>
        </div>
        <div className="india-region-buttons">
          {regions.map((region) => (
            <button
              key={region.code}
              type="button"
              className={selectedRegion.code === region.code ? 'active' : ''}
              aria-pressed={selectedRegion.code === region.code}
              onClick={() => setSelectedRegion(region)}
            >
              <span>{region.code}</span>{region.name}
            </button>
          ))}
        </div>
      </section>
    </section>
  )
}

export default StateMapPage
