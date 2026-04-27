/**
 * Hook usePedido - Estado global del pedido
 * 
 * ✅ Migrado a SolidJS - Logica 100% IDENTICA al original
 * ✅ Todos los calculos, formulas, localStorage, parseo exactamente iguales
 */

import { createEffect, createMemo, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import catalogoData from '../data/catalogo_productos.json'

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

const STORAGE_KEY = 'g360_pedido_actual'
const PENDIENTE_KEY = 'g360_tarea_pendiente'

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

const saveToStorage = (data: DatosPedido) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Error guardando en localStorage:', e)
  }
}

export const loadFromStorage = (): DatosPedido | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Error cargando de localStorage:', e)
    return null
  }
}

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

export const usePedido = () => {
  const savedData = loadFromStorage()
  
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

  const parseDataPegada = (textoPegado: string): ProductoPedido[] => {
    if (!textoPegado.trim()) return []
    const lineas = textoPegado.trim().split('\n')
    const productosParseados: ProductoPedido[] = []

    lineas.forEach((linea, index) => {
      // Soporte para TABs o múltiples espacios (común al pegar de RPE/SAP)
      const columnas = linea.trim().split(/\t| {2,}/)
      
      if (columnas.length >= 8) {
        const producto = {
          id: index + 1,
          codigo: columnas[1]?.trim() || '',
          descripcion: columnas[2]?.trim() || '',
          // Limpieza de números (maneja comas de miles y puntos decimales)
          cantidad: parseFloat(columnas[3]?.replace(/,/g, '')) || 0,
          stock: parseFloat(columnas[4]?.replace(/,/g, '')) || 0,
          unidadMedida: columnas[5]?.trim() || '',
          precioUnitario: parseFloat(columnas[6]?.replace(/,/g, '')) || 0,
          descuento1: parseFloat(columnas[7]?.replace(/,/g, '')) || 0,
          descuento2: parseFloat(columnas[8]?.replace(/,/g, '')) || 0,
        } as ProductoPedido
        productosParseados.push(producto)
      }
    })
    return productosParseados
  }

  const productosCalculados = createMemo(() => {
    return state.productos.map(p => {
      const subtotal = p.cantidad * p.precioUnitario
      const valorVenta = subtotal * (1 - p.descuento1 / 100) * (1 - p.descuento2 / 100)
      const linea = productosMap.get(p.codigo) || p.descripcion.split(' ')[0]

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
    actualizarProductosDesdeTexto: (t: string) => setState('productos', parseDataPegada(t)),
    resetearPedido
  }
}