import { useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { provenanceLabel } from '../utils/provenance'

const API = import.meta.env.VITE_API_URL

const uses = [
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'streaming', label: '📺 Streaming' },
  { id: 'wfh', label: '💼 Working from Home' },
  { id: 'browsing', label: '🌐 General Browsing' },
  { id: 'all', label: '⚡ All of the Above' },
]

const householdSizes = [
  { id: '1', label: 'Just me' },
  { id: '2-3', label: '2–3 people' },
  { id: '4+', label: '4 or more' },
]

// Title-case a county name returned from the API in upper case (e.g. "DUBLIN").
function titleCase(name) {
  return name ? name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : ''
}

// Turn a county's gigabit-availability figure into an honest verdict about
// whether the recommended plan is actually attainable there.
function coverageVerdict(pct, preferFttp) {
  if (pct === null || pct === undefined) {
    return { tone: 'neutral', text: "We don't have coverage data for this county — check your exact address on the coverage map." }
  }
  if (pct >= 85) {
    return { tone: 'good', text: `Full fibre reaches about ${pct}% of premises in this county, so the recommended plan should be available at most addresses.` }
  }
  if (pct >= 60) {
    return { tone: 'ok', text: `Full fibre reaches roughly ${pct}% of premises here, but availability varies by area — check your exact address on the coverage map.` }
  }
  return {
    tone: 'warn',
    text: preferFttp
      ? `Full fibre only reaches about ${pct}% of premises in this county, so a low-latency fibre line may not be available at your address yet — check the coverage map.`
      : `Full fibre reaches about ${pct}% of premises here; check your address on the coverage map to confirm what's available.`,
  }
}

const toneColour = { good: '#1a9850', ok: '#C4622D', warn: '#C0392B', neutral: '#7A6F65' }
const tagLabel = { 'best-match': 'Best match', 'best-value': 'Best value', 'most-headroom': 'Most future-proof' }
const tagColour = { 'best-match': '#C4622D', 'best-value': '#1a9850', 'most-headroom': '#1565C0' }

