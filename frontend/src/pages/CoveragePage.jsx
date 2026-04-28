import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

console.log('Mapbox token:', import.meta.env.VITE_MAPBOX_TOKEN)

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
      Hover over a county to see details. Data source: ComReg Q4 2025.
    </p>

    <div style={{ position: 'relative', width: '100%', height: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E8E0D5' }}>
      <div
        ref={mapContainer}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />
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