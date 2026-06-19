import { createSignal, createMemo, For, Show } from 'solid-js'
import { formatNumero } from '../../utils/formatters'

const AHORA = new Date()
const ANIO_ACTUAL = AHORA.getFullYear()
const MES_ACTUAL = AHORA.getMonth()
const MES_ACTUAL_STR = `${ANIO_ACTUAL}-${String(MES_ACTUAL + 1).padStart(2, '0')}`

const esFechaPasada = (anio, mes) => anio < ANIO_ACTUAL || (anio === ANIO_ACTUAL && mes < MES_ACTUAL)

const NOMBRES_MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
]
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const DIAS_LAB = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const FERIADOS_PERU = {
  '01-01': 'Año Nuevo', '05-01': 'Día del Trabajo', '06-29': 'San Pedro y San Pablo',
  '07-28': 'Independencia', '07-29': 'Independencia', '08-30': 'Santa Rosa',
  '10-08': 'Angamos', '11-01': 'Todos los Santos', '12-08': 'Inmaculada',
  '12-25': 'Navidad'
}

const calcularSemanaSanta = (anio) => {
  const a = anio % 19, b = Math.floor(anio / 100), c = anio % 100
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  const domingo = new Date(anio, mes - 1, dia)
  const viernes = new Date(domingo); viernes.setDate(viernes.getDate() - 2)
  return {
    [viernes.toISOString().slice(5, 10)]: 'Viernes Santo',
    [domingo.toISOString().slice(5, 10)]: 'Domingo Resurrección'
  }
}

const obtenerDiaTipo = (anio, mes, dia) => {
  const fecha = new Date(anio, mes, dia)
  const d = fecha.getDay()
  if (d === 0) return 'domingo'
  if (d === 6) return 'sabado'
  const mm = String(mes + 1).padStart(2, '0')
  const dd = String(dia).padStart(2, '0')
  const feriados = { ...FERIADOS_PERU, ...calcularSemanaSanta(anio) }
  if (feriados[`${mm}-${dd}`]) return 'feriado'
  return 'normal'
}

