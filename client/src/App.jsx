import { useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState('Frontend initialized successfully')

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '3rem 1rem' }}>
      <h1>🎓 AlumniConnect</h1>
      <p style={{ fontSize: '1.2rem', color: '#4b5563' }}>
        Intelligent Platform to Interconnect Alumni and Students
      </p>

      <section style={{ margin: '2rem auto', maxWidth: '600px', padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
        <h2>System Status</h2>
        <p style={{ color: '#16a34a', fontWeight: 'bold' }}>{status}</p>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Phase 1: Project Initialization & Tooling Setup
        </p>
      </section>

      <footer style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#9ca3af' }}>
        React + Vite | Node.js + Express | PostgreSQL + Prisma
      </footer>
    </main>
  )
}

export default App
