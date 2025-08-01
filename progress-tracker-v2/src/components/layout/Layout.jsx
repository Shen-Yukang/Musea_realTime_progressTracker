import React from 'react'
import Header from './Header'

const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 16px' }}>
        {children}
      </main>
    </div>
  )
}

export default Layout