const esBisiesto = (anio) => (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0
const diasEnMes = (mes, anio) => mes === 1 && esBisiesto(anio) ? 29 : DIAS_POR_MES[mes]
const obtenerAnioMes = (val) => val ? (([a, m]) => ({ anio: Number(a), mes: Number(m) - 1 }))(val.split('-')) : null
const key = (anio, mes, dia) => `${anio}-${mes}-${dia}`
const formatearFecha = (anio, mes, dia) => {
  const dd = String(dia).padStart(2, '0')
  const mm = String(mes + 1).padStart(2, '0')
  return `${dd}/${mm}/${anio}`
}

const sumarMeses = (anio, mes, n) => {
  const total = mes + n
  return { anio: anio + Math.floor(total / 12), mes: total % 12 }
}

export const PaymentSplit = (props) => {
  const [startMonth, setStartMonth] = createSignal('')
  const [endMonth, setEndMonth] = createSignal('')
  const [cuotasMap, setCuotasMap] = createSignal({})

  const maxEndMonth = createMemo(() => {
    const s = obtenerAnioMes(startMonth())
    if (!s) return ''
    const r = sumarMeses(s.anio, s.mes, 11)
    return `${r.anio}-${String(r.mes + 1).padStart(2, '0')}`
  })

  const setStartMonthWithClamp = (val) => {
    setStartMonth(val)
    const s = obtenerAnioMes(val)
    if (!s) return
    const e = obtenerAnioMes(endMonth())
    if (!e) return
    const limite = sumarMeses(s.anio, s.mes, 11)
    if (e.anio > limite.anio || (e.anio === limite.anio && e.mes > limite.mes)) {
      setEndMonth(`${limite.anio}-${String(limite.mes + 1).padStart(2, '0')}`)
    }
  }

  const totalAmount = () => props.totalAmount || 0

  const meses = createMemo(() => {
    const s = obtenerAnioMes(startMonth())
    const e = obtenerAnioMes(endMonth())
    if (!s || !e) return []
    const lista = []
    let { anio, mes } = s
    while (anio < e.anio || (anio === e.anio && mes <= e.mes)) {
      lista.push({ anio, mes, dias: diasEnMes(mes, anio) })
      mes++
      if (mes > 11) { mes = 0; anio++ }
    }
    return lista
  })

  const cuotasArray = createMemo(() => Object.values(cuotasMap()).sort((a, b) =>
    a.anio !== b.anio ? a.anio - b.anio : a.mes !== b.mes ? a.mes - b.mes : a.dia - b.dia
  ))

  const toggleDia = (anio, mes, dia) => {
    const k = key(anio, mes, dia)
    if (!cuotasMap()[k]) {
      if (esFechaPasada(anio, mes)) return
      const tipo = obtenerDiaTipo(anio, mes, dia)
      if (tipo === 'feriado' || tipo === 'domingo') return
    }
    const actual = { ...cuotasMap() }
    if (actual[k]) {
      delete actual[k]
    } else {
      actual[k] = { id: k, anio, mes, dia, monto: '' }
    }
    setCuotasMap(actual)
    props.onChange?.(Object.values(actual))
  }

  const actualizarMonto = (k, valor) => {
    const actual = { ...cuotasMap() }
    if (actual[k]) actual[k] = { ...actual[k], monto: valor }
    setCuotasMap(actual)
    props.onChange?.(Object.values(actual))
  }

  const aplicarEquitativo = () => {
    const arr = cuotasArray()
    const n = arr.length
    if (n === 0) return
    const eq = (totalAmount() / n).toFixed(2)
    const actual = {}
    arr.forEach(c => { actual[c.id] = { ...c, monto: eq } })
    setCuotasMap(actual)
    props.onChange?.(Object.values(actual))
  }

  const totalIngresado = createMemo(() =>
    cuotasArray().reduce((s, c) => s + (parseFloat(c.monto) || 0), 0)
  )
  const totalPendiente = () => totalAmount() - totalIngresado()

  const claseBalance = () => {
    const d = totalPendiente()
    if (Math.abs(d) < 0.01) return 'balance-ok'
    return d > 0 ? 'balance-pending' : 'balance-excess'
  }
  const textoBalance = () => {
    const d = totalPendiente()
    if (Math.abs(d) < 0.01) return '✓ Letras cuadradas'
    return d > 0 ? `Faltante: S/ ${formatNumero(d)}` : `Excedente: S/ ${formatNumero(Math.abs(d))}`
  }
  const progreso = () => totalAmount() > 0 ? (totalIngresado() / totalAmount()) * 100 : 0
  const montoEq = () => { const n = cuotasArray().length; return n > 0 ? totalAmount() / n : 0 }

  const cuotasPorMes = createMemo(() => {
    const map = {}
    cuotasArray().forEach(c => {
      const k = key(c.anio, c.mes, 0)
      if (!map[k]) map[k] = { anio: c.anio, mes: c.mes, nombre: NOMBRES_MESES[c.mes], cuotas: [], total: 0 }
      map[k].cuotas.push(c)
      map[k].total += parseFloat(c.monto) || 0
    })
    return Object.values(map).sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes)
  })

  const totalPorMes = createMemo(() => {
    const r = {}
    cuotasArray().forEach(c => {
      const k = key(c.anio, c.mes, 0)
      r[k] = (r[k] || 0) + (parseFloat(c.monto) || 0)
    })
    return r
  })

  return (
    <div class="payment-split-form">
      <div class="psf-header">
        <div class="psf-title">
          <h3>Programación de Letras</h3>
          <span class="psf-subtitle">Selecciona las fechas de vencimiento</span>
        </div>
        <div class="psf-summary">
          <div class="psf-summary-item">
            <span class="psf-label">Total</span>
            <span class="psf-value">S/ {formatNumero(totalAmount())}</span>
          </div>
          <div class="psf-summary-item">
            <span class="psf-label">Días</span>
            <span class="psf-value">{cuotasArray().length}</span>
          </div>
          <Show when={cuotasArray().length > 0}>
            <div class="psf-summary-item">
              <span class="psf-label">x Letra</span>
              <span class="psf-value eq">S/ {formatNumero(montoEq())}</span>
            </div>
          </Show>
        </div>
      </div>

      <div class="psf-rango-meses">
        <div class="psf-rango-input">
          <label class="psf-rango-label">Mes inicio</label>
          <input type="month" value={startMonth()} onInput={e => setStartMonthWithClamp(e.currentTarget.value)} min={MES_ACTUAL_STR} class="psf-input psf-month-input" />
        </div>
        <span class="psf-rango-sep">→</span>
        <div class="psf-rango-input">
          <label class="psf-rango-label">Mes fin</label>
          <input type="month" value={endMonth()} onInput={e => setEndMonth(e.currentTarget.value)} min={MES_ACTUAL_STR} max={maxEndMonth()} class="psf-input psf-month-input" />
        </div>
      </div>
      <Show when={meses().length > 0}>
        <span class="psf-rango-hint">
          {(() => {
            const ms = meses()
            const n = ms.length
            return `${NOMBRES_MESES[ms[0].mes]} ${ms[0].anio} → ${NOMBRES_MESES[ms[n-1].mes]} ${ms[n-1].anio} (${n} mes${n !== 1 ? 'es' : ''})`
          })()}
        </span>
        <Show when={meses().length === 12}>
          <span class="psf-rango-max">Máximo rango alcanzado: 12 meses</span>
        </Show>
      </Show>

      <Show when={meses().length > 0}>
        <div class="psf-calendarios">
          <For each={meses()}>
            {(m) => {
              const primerDia = new Date(m.anio, m.mes, 1).getDay()
              const primerDiaLocal = primerDia === 0 ? 6 : primerDia - 1
              const celdasVacia = primerDiaLocal
              const map = cuotasMap()

              return (
                <div class="psf-cal-mes">
                  <div class="psf-cal-header">
                    <span class="psf-cal-titulo">{NOMBRES_MESES[m.mes]} {m.anio}</span>
                  </div>
                  <div class="psf-cal-grid">
                    <For each={DIAS_LAB}>
                      {(dl) => <div class="psf-cal-dia-label">{dl}</div>}
                    </For>
                    <For each={Array.from({ length: celdasVacia })}>
                      {() => <div class="psf-cal-celda psf-cal-vacia"></div>}
                    </For>
                    <For each={Array.from({ length: m.dias }, (_, i) => i + 1)}>
                      {(dia) => {
                        const k = key(m.anio, m.mes, dia)
                        const sel = map[k]
                        const tipo = obtenerDiaTipo(m.anio, m.mes, dia)
                        const pasado = esFechaPasada(m.anio, m.mes)
                        const bloqueado = !sel && (pasado || tipo === 'feriado' || tipo === 'domingo')
                            const extraClass = pasado ? ' psf-cal-pasado' : (!sel && (tipo === 'feriado' || tipo === 'domingo')) ? ' psf-cal-disabled' : ''
                        return (
                          <div
                            class={`psf-cal-celda${sel ? ' psf-cal-seleccionado' : ''} psf-cal-${tipo}${extraClass}`}
                            onClick={bloqueado ? undefined : () => toggleDia(m.anio, m.mes, dia)}
                          >
                            <span class="psf-cal-num">{dia}</span>
                          </div>
                        )
                      }}
                    </For>
                  </div>
                </div>
              )
            }}
          </For>
        </div>
      </Show>

      <Show when={cuotasPorMes().length > 0}>
        <div class="psf-resumen-cards">
          <For each={cuotasPorMes()}>
            {(g) => (
              <div class="psf-res-card">
                <div class="psf-res-header">
                  <span class="psf-res-titulo">{g.nombre} {g.anio}</span>
                  <span class="psf-res-total">S/ {formatNumero(g.total)}</span>
                </div>
                <div class="psf-res-lista">
                  <For each={g.cuotas}>
                    {(c) => (
                      <div class="psf-res-item">
                        <span class="psf-res-dia">{formatearFecha(c.anio, c.mes, c.dia)}</span>
                        <div class="psf-res-monto-wrap">
                          <span class="psf-monto-simbolo">S/.</span>
                          <input
                            type="text"
                            value={c.monto}
                            onChange={(e) => {
                              const raw = e.currentTarget.value.trim()
                              if (raw === '') return
                              const normalizado = raw.replace(',', '.')
                              const conCero = normalizado.startsWith('.') ? '0' + normalizado : normalizado
                              const num = parseFloat(conCero)
                              if (!isNaN(num)) actualizarMonto(c.id, num.toFixed(2))
                            }}
                            onFocus={(e) => e.target.select()}
                            class="psf-res-input"
                            placeholder="0.00"
                          />
                          <button type="button" class="psf-monto-btn psf-monto-up" onClick={() => {
                            const actual = parseFloat(c.monto) || 0
                            actualizarMonto(c.id, (actual + 0.01).toFixed(2))
                          }}>▲</button>
                          <button type="button" class="psf-monto-btn psf-monto-down" onClick={() => {
                            const actual = parseFloat(c.monto) || 0
                            const nuevo = Math.max(0, actual - 0.01)
                            actualizarMonto(c.id, nuevo.toFixed(2))
                          }}>▼</button>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={cuotasArray().length > 0}>
        <div class="psf-actions">
          <button onClick={aplicarEquitativo} class="psf-btn psf-btn-equal">⇄ Distribuir equitativamente</button>
        </div>

        <div class="psf-totales">
          <div class="psf-total-row">
            <span>Asignado:</span>
            <span class="psf-total-value">S/ {formatNumero(totalIngresado())}</span>
          </div>
          <div class="psf-total-row">
            <span>Saldo:</span>
            <span class={`psf-total-value ${claseBalance()}`}>S/ {formatNumero(totalPendiente())}</span>
          </div>
        </div>

        <div class={`psf-progress ${claseBalance()}`}>
          <div class="psf-progress-bar">
            <div class="psf-progress-fill" style={{ width: `${Math.min(progreso(), 100)}%` }}></div>
          </div>
          <span class="psf-progress-text">{textoBalance()}</span>
        </div>
      </Show>
    </div>
  )
}