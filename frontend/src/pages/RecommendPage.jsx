import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const uses = [
  { id: 'gaming', label: '🎮 Gaming', minSpeed: 500, sortBy: 'speed_high' },
  { id: 'streaming', label: '📺 Streaming', minSpeed: 100, sortBy: 'speed_high' },
  { id: 'wfh', label: '💼 Working from Home', minSpeed: 500, sortBy: 'speed_high' },
  { id: 'browsing', label: '🌐 General Browsing', minSpeed: 0, sortBy: 'price_low' },
  { id: 'all', label: '⚡ All of the Above', minSpeed: 500, sortBy: 'speed_high' },
]

const householdSizes = [
  { id: '1', label: 'Just me', multiplier: 1 },
  { id: '2-3', label: '2–3 people', multiplier: 2 },
  { id: '4+', label: '4 or more', multiplier: 3 },
]

const recommendations = {
  gaming: {
    1: { minSpeed: 100, maxPrice: '', sortBy: 'speed_high', title: 'Fast & Responsive', description: 'For solo gaming you need low latency and consistent speeds. We recommend at least 100 Mbps on a full fibre connection.' },
    2: { minSpeed: 500, maxPrice: '', sortBy: 'speed_high', title: 'High Speed Fibre', description: 'With 2-3 people gaming and streaming simultaneously, 500 Mbps gives everyone a smooth experience.' },
    3: { minSpeed: 1000, maxPrice: '', sortBy: 'speed_high', title: 'Gigabit Ready', description: 'A busy household of gamers needs 1 Gbps to ensure everyone gets full speed without congestion.' },
  },
  streaming: {
    1: { minSpeed: 100, maxPrice: '50', sortBy: 'price_low', title: 'Great Value Streaming', description: '4K streaming needs around 25 Mbps, so 100 Mbps gives you plenty of headroom at a great price.' },
    2: { minSpeed: 100, maxPrice: '50', sortBy: 'price_low', title: 'Shared Streaming', description: 'Multiple 4K streams simultaneously need around 100 Mbps. Good value fibre plans will cover this easily.' },
    3: { minSpeed: 500, maxPrice: '', sortBy: 'price_low', title: 'Multi-Room Streaming', description: 'For a large household streaming on multiple devices, 500 Mbps ensures no buffering for anyone.' },
  },
  wfh: {
    1: { minSpeed: 100, maxPrice: '50', sortBy: 'price_low', title: 'Reliable Home Office', description: 'Video calls and large file transfers are comfortable at 100 Mbps. Prioritise upload speed for video conferencing.' },
    2: { minSpeed: 500, maxPrice: '', sortBy: 'speed_high', title: 'Productive Household', description: 'Multiple people working from home simultaneously need 500 Mbps to avoid slowdowns during peak hours.' },
    3: { minSpeed: 1000, maxPrice: '', sortBy: 'speed_high', title: 'Full Fibre Office', description: 'A large household with multiple remote workers needs gigabit speeds to keep everyone productive.' },
  },
  browsing: {
    1: { minSpeed: 0, maxPrice: '40', sortBy: 'price_low', title: 'Best Value Browsing', description: 'For everyday browsing, social media and casual streaming, even 100 Mbps is overkill. Focus on getting the best price.' },
    2: { minSpeed: 100, maxPrice: '50', sortBy: 'price_low', title: 'Everyday Family Broadband', description: 'A reliable 100 Mbps plan covers all everyday needs for a small household without overpaying.' },
    3: { minSpeed: 100, maxPrice: '', sortBy: 'price_low', title: 'Family Broadband', description: 'For a larger household doing everyday tasks, 100 Mbps shared across multiple devices is comfortable.' },
  },
  all: {
    1: { minSpeed: 500, maxPrice: '', sortBy: 'speed_high', title: 'Full Fibre Power User', description: 'If you do everything — gaming, streaming, working from home — you need at least 500 Mbps for a seamless experience.' },
    2: { minSpeed: 500, maxPrice: '', sortBy: 'speed_high', title: 'High Performance Household', description: 'A household doing everything simultaneously needs 500 Mbps as a minimum, with 1 Gbps being ideal.' },
    3: { minSpeed: 1000, maxPrice: '', sortBy: 'speed_high', title: 'Gigabit Household', description: 'For a large household doing everything at once, nothing less than gigabit speeds will do.' },
  },
}

