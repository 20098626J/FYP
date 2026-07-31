import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const API = import.meta.env.VITE_API_URL

// Colour a gigabit-coverage percentage using the same bands as the map legend.
function coverageColour(pct) {
  if (pct >= 90) return '#1565C0'
  if (pct >= 80) return '#1a9850'
  if (pct >= 70) return '#66bd63'
  return '#E07A5F'
}

// Title-case a name stored in upper case (e.g. "NORTH CITY" -> "North City").
function titleCase(name) {
  if (!name) return ''
  return name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const coverageData = {
  'Kerry':      { coverage: 95, band: '90-100%' },
  'Tipperary':  { coverage: 95, band: '90-100%' },
  'Kilkenny':   { coverage: 95, band: '90-100%' },
  'Offaly':     { coverage: 95, band: '90-100%' },
  'Westmeath':  { coverage: 95, band: '90-100%' },
  'Laois':      { coverage: 95, band: '90-100%' },
  'Longford':   { coverage: 95, band: '90-100%' },
  'Dublin':     { coverage: 75, band: '70-80%' },
  'Mayo':       { coverage: 75, band: '70-80%' },
  'Cork':       { coverage: 85, band: '80-90%' },
  'Galway':     { coverage: 85, band: '80-90%' },
  'Limerick':   { coverage: 85, band: '80-90%' },
  'Waterford':  { coverage: 85, band: '80-90%' },
  'Wexford':    { coverage: 85, band: '80-90%' },
  'Wicklow':    { coverage: 85, band: '80-90%' },
  'Kildare':    { coverage: 85, band: '80-90%' },
  'Meath':      { coverage: 85, band: '80-90%' },
  'Louth':      { coverage: 85, band: '80-90%' },
  'Clare':      { coverage: 85, band: '80-90%' },
  'Carlow':     { coverage: 85, band: '80-90%' },
  'Sligo':      { coverage: 85, band: '80-90%' },
  'Leitrim':    { coverage: 85, band: '80-90%' },
  'Roscommon':  { coverage: 85, band: '80-90%' },
  'Cavan':      { coverage: 85, band: '80-90%' },
  'Monaghan':   { coverage: 85, band: '80-90%' },
  'Donegal':    { coverage: 85, band: '80-90%' },
}

function normaliseCountyName(name) {
  if (!name) return ''
  // Remove " County" and " City" suffixes
  let clean = name.replace(' County', '').replace(' City', '').trim()
  // Handle remaining split names
  if (clean.includes('Tipperary')) return 'Tipperary'
  if (clean.includes('Dublin') || clean === 'South Dublin' || clean === 'Fingal' || clean === 'Dún Laoghaire-Rathdown') return 'Dublin'
  if (clean.includes('Waterford')) return 'Waterford'
  if (clean.includes('Limerick')) return 'Limerick'
  if (clean.includes('Galway')) return 'Galway'
  return clean
}

export default function CoveragePage() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const popup = useRef(new mapboxgl.Popup({ closeButton: false, closeOnClick: false }))
  const marker = useRef(null)

  // Result of the most recent point lookup (click on the map) or search select.
  const [lookup, setLookup] = useState(null)      // { division, lat, lng }
  const [lookupStatus, setLookupStatus] = useState('idle') // idle | loading | notfound | error

  // Search box state (typeahead over electoral-division names).
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)

  // Query the coverage endpoint for the electoral division at a clicked point.
  async function lookupPoint(lng, lat) {
    setLookupStatus('loading')
    setLookup(null)

    // Drop / move a marker at the clicked location.
    if (!marker.current) {
      marker.current = new mapboxgl.Marker({ color: '#1565C0' })
    }
    marker.current.setLngLat([lng, lat]).addTo(map.current)

    try {
      const res = await axios.get(`${API}/api/coverage`, { params: { lat, lng } })
      setLookup(res.data)
      setLookupStatus('done')
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setLookupStatus('notfound')
      } else {
        console.error('Coverage lookup failed:', err)
        setLookupStatus('error')
      }
    }
  }

  // Fill the panel and move the map to a division chosen from the search list.
  // The search result already carries the coverage figures, so no extra request
  // is needed — we drop a pin at the division's centre and fly to its bounds.
  function selectDivision(d) {
    setLookup({ lat: d.center.lat, lng: d.center.lng, division: d })
    setLookupStatus('done')

    if (!marker.current) {
      marker.current = new mapboxgl.Marker({ color: '#1565C0' })
    }
    marker.current.setLngLat([d.center.lng, d.center.lat]).addTo(map.current)

    map.current.fitBounds(
      [[d.bbox.minx, d.bbox.miny], [d.bbox.maxx, d.bbox.maxy]],
      { padding: 80, maxZoom: 13, duration: 800 },
    )

    setQuery(titleCase(d.ed_name))
    setSuggestions([])
    setShowDropdown(false)
  }

  // Debounced typeahead: fetch matching divisions ~250ms after typing stops.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(() => {
      setSearching(true)
      axios.get(`${API}/api/coverage/search`, { params: { q } })
        .then((res) => setSuggestions(res.data.results || []))
        .catch(() => setSuggestions([]))
        .finally(() => setSearching(false))
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
  if (map.current) return

  const initMap = () => {
    if (!mapContainer.current) {
      console.log('Container not ready, retrying...')
      setTimeout(initMap, 100)
      return
    }

    console.log('Initialising map, container:', mapContainer.current)

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      accessToken: import.meta.env.VITE_MAPBOX_TOKEN,
      style: {
        version: 8,
        sources: {},
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#f8f8f8' }
          }
        ]
      },
      center: [-8.0, 53.4],
      zoom: 6,
    })

    map.current.on('error', (e) => console.error('Mapbox error:', e))

    map.current.on('load', () => {
      console.log('Map loaded!')
      fetch('/ireland-counties.geojson')
        .then(res => res.json())
        .then(geojson => {
            console.log('County names in GeoJSON:', geojson.features.map(f => f.properties.name))
          geojson.features = geojson.features.map(feature => {
            const rawName = feature.properties.name
            const countyName = normaliseCountyName(rawName)
            const data = coverageData[countyName] || { coverage: 0, band: 'No data' }
            return {
              ...feature,
              properties: {
                ...feature.properties,
                county: countyName,
                coverage: data.coverage,
                band: data.band
              }
            }
          })

          if (!map.current.getSource('counties')) {
  map.current.addSource('counties', {
    type: 'geojson',
    data: geojson
  })
}

          map.current.addLayer({
            id: 'counties-fill',
            type: 'fill',
            source: 'counties',
            paint: {
              'fill-color': [
                'step',
                ['get', 'coverage'],
                '#cccccc',
                70, '#66bd63',
                80, '#1a9850',
                90, '#1565C0',
              ],
              'fill-opacity': 0.75
            }
          })

          map.current.addLayer({
            id: 'counties-outline',
            type: 'line',
            source: 'counties',
            paint: {
              'line-color': '#ffffff',
              'line-width': 1.5
            }
          })

          map.current.on('mousemove', 'counties-fill', (e) => {
            map.current.getCanvas().style.cursor = 'pointer'
            const { county, band } = e.features[0].properties
            popup.current
              .setLngLat(e.lngLat)
              .setHTML(`
                <strong>${county}</strong><br/>
                FTTP Coverage: <strong>${band}</strong><br/>
                <small>Source: ComReg Q4 2025</small>
              `)
              .addTo(map.current)
          })

          map.current.on('mouseleave', 'counties-fill', () => {
            map.current.getCanvas().style.cursor = ''
            popup.current.remove()
          })

          // Click anywhere to look up the exact electoral division and its
          // real gigabit coverage figures via the /api/coverage endpoint.
          map.current.on('click', (e) => {
            popup.current.remove()
            lookupPoint(e.lngLat.lng, e.lngLat.lat)
          })
        })
    })
  }

  setTimeout(initMap, 100)

  return () => map.current?.remove()
}, [])

  return (
  <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 20px' }}>
    <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
      Broadband Coverage Map
    </h1>
    <p style={{ color: '#5C5C5C', marginBottom: '32px', fontSize: '15px' }}>
      Full fibre (FTTP) broadband coverage across Ireland by county.
      <strong> Search for your area</strong> or <strong>click any point</strong> to see the
      exact electoral division and its gigabit coverage; hover a county for the
      regional overview. Data source: ComReg.
    </p>

    <div style={{ position: 'relative', width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8E0D5' }}>
      <div
        ref={mapContainer}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />

      {/* Search box with live dropdown */}
      <div style={{ position: 'absolute', top: 16, left: 16, width: 300, zIndex: 5 }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => { if (suggestions.length) setShowDropdown(true) }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search your electoral division or county…"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '11px 14px',
            fontSize: 14,
            border: '1px solid #E8E0D5',
            borderRadius: 10,
            backgroundColor: '#fff',
            color: '#2C2C2C',
            boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
            outline: 'none',
          }}
        />

        {showDropdown && query.trim().length >= 2 && (
          <div style={{
            marginTop: 6,
            backgroundColor: '#fff',
            border: '1px solid #E8E0D5',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            maxHeight: 280,
            overflowY: 'auto',
          }}>
            {searching && suggestions.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 13, color: '#9E9E9E' }}>Searching…</div>
            )}
            {!searching && suggestions.length === 0 && (
              <div style={{ padding: '12px 14px', fontSize: 13, color: '#9E9E9E' }}>No matching areas</div>
            )}
            {suggestions.map((d) => (
              <button
                key={d.id}
                // onMouseDown fires before the input's onBlur, so the click
                // registers before the dropdown is hidden.
                onMouseDown={() => selectDivision(d)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  border: 'none',
                  borderTop: '1px solid #F0EBE3',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#FAF8F5' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff' }}
              >
                <span style={{ color: '#2C2C2C', fontWeight: 500 }}>{titleCase(d.ed_name)}</span>
                <span style={{ color: '#7A6F65', fontSize: 12, whiteSpace: 'nowrap' }}>
                  Co. {titleCase(d.county)} · {d.gigabit_pct ?? '—'}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Point-lookup result panel */}
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: 260,
        backgroundColor: '#ffffff',
        border: '1px solid #E8E0D5',
        borderRadius: 10,
        padding: '16px 18px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        fontSize: 14,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#7A6F65', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
          Electoral Division
        </div>

        {lookupStatus === 'idle' && (
          <p style={{ color: '#9E9E9E', margin: 0, lineHeight: 1.5 }}>
            Click anywhere on the map to look up gigabit coverage for that area.
          </p>
        )}

        {lookupStatus === 'loading' && (
          <p style={{ color: '#5C5C5C', margin: 0 }}>Looking up coverage…</p>
        )}

        {lookupStatus === 'notfound' && (
          <p style={{ color: '#5C5C5C', margin: 0, lineHeight: 1.5 }}>
            No electoral division here — try a point on land within Ireland.
          </p>
        )}

        {lookupStatus === 'error' && (
          <p style={{ color: '#E07A5F', margin: 0, lineHeight: 1.5 }}>
            Couldn’t load coverage. Please try again.
          </p>
        )}

        {lookupStatus === 'done' && lookup && (
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C', textTransform: 'capitalize' }}>
              {lookup.division.ed_name.toLowerCase()}
            </div>
            <div style={{ fontSize: 13, color: '#7A6F65', textTransform: 'capitalize', marginBottom: 14 }}>
              {lookup.division.county ? `Co. ${lookup.division.county.toLowerCase()}` : '—'}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: coverageColour(lookup.division.gigabit_pct) }}>
                {lookup.division.gigabit_pct ?? '—'}%
              </span>
              <span style={{ fontSize: 12, color: '#7A6F65' }}>gigabit passed</span>
            </div>

            <div style={{ marginTop: 14, borderTop: '1px solid #F0EBE3', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 6, fontSize: 13, color: '#5C5C5C' }}>
              <span>Actively subscribed</span>
              <strong>{lookup.division.gigabit_active_pct ?? '—'}%</strong>
              <span>Incl. planned (NBI)</span>
              <strong>{lookup.division.gigabit_nbi_pct ?? '—'}%</strong>
              <span>Premises</span>
              <strong>{lookup.division.premises?.toLocaleString() ?? '—'}</strong>
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: '#9E9E9E' }}>
              Source: ComReg gigabit statistics
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Legend */}
    <div style={{
      marginTop: '20px',
      backgroundColor: '#F0EBE3',
      border: '1px solid #E8E0D5',
      borderRadius: '10px',
      padding: '16px 24px',
      display: 'flex',
      gap: '24px',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: '12px', fontWeight: '600', color: '#7A6F65', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        FTTP Coverage
      </span>
      {[
        { color: '#1565C0', label: '90–100%' },
        { color: '#1a9850', label: '80–90%' },
        { color: '#66bd63', label: '70–80%' },
        { color: '#cccccc', label: 'No data' },
      ].map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 14, height: 14, backgroundColor: color, borderRadius: 3 }} />
          <span style={{ fontSize: '13px', color: '#5C5C5C' }}>{label}</span>
        </div>
      ))}
    </div>

    <p style={{ marginTop: '12px', fontSize: '12px', color: '#9E9E9E' }}>
      © ComReg. Data reused under PSI Regulations 2015. Map © Mapbox.
    </p>
  </div>
)
}