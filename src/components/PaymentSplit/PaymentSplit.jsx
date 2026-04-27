import React, { useState, useMemo } from 'react'
import { formatNumero } from '../../utils/formatters'

const FERIADOS_PERU = {
  '01-01': 'Año Nuevo',
  '05-01': 'Día del Trabajo',
  '06-29': 'San Pedro y San Pablo',
  '07-28': 'Día de la Independencia',
  '07-29': 'Día de la Independencia',
  '08-30': 'Santa Rosa de Lima',
  '10-08': 'Combate de Angamos',
  '11-01': 'Todos los Santos',
  '12-08': 'Inmaculada Concepción',
  '12-25': 'Navidad',
}

const calcularSemanaSanta = (anio) => {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  
  const domResurreccion = new Date(anio, mes - 1, dia)
  const viernesSanto = new Date(domResurreccion)
  viernesSanto.setDate(viernesSanto.getDate() - 2)
  
  return {
    viernesSanto: viernesSanto.toISOString().split('T')[0],
    domingoResurreccion: domResurreccion.toISOString().split('T')[0]
  }
}

const NOMBRES_MESES = {
  0: 'ENERO', 1: 'FEBRERO', 2: 'MARZO', 3: 'ABRIL',
  4: 'MAYO', 5: 'JUNIO', 6: 'JULIO', 7: 'AGOSTO',
  8: 'SEPTIEMBRE', 9: 'OCTUBRE', 10: 'NOVIEMBRE', 11: 'DICIEMBRE'
}

const getDayType = (dateStr, feriadosAnio) => {
  if (!dateStr) return 'normal'
  
  let fechaObj
  if (dateStr.includes('/')) {
    const [dia, mes, anio] = dateStr.split('/')
    fechaObj = new Date(`${anio}-${mes}-${dia}T00:00:00`)
  } else {
    fechaObj = new Date(dateStr + 'T00:00:00')
  }
  
  const day = fechaObj.getDay()
  
  if (day === 0) return 'domingo'
  if (day === 6) return 'sabado'
  
  const mesDia = dateStr.slice(5)
  if (feriadosAnio[mesDia]) return 'feriado'
  
  return 'normal'
}

const parsearFechaObj = (fecha) => {
  if (!fecha) return null
  if (!fecha.includes('/')) {
    return new Date(fecha + 'T00:00:00')
  }
  const [dia, mes, anio] = fecha.split('/')
  return new Date(`${anio}-${mes}-${dia}T00:00:00`)
}

const formatearFechaMostrar = (fecha) => {
  if (!fecha) return '-'
  if (fecha.includes('/')) return fecha
  const fechaObj = new Date(fecha + 'T00:00:00')
  if (isNaN(fechaObj.getTime())) return fecha
  const dia = String(fechaObj.getDate()).padStart(2, '0')
  const mesNum = String(fechaObj.getMonth() + 1).padStart(2, '0')
  const anio = fechaObj.getFullYear()
  return `${dia}/${mesNum}/${anio}`
}

const formatearFechaInput = (valor) => {
  if (!valor) return ''
  
  const numeros = valor.replace(/\D/g, '')
  
  if (!numeros || numeros.length === 0) return ''
  
  let dia = numeros.substring(0, 2)
  let mes = numeros.length > 2 ? numeros.substring(2, 4) : ''
  let anio = numeros.length > 4 ? numeros.substring(4, 8) : ''
  
  let resultado = dia
  if (mes) resultado += '/' + mes
  if (anio) resultado += '/' + anio
  
  return resultado
}

const obtenerFechaISO = (texto) => {
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (match) {
    const [, dia, mes, anio] = match
    const fecha = new Date(`${anio}-${mes}-${dia}T00:00:00`)
    if (!isNaN(fecha.getTime())) {
      return `${anio}-${mes}-${dia}`
    }
  }
  return texto
}

