/**
 * Hook usePedido - Estado global del pedido con soporte de distribución
 * 
 * + Soporte para distribución pendiente/en proceso
 * + Historial de distribuciones guardadas
 * + Texto original del ERP preservado
 */

import { createEffect, createMemo, createSignal, createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
import { ERPParserService } from '../services/erpParser'
import { getAgentesSkill } from '../core/g360-skill-agentes'
import { useCatalogo } from '../hooks/useCatalogo'
import { STORAGE_KEYS } from '../constants/storage'

// Tipos
interface ProductoPedido {
  id: number
  codigo: string
  descripcion: string
  marca: string
  cantidad: number
  stock: number
  unidadMedida: string
  precioUnitario: number
  descuento1: number
  descuento2: number
  linea?: string
  estadoStock?: 'OK' | 'AJ' | 'Agotado'
  valorVenta?: number
  precioVenta?: number
  cajas?: number
  pesoTotal?: number
}

interface DatosPedido {
  cliente: string
  ruc: string
  numeroPedido: string
  idCliente: string
  sucursal: string
  vendedor: string
  emailVendedor: string
  telefonoVendedor: string
  productos: ProductoPedido[]
}

interface Distribucion {
  id: string
  timestamp: number
  cliente: string
  ruc: string
  numeroPedido: string
  vendedor: string
  total: number
  cuotas: Array<{
    numero: number
    fecha: string
    monto: number
    estado: 'pendiente' | 'pagado'
  }>
}

// Storage Keys
const {
  PEDIDO_ACTUAL: STORAGE_KEY,
  TAREA_PENDIENTE: PENDIENTE_KEY,
  ERP_TEXTO: ERP_TEXTO_KEY,
  DIST_ACTIVA: DIST_ACTIVA_KEY,
  DIST_FLAG: DIST_FLAG_KEY,
  DIST_HISTORIAL: DIST_HISTORIAL_KEY
} = STORAGE_KEYS

// Storage helpers
const saveToStorage = (data: DatosPedido) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error guardando en localStorage:', e)
  }
}

const loadFromStorage = (): DatosPedido | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Error cargando de localStorage:', e)
    return null
  }
}

export { loadFromStorage }

const getTareaPendiente = (): boolean => {
   try {
     return localStorage.getItem(PENDIENTE_KEY) === '1'
   } catch {
     return false
   }
}

export const setTareaPendiente = (valor: boolean) => {
  try {
    localStorage.setItem(PENDIENTE_KEY, valor ? '1' : '0')
  } catch (e) {
    console.error('Error guardando tarea pendiente:', e)
  }
}

// Distribución helpers
const saveDistActiva = (dist: Distribucion | null) => {
  try {
    if (dist) {
      localStorage.setItem(DIST_ACTIVA_KEY, JSON.stringify(dist))
    } else {
      localStorage.removeItem(DIST_ACTIVA_KEY)
    }
  } catch (e) {
    console.error('Error guardando distribución activa:', e)
  }
}

