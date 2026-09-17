import { createSignal } from 'solid-js'
import { supabase } from '../lib/supabaseClient'

let debounceTimer = null

export const useClientes = () => {
  const [resultados, setResultados] = createSignal([])
  const [cargando, setCargando] = createSignal(false)
  const [error, setError] = createSignal(null)

  const buscar = (termino) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (!termino || termino.trim().length < 2) {
      setResultados([])
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)

    debounceTimer = setTimeout(async () => {
      try {
        const term = termino.trim()
        
        // Primero: buscar coincidencia exacta en id_cliente (con ceros)
        const { data: exactMatch, error: err1 } = await supabase
          .from('ventas')
          .select('id_cliente, doc_cliente, nom_cliente, id_vendedor, nom_vendedor')
          .eq('id_cliente', term.padStart(8, '0'))
          .limit(1)

        if (err1) throw err1

        if (exactMatch && exactMatch.length > 0) {
          // Encontró coincidencia exacta
          const seen = new Set()
          const unicos = exactMatch.filter(row => {
            if (seen.has(row.id_cliente)) return false
            seen.add(row.id_cliente)
            return true
          })
          setResultados(unicos)
          setCargando(false)
          return
        }

        // Si no, buscar por RUC o código parcial
        const { data, error: err } = await supabase
          .from('ventas')
          .select('id_cliente, doc_cliente, nom_cliente, id_vendedor, nom_vendedor')
          .or(`doc_cliente.ilike.%${term}%,id_cliente.ilike.%${term}%`)
          .limit(10)

        if (err) throw err

        // Deduplicar por id_cliente
        const seen = new Set()
        const unicos = (data || []).filter(row => {
          if (seen.has(row.id_cliente)) return false
          seen.add(row.id_cliente)
          return true
        })

        setResultados(unicos)
      } catch (e) {
        setError(e.message)
        setResultados([])
      } finally {
        setCargando(false)
      }
    }, 300)
  }

  const limpiar = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    setResultados([])
    setCargando(false)
    setError(null)
  }

  return { resultados, cargando, error, buscar, limpiar }
}
