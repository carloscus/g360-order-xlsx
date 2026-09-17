import { createSignal } from 'solid-js'
import { supabase } from '../lib/supabaseClient'

let debounceTimer = null

export const useVendedor = () => {
  const [vendedor, setVendedor] = createSignal(null)
  const [cargando, setCargando] = createSignal(false)
  const [error, setError] = createSignal(null)

  const buscarPorId = (id) => {
    if (debounceTimer) clearTimeout(debounceTimer)

    if (!id || String(id).trim() === '') {
      setVendedor(null)
      setCargando(false)
      return
    }

    const numId = String(id).trim()
    if (!numId) {
      setVendedor(null)
      return
    }

    setCargando(true)
    setError(null)

    debounceTimer = setTimeout(async () => {
      try {
        const { data, error: err } = await supabase
          .from('ventas')
          .select('id_vendedor, nom_vendedor')
          .eq('id_vendedor', numId)
          .limit(1)
          .single()

        if (err) throw err
        setVendedor(data)
      } catch (e) {
        setError(e.message)
        setVendedor(null)
      } finally {
        setCargando(false)
      }
    }, 300)
  }

  const limpiar = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    setVendedor(null)
    setCargando(false)
    setError(null)
  }

  return { vendedor, cargando, error, buscarPorId, limpiar }
}
