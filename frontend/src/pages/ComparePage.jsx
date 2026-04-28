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
  const [sortBy, setSortBy] = useState('price_low')

  const [searchParams] = useSearchParams()

useEffect(() => {
  const minSpeedParam = searchParams.get('minSpeed')
  const maxPriceParam = searchParams.get('maxPrice')
  const sortByParam = searchParams.get('sortBy')

  if (minSpeedParam || maxPriceParam || sortByParam) {
    const resolvedMinSpeed = minSpeedParam || ''
    const resolvedMaxPrice = maxPriceParam || ''
    const resolvedSortBy = sortByParam || 'price_low'

    setMinSpeed(resolvedMinSpeed)
    setMaxPrice(resolvedMaxPrice)
    setSortBy(resolvedSortBy)
    setSearched(true)
    setLoading(true)

    const params = { sortBy: resolvedSortBy }
    if (resolvedMinSpeed) params.minSpeed = resolvedMinSpeed
    if (resolvedMaxPrice) params.maxPrice = resolvedMaxPrice

    axios.get(`${API}/api/plans`, { params })
      .then(res => setResults(res.data.plans || []))
      .catch(() => setError('Failed to fetch plans.'))
      .finally(() => setLoading(false))
  }
}, [])

  const handleSearch = async () => {
    setError('')
    setLoading(true)
    setSearched(true)
    try {
      const params = { sortBy }
      if (minSpeed) params.minSpeed = minSpeed
      if (maxPrice) params.maxPrice = maxPrice
      const res = await axios.get(`${API}/api/plans`, { params })
      setResults(res.data.plans || [])
    } catch {
      setError('Failed to fetch plans. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
        Compare Broadband Plans
      </h1>
      <p style={{ color: '#5C5C5C', marginBottom: '36px', fontSize: '15px' }}>
        Browse and compare broadband plans from all major Irish providers.
        Use the filters to narrow down by speed or price.
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
          No plans found with the selected filters.
        </div>
      )}

      {results.length > 0 && (
        <div>
          <p style={{ color: '#7A6F65', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
            {results.length} plan{results.length !== 1 ? 's' : ''} found
          </p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {results.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlanCard({ plan }) {
  return (
    <div className="plan-card" style={{
      border: '1px solid #E8E0D5',
      borderRadius: '12px',
      padding: '24px',
      display: 'grid',
      gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr',
      gap: '16px',
      alignItems: 'center',
      backgroundColor: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
    }}>
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