export const PaymentSplit = ({ totalAmount = 0, onChange }) => {
  const [cuotas, setCuotas] = useState([
    { id: 1, fecha: '', fechaText: '', monto: '' }
  ])

  const currentYear = new Date().getFullYear()
  const feriadosAnio = useMemo(() => ({ ...FERIADOS_PERU, ...calcularSemanaSanta(currentYear) }), [currentYear])

  const numeroCuotas = cuotas.length
  const montoEquitativo = numeroCuotas > 0 ? totalAmount / numeroCuotas : 0

  const totalIngresado = useMemo(() => {
    return cuotas.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0)
  }, [cuotas])

  const totalPendiente = totalAmount - totalIngresado
  const diferencia = Math.abs(totalPendiente)

  const getCuotasPorMes = () => {
    const porMes = {}
    
    cuotas.forEach(cuota => {
      if (!cuota.fecha) return
      
      const fecha = parsearFechaObj(cuota.fecha)
      if (!fecha || isNaN(fecha.getTime())) return
      
      const mes = fecha.getMonth()
      const anio = fecha.getFullYear()
      const key = `${anio}-${mes}`
      
      if (!porMes[key]) {
        porMes[key] = {
          nombre: NOMBRES_MESES[mes],
          mes,
          anio,
          cuotas: [],
          total: 0
        }
      }
      
      porMes[key].cuotas.push({
        ...cuota,
        dayType: getDayType(cuota.fecha, feriadosAnio),
        dayLabel: getDayType(cuota.fecha, feriadosAnio) === 'feriado' 
          ? feriadosAnio[cuota.fecha.includes('/') ? cuota.fecha.slice(5) : cuota.fecha.slice(5)]
          : getDayType(cuota.fecha, feriadosAnio) === 'domingo' 
            ? 'Domingo'
            : getDayType(cuota.fecha, feriadosAnio) === 'sabado'
              ? 'Sábado'
              : null
      })
      porMes[key].total += parseFloat(cuota.monto) || 0
    })
    
    return Object.values(porMes).sort((a, b) => {
      if (a.anio !== b.anio) return a.anio - b.anio
      return a.mes - b.mes
    })
  }

  const cuotasPorMes = getCuotasPorMes()

  const agregarCuota = () => {
    const nuevas = [...cuotas, { id: Date.now(), fecha: '', fechaText: '', monto: '' }]
    setCuotas(nuevas)
    onChange?.(nuevas)
  }

  const eliminarCuota = (id) => {
    if (cuotas.length <= 1) return
    const nuevas = cuotas.filter(c => c.id !== id)
    setCuotas(nuevas)
    onChange?.(nuevas)
  }

  const validarFecha = (fechaISO) => {
    if (!fechaISO || !fechaISO.includes('-')) return null
    
    const fechaObj = new Date(fechaISO + 'T00:00:00')
    if (isNaN(fechaObj.getTime())) return null
    
    const day = fechaObj.getDay()
    if (day === 0) return 'domingo'
    
    const mesDia = fechaISO.slice(5)
    if (FERIADOS_PERU[mesDia]) return 'feriado'
    
    return 'valida'
  }

  const actualizarCuota = (id, campo, valor) => {
    let actualizaciones = { [campo]: valor }
    
    if (campo === 'fechaText') {
      actualizaciones.fecha = obtenerFechaISO(valor)
      
      const validacion = validarFecha(obtenerFechaISO(valor))
      if (validacion === 'domingo') {
        alert('⚠️ La fecha seleccionada es domingo. Por favor seleccione un día válido (lunes a sábado).')
      } else if (validacion === 'feriado') {
        alert('⚠️ La fecha seleccionada es un feriado en Perú. Por favor seleccione un día válido.')
      }
    }
    
    const nuevas = cuotas.map(c => 
      c.id === id ? { ...c, ...actualizaciones } : c
    )
    setCuotas(nuevas)
    onChange?.(nuevas)
  }

  const aplicarEquitativo = () => {
    const fechasInvalidas = []
    
    const nuevas = cuotas.map(c => {
      const validacion = validarFecha(c.fecha)
      if (validacion === 'domingo' || validacion === 'feriado') {
        fechasInvalidas.push(c.fecha)
      }
      return {
        ...c,
        monto: montoEquitativo.toFixed(2)
      }
    })
    
    if (fechasInvalidas.length > 0) {
      alert(`⚠️ Hay ${fechasInvalidas.length} fecha(s) inválida(s) (domingo o feriado). Por favor corríjalas.`)
    }
    
    setCuotas(nuevas)
    onChange?.(nuevas)
  }

  const obtenerClaseBalance = () => {
    if (Math.abs(totalPendiente) < 0.01) return 'balance-ok'
    if (totalPendiente > 0) return 'balance-pending'
    return 'balance-excess'
  }

  const obtenerMensajeBalance = () => {
    if (Math.abs(totalPendiente) < 0.01) return '✓ Distribución exacta'
    if (totalPendiente > 0) return `Falta: S/ ${formatNumero(totalPendiente)}`
    return `Exceso: S/ ${formatNumero(diferencia)}`
  }

  const progreso = totalAmount > 0 ? (totalIngresado / totalAmount) * 100 : 0

  return (
    <div className="payment-split-form">
      <div className="psf-header">
        <div className="psf-title">
          <h3>Fraccionamiento de Pago</h3>
          <span className="psf-subtitle">Fechas coordinadas con el cliente</span>
        </div>
        <div className="psf-summary">
          <div className="psf-summary-item">
            <span className="psf-label">Total</span>
            <span className="psf-value">S/ {formatNumero(totalAmount)}</span>
          </div>
          <div className="psf-summary-item">
            <span className="psf-label">Cuotas</span>
            <span className="psf-value">{numeroCuotas}</span>
          </div>
          <div className="psf-summary-item">
            <span className="psf-label">x Cuota</span>
            <span className="psf-value eq">S/ {formatNumero(montoEquitativo)}</span>
          </div>
        </div>
      </div>

      <div className="psf-actions">
        <button onClick={agregarCuota} className="psf-btn psf-btn-add">
          + Agregar Fecha
        </button>
        {numeroCuotas > 0 && (
          <button onClick={aplicarEquitativo} className="psf-btn psf-btn-equal">
            ⇄ Equitativo
          </button>
        )}
      </div>

      <div className="psf-cuotas-list">
        {cuotas.map((cuota, index) => {
          const dayType = getDayType(cuota.fecha, feriadosAnio)
          const dayLabel = dayType === 'feriado' 
            ? feriadosAnio[cuota.fecha?.slice(5)]
            : dayType === 'domingo' ? 'Domingo'
            : dayType === 'sabado' ? 'Sábado' : null
          
          return (
            <div key={cuota.id} className={`psf-cuota-row ${dayType !== 'normal' ? `day-${dayType}` : ''}`}>
              <span className="psf-cuota-num">{index + 1}</span>
              
              <div className="psf-cuota-inputs">
                <input
                  type="text"
                  value={cuota.fechaText || ''}
                  onChange={(e) => actualizarCuota(cuota.id, 'fechaText', formatearFechaInput(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="dd/mm/yyyy"
                  className={`psf-input psf-fecha day-${dayType}`}
                  maxLength={10}
                />
                
                <div className="psf-monto-wrapper">
                  <span className="psf-monto-simbolo">S/.</span>
                  <input
                    type="number"
                    value={cuota.monto}
                    onChange={(e) => actualizarCuota(cuota.id, 'monto', e.target.value)}
                    className="psf-input psf-monto"
                    placeholder={montoEquitativo.toFixed(2)}
                    step="0.01"
                  />
                </div>
              </div>

              {dayLabel && (
                <span className={`psf-day-badge day-${dayType}`}>
                  {dayLabel}
                </span>
              )}

              <button 
                onClick={() => eliminarCuota(cuota.id)}
                className="psf-btn-remove"
                disabled={cuotas.length <= 1}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {cuotasPorMes.length > 0 && (
        <div className="psf-meses-grid">
          {cuotasPorMes.map((mes) => {
            const porcentaje = (mes.total / totalAmount) * 100
            return (
              <div key={`${mes.anio}-${mes.mes}`} className="psf-mes-card">
                <div className="psf-mes-header">
                  <span className="psf-mes-nombre">{mes.nombre}</span>
                    <span className="psf-mes-pct">{porcentaje.toFixed(2)}%</span>
                </div>
                <div className="psf-mes-cuotas">
                  {mes.cuotas.map((c) => (
                    <div key={c.id} className="psf-mes-cuota">
                      <span className="psf-mes-fecha">
                        {formatearFechaMostrar(c.fecha)}
                      </span>
                      <span className="psf-mes-monto">S/ {formatNumero(c.monto)}</span>
                    </div>
                  ))}
                </div>
                <div className="psf-mes-total">
                  Total: S/ {formatNumero(mes.total)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="psf-totales">
        <div className="psf-total-row">
          <span>Ingresado:</span>
          <span className="psf-total-value">S/ {formatNumero(totalIngresado)}</span>
        </div>
        <div className="psf-total-row">
          <span>Pendiente:</span>
          <span className={`psf-total-value ${obtenerClaseBalance()}`}>
            S/ {formatNumero(totalPendiente)}
          </span>
        </div>
      </div>

      <div className={`psf-progress ${obtenerClaseBalance()}`}>
        <div className="psf-progress-bar">
          <div 
            className="psf-progress-fill"
            style={{ width: `${Math.min(progreso, 100)}%` }}
          ></div>
        </div>
        <span className="psf-progress-text">{obtenerMensajeBalance()}</span>
      </div>
    </div>
  )
}
