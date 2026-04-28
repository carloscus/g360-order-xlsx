/**
 * Hook usePedido - Estado global del pedido con soporte de distribución
 * 
 * + Soporte para distribución pendiente/en proceso
 * + Historial de distribuciones guardadas
 * + Texto original del ERP preservado
 */

import { createEffect, createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import catalogoData from '../data/catalogo_productos.json'
import { ERPParserService } from '../services/erpParser.js'

// Tipos
interface ProductoPedido {
  id: number
  codigo: string
  descripcion: string
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
}

interface DatosPedido {
  cliente: string
  ruc: string
  numeroPedido: string
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
const STORAGE_KEY = 'g360_pedido_actual'
const PENDIENTE_KEY = 'g360_tarea_pendiente'
const ERP_TEXTO_KEY = 'g360_erp_texto'
const DIST_ACTIVA_KEY = 'g360_dist_activa'
const DIST_FLAG_KEY = 'g360_dist_flag'
const DIST_HISTORIAL_KEY = 'g360_dist_historial'

// Mapa de productos del catálogo: sku -> linea
const productosMap = new Map<string, string>()
catalogoData.productos.forEach(p => {
  productosMap.set(p.sku, p.linea)
})

const IVA = 1.18

const calcularEstadoStock = (stock: number, cantidad: number): 'OK' | 'AJ' | 'Agotado' => {
  if (stock >= cantidad * 1.1) return 'OK'
  if (stock >= cantidad * 0.9) return 'AJ'
  return 'Agotado'
}

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

export const usePedido = () => {
  const savedData = loadFromStorage()
  const savedDistActiva = loadDistActiva()
  
  const [state, setState] = createStore<DatosPedido & { tareaPendiente: boolean }>({
    cliente: savedData?.cliente || '',
    ruc: savedData?.ruc || '',
    numeroPedido: savedData?.numeroPedido || '',
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
    // Guardar texto original
    saveErpTexto(texto)
  }

  const productosCalculados = createMemo(() => {
    return state.productos.map(p => {
      const subtotal = p.cantidad * p.precioUnitario
      const valorVenta = (subtotal * (1 - p.descuento1 / 100) * (1 - p.descuento2 / 100)) || 0
      const linea = productosMap.get(p.codigo) || p.descripcion?.split(' ')[0]

      return {
        ...p,
        linea,
        estadoStock: calcularEstadoStock(p.stock, p.cantidad),
        valorVenta,
        precioVenta: valorVenta * IVA
      }
    })
  })

  const totales = createMemo(() => {
    const subtotal = productosCalculados().reduce((sum, p) => sum + p.valorVenta, 0)
    return {
      subtotal,
      totalIGV: subtotal * IVA,
      totalDisponible: productosCalculados()
        .filter(p => p.estadoStock !== 'Agotado')
        .reduce((sum, p) => sum + p.precioVenta, 0)
    }
  })

  const resetearPedido = () => {
    setState({
      cliente: '',
      ruc: '',
      numeroPedido: '',
      vendedor: '',
      emailVendedor: '',
      telefonoVendedor: '',
      productos: [],
      tareaPendiente: false
    })
    // Limpiar texto original
    saveErpTexto('')
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

  const guardarDistribucion = () => {
    const dist = distActiva()
    if (!dist) return

    const historial = [...distHistorial(), dist]
    setDistHistorial(historial)
    saveDistHistorial(historial)
    
    // Limpiar activa
    setDistActiva(null)
    setState('tareaPendiente', false)
  }

  const continuarDistribucion = () => {
    // Ya está activa, solo retornar true
    return distActiva() !== null
  }

  const nuevaDistribucion = () => {
    setDistActiva(null)
    setState('tareaPendiente', false)
  }

  const cargarDistribucion = (id: string) => {
    const historial = distHistorial()
    const dist = historial.find(d => d.id === id)
    if (dist) {
      setDistActiva(dist)
    }
  }

  const eliminarDistribucion = (id: string) => {
    const historial = distHistorial().filter(d => d.id !== id)
    setDistHistorial(historial)
    saveDistHistorial(historial)
  }

  const tieneDistPendiente = (): boolean => {
    return getDistFlag()
  }

  return {
    get cliente() { return state.cliente },
    get ruc() { return state.ruc },
    get numeroPedido() { return state.numeroPedido },
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
    setVendedor: (v: string) => setState('vendedor', v),
    setEmailVendedor: (v: string) => setState('emailVendedor', v),
    setTelefonoVendedor: (v: string) => setState('telefonoVendedor', v),
    actualizarProductosDesdeTexto,
    resetearPedido,

    // Distribución
    get distActiva() { return distActiva() },
    get distHistorial() { return distHistorial() },
    iniciarDistribucion,
    guardarDistribucion,
    nuevaDistribucion,
    cargarDistribucion,
    eliminarDistribucion,
    tieneDistPendiente
  }
}