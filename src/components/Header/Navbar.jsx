import { Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { setTareaPendiente } from '../../hooks/usePedido'

export const Navbar = (props) => {
  const navigate = useNavigate()
  
  const handleClickCuotas = () => {
    if (props.tareaPendiente) {
      const confirmar = window.confirm('¿Tienes un cálculo de cuotas pendiente?\n\nSí: Limpia la página 2 y carga los datos actuales\nNo: Continúa con el cálculo pendiente')
      if (confirmar) {
        setTareaPendiente(false)
      }
    }
    navigate('/distribucion')
  }
  
  return (
    <nav class="g360-navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <img src="/logo-cipsa.svg" alt="CIPSA Logo" class="navbar-logo" />
          <div class="navbar-text-group">
            <h1 class="navbar-title">CIPSA OrderX</h1>
            <span class="navbar-subtitle">INTELIGENCIA ERP | APOYO ERP/CRM</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
