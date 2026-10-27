const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL?.trim()
  || `${window.location.protocol}//${window.location.hostname}:5174/admin`

export default adminAppUrl