const loadDistActiva = (): Distribucion | null => {
  try {
    const data = localStorage.getItem(DIST_ACTIVA_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const getDistFlag = (): boolean => {
  try {
    return localStorage.getItem(DIST_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export const setDistFlag = (valor: boolean) => {
  try {
    localStorage.setItem(DIST_FLAG_KEY, valor ? '1' : '0')
  } catch (e) {
    console.error('Error guardando dist flag:', e)
  }
}

const saveDistHistorial = (historial: Distribucion[]) => {
  try {
    localStorage.setItem(DIST_HISTORIAL_KEY, JSON.stringify(historial))
  } catch (e) {
    console.error('Error guardando historial:', e)
  }
}

const loadDistHistorial = (): Distribucion[] => {
  try {
    const data = localStorage.getItem(DIST_HISTORIAL_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveErpTexto = (texto: string) => {
  try {
    if (texto) {
      localStorage.setItem(ERP_TEXTO_KEY, texto)
    } else {
      localStorage.removeItem(ERP_TEXTO_KEY)
    }
  } catch (e) {
    console.error('Error guardando texto ERP:', e)
  }
}

export const loadErpTexto = (): string => {
  try {
    return localStorage.getItem(ERP_TEXTO_KEY) || ''
  } catch {
    return ''
  }
}

let pedidoSingleton = null

export const usePedido = () => {
  if (pedidoSingleton) return pedidoSingleton

  pedidoSingleton = createRoot(() => {
    const savedData = loadFromStorage()
    const savedDistActiva = loadDistActiva()
    
    const { enriquecerProducto } = useCatalogo()
    const { calculos } = getAgentesSkill()
    
    const [state, setState] = createStore<DatosPedido & { tareaPendiente: boolean }>({
      cliente: savedData?.cliente || '',
      ruc: savedData?.ruc || '',
      numeroPedido: savedData?.numeroPedido || '',
      idCliente: savedData?.idCliente || '',
      sucursal: savedData?.sucursal || 'PRINCIPAL',
      vendedor: savedData?.vendedor || '',
      emailVendedor: savedData?.emailVendedor || '',
      telefonoVendedor: savedData?.telefonoVendedor || '',
      productos: savedData?.productos || [],
      tareaPendiente: getTareaPendiente()
    })

    // Distribución state
    const [distActiva, setDistActiva] = createSignal<Distribucion | null>(savedDistActiva)
    const [distHistorial, setDistHistorial] = createSignal<Distribucion[]>(loadDistHistorial())

    createEffect(() => {
      const data = {
        cliente: state.cliente,
        ruc: state.ruc,
        numeroPedido: state.numeroPedido,
        idCliente: state.idCliente,
        sucursal: state.sucursal,
        vendedor: state.vendedor,
        emailVendedor: state.emailVendedor,
        telefonoVendedor: state.telefonoVendedor,
        productos: state.productos
      }
      saveToStorage(data)
    })

    createEffect(() => {
      setTareaPendiente(state.tareaPendiente)
    })

    // Sync distribución activa con storage
    createEffect(() => {
      const dist = distActiva()
      saveDistActiva(dist)
      setDistFlag(!!dist)
    })

    const actualizarProductosDesdeTexto = (texto: string) => {
      const productos = ERPParserService.parseDataPegada(texto)
      setState('productos', productos)
      saveErpTexto(texto)
    }

    const productosCalculados = createMemo(() => {
      return state.productos.map(p => {
        const enriched = enriquecerProducto(p)
        const valorVenta = calculos.basic.valorVenta(p.cantidad, p.precioUnitario, p.descuento1, p.descuento2)
        const precioVenta = calculos.basic.precioVenta(valorVenta)
        const estadoStock = calculos.stock.estado(p.stock, p.cantidad)
        const cajas = calculos.logistica.cajas(p.cantidad, enriched.unBx)
        const pesoTotal = calculos.logistica.pesoTotal(p.cantidad, enriched.pesoKg)

        return {
          ...p,
          ...enriched,
          valorVenta,
          precioVenta,
          estadoStock,
          cajas,
          pesoTotal
        }
      })
    })

    const totales = createMemo(() => {
      const productos = productosCalculados()
      return calculos.pedido.totales(productos)
    })

    const resetearPedido = () => {
      setState({
        cliente: '',
        ruc: '',
        numeroPedido: '',
        idCliente: '',
        sucursal: 'PRINCIPAL',
        vendedor: '',
        emailVendedor: '',
        telefonoVendedor: '',
        productos: [],
        tareaPendiente: false
      })
      saveErpTexto('')
      setDistActiva(null)
      setDistHistorial([])
    }

    // Distribución functions
    const iniciarDistribucion = () => {
      const dist: Distribucion = {
        id: `dist_${Date.now()}`,
        timestamp: Date.now(),
        cliente: state.cliente,
        ruc: state.ruc,
        numeroPedido: state.numeroPedido,
        vendedor: state.vendedor,
        total: totales().totalIGV,
        cuotas: []
      }
      setDistActiva(dist)
    }

    const nuevaDistribucion = () => {
      setDistActiva(null)
      setState('tareaPendiente', false)
    }

    const tieneDistPendiente = (): boolean => {
      return getDistFlag()
    }

    return {
      get cliente() { return state.cliente },
      get ruc() { return state.ruc },
      get numeroPedido() { return state.numeroPedido },
      get idCliente() { return state.idCliente },
      get sucursal() { return state.sucursal },
      get vendedor() { return state.vendedor },
      get emailVendedor() { return state.emailVendedor },
      get telefonoVendedor() { return state.telefonoVendedor },
      get productos() { return productosCalculados() },
      get totales() { return totales() },
      get tareaPendiente() { return state.tareaPendiente },

      setTareaPendiente: (v: boolean) => setState('tareaPendiente', v),
      setCliente: (v: string) => setState('cliente', v),
      setRuc: (v: string) => setState('ruc', v),
      setNumeroPedido: (v: string) => setState('numeroPedido', v),
      setIdCliente: (v: string) => setState('idCliente', v),
      setSucursal: (v: string) => setState('sucursal', v),
      setVendedor: (v: string) => setState('vendedor', v),
      setEmailVendedor: (v: string) => setState('emailVendedor', v),
      setTelefonoVendedor: (v: string) => setState('telefonoVendedor', v),
      actualizarProductosDesdeTexto,
      resetearPedido,

      get distActiva() { return distActiva() },
      get distHistorial() { return distHistorial() },
      iniciarDistribucion,
      nuevaDistribucion,
      tieneDistPendiente
    }
    })

  return pedidoSingleton
}