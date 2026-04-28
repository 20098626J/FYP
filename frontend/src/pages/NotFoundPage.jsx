import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '100px 20px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}></div>
      <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '12px' }}>
        Page Not Found
      </h1>
      <p style={{ color: '#5C5C5C', marginBottom: '32px', fontSize: '15px' }}>
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '12px 28px',
          backgroundColor: '#C4622D',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Back to Home
      </button>
    </div>
  )
}