import React from 'react'

const Header = () => {
  return (
    <header style={{
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid #e5e7eb'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>📊</span>
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              Progress Tracker
            </h1>
          </div>

          <nav style={{ display: 'flex', gap: '32px' }}>
            <a href="#" style={{
              color: '#6b7280',
              textDecoration: 'none',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              进展记录
            </a>
            <a href="#" style={{
              color: '#6b7280',
              textDecoration: 'none',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              反思记录
            </a>
            <a href="#" style={{
              color: '#6b7280',
              textDecoration: 'none',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              目标管理
            </a>
            <a href="#" style={{
              color: '#6b7280',
              textDecoration: 'none',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              分享
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