export default function RecommendPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [selectedUse, setSelectedUse] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedCounty, setSelectedCounty] = useState('')
  const [counties, setCounties] = useState([])

  const [rec, setRec] = useState(null)
  const [recStatus, setRecStatus] = useState('idle') // idle | loading | done | error

  useEffect(() => {
    axios.get(`${API}/api/coverage/counties`)
      .then((res) => setCounties((res.data.counties || []).map((c) => c.county)))
      .catch(() => {})
  }, [])

  const getRecommendation = () => {
    setStep(4)
    setRecStatus('loading')
    setRec(null)
    axios.get(`${API}/api/recommend`, {
      params: { use: selectedUse, household: selectedSize, county: selectedCounty || undefined },
    })
      .then((res) => { setRec(res.data); setRecStatus('done') })
      .catch(() => setRecStatus('error'))
  }

  const handleViewPlans = () => {
    const params = new URLSearchParams()
    if (rec?.need?.tier) params.set('minSpeed', rec.need.tier)
    params.set('sortBy', 'price_low')
    navigate(`/compare?${params.toString()}`)
  }

  const restart = () => {
    setStep(1)
    setSelectedUse(null)
    setSelectedSize(null)
    setSelectedCounty('')
    setRec(null)
    setRecStatus('idle')
  }

  const verdict = rec?.coverage
    ? coverageVerdict(rec.coverage.gigabit_pct, rec.need.preferFttp)
    : null

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 20px' }}>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
        Find Your Perfect Plan
      </h1>
      <p style={{ color: '#5C5C5C', marginBottom: '48px', fontSize: '15px' }}>
        Answer three quick questions and we'll work out the speed you actually need —
        with the maths shown — then match it to real plans available in your area.
      </p>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} style={{
            height: '4px', flex: 1, borderRadius: '2px',
            backgroundColor: step >= n ? '#C4622D' : '#E8E0D5', transition: 'background-color 0.3s',
          }} />
        ))}
      </div>

      {/* Step 1 — usage */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
            What will you mainly use broadband for?
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {uses.map((use) => (
              <OptionButton key={use.id} label={use.label}
                onClick={() => { setSelectedUse(use.id); setStep(2) }} />
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — household size */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
            How many people are in your household?
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {householdSizes.map((size) => (
              <OptionButton key={size.id} label={size.label}
                onClick={() => { setSelectedSize(size.id); setStep(3) }} />
            ))}
          </div>
          <BackButton onClick={() => setStep(1)} />
        </div>
      )}

      {/* Step 3 — county */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            Which county are you in?
          </h2>
          <p style={{ color: '#7A6F65', fontSize: '14px', marginBottom: '24px' }}>
            We'll check how far full fibre has reached in your area.
          </p>
          <select
            value={selectedCounty}
            onChange={(e) => setSelectedCounty(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px', fontSize: '15px', border: '1px solid #E8E0D5',
              borderRadius: '10px', backgroundColor: '#fff', color: '#2C2C2C', cursor: 'pointer', marginBottom: '20px',
            }}
          >
            <option value="">Select your county…</option>
            {counties.map((c) => (<option key={c} value={c}>{titleCase(c)}</option>))}
          </select>
          <button
            onClick={getRecommendation}
            disabled={!selectedCounty}
            style={{
              width: '100%', padding: '14px', backgroundColor: selectedCounty ? '#C4622D' : '#D8CEC0',
              color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600',
              cursor: selectedCounty ? 'pointer' : 'not-allowed',
            }}
          >
            See My Recommendation →
          </button>
          <BackButton onClick={() => setStep(2)} />
        </div>
      )}

      {/* Step 4 — result */}
      {step === 4 && (
        <div>
          {recStatus === 'loading' && (
            <p style={{ color: '#5C5C5C', fontSize: '15px' }}>Working out your recommendation…</p>
          )}
          {recStatus === 'error' && (
            <p style={{ color: '#C0392B', fontSize: '15px' }}>
              Couldn't build a recommendation just now. Please try again.
            </p>
          )}

          {recStatus === 'done' && rec && (
            <div>
              <div style={{
                backgroundColor: '#fff', border: '1px solid #E8E0D5', borderRadius: '12px',
                padding: '32px', marginBottom: '16px',
              }}>
                <div style={{
                  display: 'inline-block', backgroundColor: '#F0EBE3', color: '#C4622D', fontSize: '12px',
                  fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px',
                  borderRadius: '4px', marginBottom: '16px',
                }}>
                  Our Recommendation
                </div>

                {/* Computed need */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 40, fontWeight: 700, color: '#2C2C2C' }}>~{rec.need.recommendedMbps}</span>
                  <span style={{ fontSize: 16, color: '#7A6F65' }}>Mbps estimated need</span>
                </div>
                <p style={{ color: '#5C5C5C', fontSize: '15px', lineHeight: 1.6, marginBottom: 20 }}>
                  Based on your usage we suggest a plan of at least <strong>{rec.need.tier} Mbps</strong>
                  {rec.need.preferFttp && <> on a <strong>fibre (FTTP)</strong> connection for low latency</>}.
                </p>

                {/* Transparent breakdown */}
                <div style={{
                  backgroundColor: '#FAF8F5', borderRadius: 8, padding: '14px 16px', marginBottom: 16,
                  fontSize: 13, color: '#5C5C5C',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7A6F65', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    How we work this out
                  </div>
                  {rec.need.breakdown.map((b, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>{b.label}</span>
                      <strong style={{ whiteSpace: 'nowrap', marginLeft: 12 }}>{b.mbps >= 0 ? '+' : ''}{b.mbps} Mbps</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E8E0D5', marginTop: 6, paddingTop: 6 }}>
                    <span style={{ fontWeight: 600 }}>Estimated need</span>
                    <strong>{rec.need.recommendedMbps} Mbps</strong>
                  </div>
                </div>

                {/* Caveats */}
                {rec.need.notes.map((note, i) => (
                  <p key={i} style={{ fontSize: 13, color: '#7A6F65', lineHeight: 1.6, margin: '0 0 8px', paddingLeft: 14, borderLeft: '2px solid #E8E0D5' }}>
                    {note}
                  </p>
                ))}

                {/* Coverage note */}
                {verdict && (
                  <div style={{ borderLeft: `3px solid ${toneColour[verdict.tone]}`, backgroundColor: '#FAF8F5', borderRadius: 6, padding: '12px 16px', margin: '16px 0' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: toneColour[verdict.tone], textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                      Availability in Co. {titleCase(rec.coverage.county)}
                    </div>
                    <p style={{ fontSize: 14, color: '#5C5C5C', lineHeight: 1.6, margin: 0 }}>{verdict.text}</p>
                    <Link to="/coverage" style={{ fontSize: 13, color: '#C4622D', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 8 }}>
                      Check your exact address on the coverage map →
                    </Link>
                  </div>
                )}
              </div>

              {/* Real plan picks */}
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C2C2C', margin: '24px 0 12px' }}>
                Plans that fit
              </h3>
              {rec.budgetNote && (
                <p style={{ fontSize: 13, color: '#C0392B', marginBottom: 12 }}>{rec.budgetNote}</p>
              )}
              <div style={{ display: 'grid', gap: 10 }}>
                {rec.plans.map((p) => (
                  <div key={p.id} style={{ border: '1px solid #E8E0D5', borderRadius: 12, padding: '18px 20px', backgroundColor: '#fff', position: 'relative' }}>
                    {p.tag && (
                      <span style={{
                        position: 'absolute', top: -10, left: 18, backgroundColor: tagColour[p.tag], color: '#fff',
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '3px 10px', borderRadius: 10,
                      }}>
                        {tagLabel[p.tag]}
                      </span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{p.provider_name}</div>
                        <div style={{ fontSize: 13, color: '#5C5C5C' }}>{p.plan_name}</div>
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700, fontSize: 20, color: '#C4622D' }}>€{p.monthly_price}</div>
                        <div style={{ fontSize: 12, color: '#7A6F65' }}>{p.download_speed} Mbps · {p.technology_name}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: '#5C5C5C', lineHeight: 1.5, margin: '10px 0 0' }}>{p.rationale}</p>
                    {provenanceLabel(p) && (
                      <div title={p.source_url || undefined} style={{ color: '#9E9E9E', fontSize: 11, marginTop: 8 }}>
                        🕓 {provenanceLabel(p)}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Sources */}
              <details style={{ marginTop: 20, fontSize: 13, color: '#5C5C5C' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#7A6F65' }}>
                  Where these figures come from
                </summary>
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
                  {rec.sources.map((s, i) => (
                    <li key={i}><strong>{s.claim}</strong> — <span style={{ color: '#7A6F65' }}>{s.source}</span></li>
                  ))}
                </ul>
              </details>

              <button onClick={handleViewPlans} style={{
                width: '100%', padding: '14px', backgroundColor: '#C4622D', color: '#fff', border: 'none',
                borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: 24,
              }}>
                See all matching plans →
              </button>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <BackButton onClick={() => setStep(3)} label="← Change answers" />
            <button onClick={restart} style={{ background: 'none', border: 'none', color: '#7A6F65', cursor: 'pointer', fontSize: 14, marginLeft: 16 }}>
              ← Start again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function OptionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '16px 20px', border: '1px solid #E8E0D5', borderRadius: '10px', backgroundColor: '#fff',
        cursor: 'pointer', fontSize: '15px', fontWeight: '500', textAlign: 'left', color: '#2C2C2C',
        transition: 'border-color 0.2s, background-color 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C4622D'; e.currentTarget.style.backgroundColor = '#FAF8F5' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8E0D5'; e.currentTarget.style.backgroundColor = '#fff' }}
    >
      {label}
    </button>
  )
}

function BackButton({ onClick, label = '← Back' }) {
  return (
    <button onClick={onClick} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#7A6F65', cursor: 'pointer', fontSize: '14px' }}>
      {label}
    </button>
  )
}
