import { useState, useEffect } from 'react'
import axios from 'axios'
import { useSearchParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL

export default function ComparePage() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const [minSpeed, setMinSpeed] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [provider, setProvider] = useState('')
  const [technology, setTechnology] = useState('')
  const [maxContract, setMaxContract] = useState('')
  const [sortBy, setSortBy] = useState('price_low')

  // Options for the provider / technology dropdowns, loaded from the API.
  const [providerOptions, setProviderOptions] = useState([])
  const [technologyOptions, setTechnologyOptions] = useState([])

  const [searchParams] = useSearchParams()

  // Load the filter dropdown options once on mount.
  useEffect(() => {
    axios.get(`${API}/api/providers`)
      .then(res => setProviderOptions(res.data.map(p => p.name)))
      .catch(() => {})
    axios.get(`${API}/api/technologies`)
      .then(res => setTechnologyOptions(res.data.map(t => t.name)))
      .catch(() => {})
  }, [])

  // Run a search, applying the API-backed filters and then any client-side
  // ones (contract length isn't a server filter, so we apply it here).
  const runSearch = (opts) => {
    setError('')
    setLoading(true)
    setSearched(true)

    const params = { sortBy: opts.sortBy }
    if (opts.minSpeed) params.minSpeed = opts.minSpeed
    if (opts.maxPrice) params.maxPrice = opts.maxPrice
    if (opts.provider) params.provider = opts.provider
    if (opts.technology) params.technology = opts.technology

    return axios.get(`${API}/api/plans`, { params })
      .then(res => {
        let plans = res.data.plans || []
        if (opts.maxContract) {
          const cap = parseInt(opts.maxContract, 10)
          plans = plans.filter(p => Number(p.contract_length) <= cap)
        }
        setResults(plans)
      })
      .catch(() => setError('Failed to fetch plans. Make sure the backend is running.'))
      .finally(() => setLoading(false))
  }

  // On first load, honour any filters handed over from the recommender.
  useEffect(() => {
    const minSpeedParam = searchParams.get('minSpeed')
    const maxPriceParam = searchParams.get('maxPrice')
    const providerParam = searchParams.get('provider')
    const technologyParam = searchParams.get('technology')
    const sortByParam = searchParams.get('sortBy')

    if (minSpeedParam || maxPriceParam || providerParam || technologyParam || sortByParam) {
      const resolved = {
        minSpeed: minSpeedParam || '',
        maxPrice: maxPriceParam || '',
        provider: providerParam || '',
        technology: technologyParam || '',
        maxContract: '',
        sortBy: sortByParam || 'price_low',
      }
      setMinSpeed(resolved.minSpeed)
      setMaxPrice(resolved.maxPrice)
      setProvider(resolved.provider)
      setTechnology(resolved.technology)
      setSortBy(resolved.sortBy)
      runSearch(resolved)
    }
  }, [])

  const handleSearch = () => {
    runSearch({ minSpeed, maxPrice, provider, technology, maxContract, sortBy })
  }

  const handleReset = () => {
    setMinSpeed('')
    setMaxPrice('')
    setProvider('')
    setTechnology('')
    setMaxContract('')
    setSortBy('price_low')
    setResults([])
    setSearched(false)
    setError('')
  }

  const anyFilterActive =
    minSpeed || maxPrice || provider || technology || maxContract || sortBy !== 'price_low'

  // Identify the cheapest and fastest plans so they can be badged. Ties resolve
  // to the first encountered; nulls are treated as worst so they never "win".
  let cheapestId = null
  let fastestId = null
  if (results.length > 1) {
    let minPrice = Infinity
    let maxSpeedVal = -Infinity
    for (const p of results) {
      const price = Number(p.monthly_price)
      const speed = Number(p.download_speed)
      if (price < minPrice) { minPrice = price; cheapestId = p.id }
      if (speed > maxSpeedVal) { maxSpeedVal = speed; fastestId = p.id }
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
        Compare Broadband Plans
      </h1>
      <p style={{ color: '#5C5C5C', marginBottom: '36px', fontSize: '15px' }}>
        Browse and compare broadband plans from all major Irish providers.
        Use the filters to narrow down by speed, price, provider or technology.
      </p>

      {/* Filters */}
      <div style={{
        backgroundColor: '#F0EBE3',
        border: '1px solid #E8E0D5',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        marginBottom: '36px'
      }}>
        <div style={filterGroup}>
          <label style={labelStyle}>Min Speed</label>
          <select value={minSpeed} onChange={e => setMinSpeed(e.target.value)} style={selectStyle}>
            <option value="">Any speed</option>
            <option value="100">100 Mbps+</option>
            <option value="500">500 Mbps+</option>
            <option value="1000">1 Gbps+</option>
          </select>
        </div>

        <div style={filterGroup}>
          <label style={labelStyle}>Max Price</label>
          <select value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={selectStyle}>
            <option value="">Any price</option>
            <option value="40">Under €40</option>
            <option value="50">Under €50</option>
            <option value="60">Under €60</option>
          </select>
        </div>

        <div style={filterGroup}>
          <label style={labelStyle}>Provider</label>
          <select value={provider} onChange={e => setProvider(e.target.value)} style={selectStyle}>
            <option value="">Any provider</option>
            {providerOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div style={filterGroup}>
          <label style={labelStyle}>Technology</label>
          <select value={technology} onChange={e => setTechnology(e.target.value)} style={selectStyle}>
            <option value="">Any technology</option>
            {technologyOptions.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div style={filterGroup}>
          <label style={labelStyle}>Max Contract</label>
          <select value={maxContract} onChange={e => setMaxContract(e.target.value)} style={selectStyle}>
            <option value="">Any length</option>
            <option value="0">No contract</option>
            <option value="12">12 months or less</option>
            <option value="18">18 months or less</option>
            <option value="24">24 months or less</option>
          </select>
        </div>

        <div style={filterGroup}>
          <label style={labelStyle}>Sort By</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
            <option value="price_low">Price (Low to High)</option>
            <option value="price_high">Price (High to Low)</option>
            <option value="speed_high">Speed (High to Low)</option>
          </select>
        </div>

        <button onClick={handleSearch} disabled={loading} style={{
          padding: '10px 28px',
          backgroundColor: '#C4622D',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          alignSelf: 'flex-end'
        }}>
          {loading ? 'Loading...' : 'Compare Plans'}
        </button>

        {anyFilterActive && (
          <button onClick={handleReset} disabled={loading} style={{
            padding: '10px 18px',
            backgroundColor: 'transparent',
            color: '#7A6F65',
            border: '1px solid #D8CEC0',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-end'
          }}>
            Reset
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: '#C4622D', marginBottom: '16px', fontSize: '14px' }}>{error}</p>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: '#5C5C5C',
          backgroundColor: '#fff',
          border: '1px solid #E8E0D5',
          borderRadius: '12px'
        }}>
          No plans match these filters. Try widening your price, speed or contract limits.
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p style={{ color: '#7A6F65', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
            {results.length} plan{results.length !== 1 ? 's' : ''} found
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {results.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                badge={
                  plan.id === cheapestId ? 'cheapest'
                    : plan.id === fastestId ? 'fastest'
                    : null
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlanCard({ plan, badge }) {
  return (
    <div className="plan-card" style={{
      position: 'relative',
      border: badge === 'cheapest' ? '1.5px solid #C4622D' : '1px solid #E8E0D5',
      borderRadius: '12px',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr',
      gap: '16px',
      alignItems: 'center',
      backgroundColor: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
      {badge && (
        <span style={{
          position: 'absolute',
          top: -10,
          left: 20,
          backgroundColor: badge === 'cheapest' ? '#C4622D' : '#1565C0',
          color: '#fff',
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '3px 10px',
          borderRadius: '10px'
        }}>
          {badge === 'cheapest' ? '★ Best value' : 'Fastest'}
        </span>
      )}

      {/* Provider */}
      <div>
        <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
          {plan.provider_name}
        </div>
        <div style={{ color: '#5C5C5C', fontSize: '13px', marginBottom: '4px' }}>
          {plan.plan_name}
        </div>
        <span style={{
          display: 'inline-block',
          backgroundColor: '#F0EBE3',
          color: '#7A6F65',
          fontSize: '11px',
          fontWeight: '600',
          padding: '2px 8px',
          borderRadius: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {plan.technology_name}
        </span>
        {plan.price_notes && (
          <div style={{ color: '#C4622D', fontSize: '11px', marginTop: '6px' }}>
            ⚠ {plan.price_notes}
          </div>
        )}
      </div>

      {/* Speed */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#7A6F65', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          Download
        </div>
        <div style={{ fontWeight: '700', fontSize: '20px', color: '#2C2C2C' }}>
          {plan.download_speed} <span style={{ fontSize: '13px', fontWeight: '500', color: '#7A6F65' }}>Mbps</span>
        </div>
        <div style={{ fontSize: '12px', color: '#9E9E9E', marginTop: '2px' }}>
          ↑ {plan.upload_speed} Mbps
        </div>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#7A6F65', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
          Monthly
        </div>
        <div style={{ fontWeight: '700', fontSize: '26px', color: '#C4622D' }}>
          €{plan.monthly_price}
        </div>
        <div style={{ fontSize: '12px', color: '#9E9E9E', marginTop: '2px' }}>
          {plan.contract_length > 0 ? `${plan.contract_length} month contract` : 'No contract'}
        </div>
        {parseFloat(plan.setup_fee) > 0
          ? <div style={{ fontSize: '11px', color: '#C4622D', marginTop: '2px' }}>+€{plan.setup_fee} setup</div>
          : <div style={{ fontSize: '11px', color: '#4CAF50', marginTop: '2px' }}>Free setup</div>
        }
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <a
          href={plan.provider_website || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#C4622D',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          Visit {plan.provider_name}
        </a>
      </div>
    </div>
  )
}

const filterGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const labelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#7A6F65',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
}

const selectStyle = {
  padding: '10px 12px',
  fontSize: '14px',
  border: '1px solid #E8E0D5',
  borderRadius: '8px',
  backgroundColor: '#fff',
  color: '#2C2C2C',
  minWidth: '160px',
  cursor: 'pointer'
}
