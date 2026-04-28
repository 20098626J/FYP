import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'


const API = import.meta.env.VITE_API_URL

const primaryBtn = {
  padding: '14px 32px',
  backgroundColor: '#C4622D',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer'
}

const outlineBtn = {
  padding: '14px 32px',
  backgroundColor: 'transparent',
  color: '#FAF8F5',
  border: '2px solid #FAF8F5',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer'
}

export default function HomePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    axios.get(`${API}/api/stats`)
      .then(res => setStats(res.data))
      .catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero */}
      <div style={{
        backgroundColor: '#2C2C2C',
        color: '#FAF8F5',
        padding: '100px 20px',
        textAlign: 'center'
      }}>
        <h1 style={{
  fontSize: '48px',
  fontWeight: '700',
  marginBottom: '20px',
  color: '#FAF8F5'
}}>
  Find the Best Broadband<br />in Ireland
</h1>
        <p style={{
          fontSize: '18px',
          maxWidth: '560px',
          margin: '0 auto 40px auto',
          color: '#B0A899',
          lineHeight: '1.7'
        }}>
          Compare plans from Ireland's major providers, explore coverage by county,
          and learn everything you need to know, all in one place.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/compare')} style={primaryBtn}>
            Compare Plans
          </button>
          <button onClick={() => navigate('/coverage')} style={outlineBtn}>
            View Coverage Map
          </button>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div style={{
          backgroundColor: '#F0EBE3',
          padding: '28px 20px',
          display: 'flex',
          justifyContent: 'center',
          gap: '64px',
          flexWrap: 'wrap',
          borderBottom: '1px solid #E8E0D5'
        }}>
          {[
            { value: stats.providers.count, label: 'Providers' },
            { value: stats.plans.count, label: 'Plans' },
            { value: stats.counties, label: 'Counties' },
          ].map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#C4622D' }}>{value}</div>
              <div style={{ fontSize: '13px', color: '#7A6F65', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Features */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 20px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '30px', marginBottom: '48px', fontWeight: '700' }}>
          Everything You Need to Choose the Right Broadband
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px'
        }}>
          {[
            {
              icon: '📊',
              title: 'Compare Plans',
              description: 'See plans from Eir, Virgin Media, Sky and Vodafone side by side. Filter by speed and price to find the best value for your household.'
            },
            {
              icon: '🗺️',
              title: 'Coverage Map',
              description: 'Explore full fibre broadband coverage across every county in Ireland, based on the latest ComReg quarterly data.'
            },
            {
              icon: '📖',
              title: 'Learn the Basics',
              description: 'Not sure what FTTP or Mbps means? Our plain English guides explain everything from broadband basics to Irish infrastructure.'
            },
          ].map(({ icon, title, description }) => (
            <div key={title} style={{
              border: '1px solid #E8E0D5',
              borderRadius: '12px',
              padding: '32px 24px',
              textAlign: 'center',
              backgroundColor: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>{icon}</div>
              <h3 style={{ fontSize: '17px', marginBottom: '12px', fontWeight: '600' }}>{title}</h3>
              <p style={{ color: '#5C5C5C', fontSize: '14px', lineHeight: '1.7' }}>{description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        backgroundColor: '#F0EBE3',
        padding: '64px 20px',
        textAlign: 'center',
        borderTop: '1px solid #E8E0D5'
      }}>
        <h2 style={{ fontSize: '26px', marginBottom: '12px', fontWeight: '700' }}>
          Ready to find your plan?
        </h2>
        <p style={{ color: '#5C5C5C', marginBottom: '28px', fontSize: '15px' }}>
          Compare all available plans in seconds — no sign up required.
        </p>
        <button onClick={() => navigate('/compare')} style={primaryBtn}>
          Compare Plans Now
        </button>
      </div>
    </div>
  )
}