const householdKey = { '1': 1, '2-3': 2, '4+': 3 }

export default function RecommendPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedUse, setSelectedUse] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)

  const recommendation = selectedUse && selectedSize
    ? recommendations[selectedUse][householdKey[selectedSize]]
    : null

  const handleViewPlans = () => {
    const rec = recommendation
    const params = new URLSearchParams()
    if (rec.minSpeed) params.set('minSpeed', rec.minSpeed)
    if (rec.maxPrice) params.set('maxPrice', rec.maxPrice)
    params.set('sortBy', rec.sortBy)
    navigate(`/compare?${params.toString()}`)
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
        Find Your Perfect Plan
      </h1>
      <p style={{ color: '#5C5C5C', marginBottom: '48px', fontSize: '15px' }}>
        Answer two quick questions and we'll recommend the right broadband for your needs.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
        {[1, 2, 3].map(n => (
          <div key={n} style={{
            height: '4px',
            flex: 1,
            borderRadius: '2px',
            backgroundColor: step >= n ? '#C4622D' : '#E8E0D5',
            transition: 'background-color 0.3s'
          }} />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
            What will you mainly use broadband for?
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {uses.map(use => (
              <button
                key={use.id}
                onClick={() => { setSelectedUse(use.id); setStep(2) }}
                style={{
                  padding: '16px 20px',
                  border: '1px solid #E8E0D5',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  textAlign: 'left',
                  color: '#2C2C2C',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#C4622D'
                  e.currentTarget.style.backgroundColor = '#FAF8F5'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E8E0D5'
                  e.currentTarget.style.backgroundColor = '#fff'
                }}
              >
                {use.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
            How many people are in your household?
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {householdSizes.map(size => (
              <button
                key={size.id}
                onClick={() => { setSelectedSize(size.id); setStep(3) }}
                style={{
                  padding: '16px 20px',
                  border: '1px solid #E8E0D5',
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  textAlign: 'left',
                  color: '#2C2C2C',
                  transition: 'border-color 0.2s, background-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#C4622D'
                  e.currentTarget.style.backgroundColor = '#FAF8F5'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E8E0D5'
                  e.currentTarget.style.backgroundColor = '#fff'
                }}
              >
                {size.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            style={{
              marginTop: '16px',
              background: 'none',
              border: 'none',
              color: '#7A6F65',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Step 3 - Result */}
      {step === 3 && recommendation && (
        <div>
          <div style={{
            backgroundColor: '#fff',
            border: '1px solid #E8E0D5',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#F0EBE3',
              color: '#C4622D',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '4px 10px',
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              Our Recommendation
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px' }}>
              {recommendation.title}
            </h2>
            <p style={{ color: '#5C5C5C', fontSize: '15px', lineHeight: '1.7', marginBottom: '24px' }}>
              {recommendation.description}
            </p>

            <div style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              padding: '16px',
              backgroundColor: '#FAF8F5',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              {recommendation.minSpeed > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: '#7A6F65', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Min Speed</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#2C2C2C' }}>{recommendation.minSpeed} Mbps</div>
                </div>
              )}
              {recommendation.maxPrice && (
                <div>
                  <div style={{ fontSize: '11px', color: '#7A6F65', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Max Price</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: '#2C2C2C' }}>€{recommendation.maxPrice}/mo</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: '11px', color: '#7A6F65', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sorted By</div>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#2C2C2C' }}>
                  {recommendation.sortBy === 'speed_high' ? 'Fastest First' : 'Cheapest First'}
                </div>
              </div>
            </div>

            <button onClick={handleViewPlans} style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#C4622D',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}>
              See Matching Plans →
            </button>
          </div>

          <button
            onClick={() => { setStep(1); setSelectedUse(null); setSelectedSize(null) }}
            style={{
              background: 'none',
              border: 'none',
              color: '#7A6F65',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Start again
          </button>
        </div>
      )}
    </div>
  )
}