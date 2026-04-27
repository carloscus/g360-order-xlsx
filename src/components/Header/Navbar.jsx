import React from 'react'
import { useNavigate } from 'react-router-dom'
import { setTareaPendiente } from '../../hooks/usePedido'

export const Navbar = ({ hayProductos, tareaPendiente }) => {
  const navigate = useNavigate()
  
  const mostrarBadge = hayProductos || tareaPendiente

  const handleClickCuotas = () => {
    if (tareaPendiente) {
      const confirmar = window.confirm('¿Tienes un cálculo de cuotas pendiente?\n\nSí: Limpia la página 2 y carga los datos actuales\nNo: Continúa con el cálculo pendiente')
      if (confirmar) {
        setTareaPendiente(false)
      }
    }
    navigate('/distribucion')
  }
  
  return (
    <nav className="g360-navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <img src="/logo-cipsa.svg" alt="CIPSA Logo" className="navbar-logo" />
          <div className="navbar-text-group">
            <h1 className="navbar-title">CIPSA OrderX</h1>
            <span className="navbar-subtitle">CONVERSOR RPE → XLSX</span>
          </div>
        </div>
        <div className="navbar-status">
          {mostrarBadge && (
            <div 
              className={`g360-badge-discrete ${tareaPendiente ? 'badge-pending' : 'badge-active'}`}
              onClick={handleClickCuotas}
              style={{cursor: 'pointer'}}
            >
              <span className="dot"></span>
              {tareaPendiente ? '⚠️ Pendiente' : '✓ Activo'}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}