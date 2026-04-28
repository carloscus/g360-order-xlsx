import { createEffect, createSignal } from 'solid-js'
import { G360_ENGINE } from './core/g360-engine.ts'
import { usePedido } from './hooks/usePedido'
import { Navbar } from './components/Header/Navbar'
import { Footer } from './components/Footer/Footer'
import { Sidebar } from './components/Sidebar/Sidebar'
import { useTheme } from './context/ThemeContext'
import './styles/main.css'

function App(props) {
  const { darkTheme } = useTheme()
  const pedido = usePedido()

  createEffect(() => {
    const appName = G360_ENGINE.branding.appTitle || 'G360 App';
    const client = G360_ENGINE.branding.clientName || 'G360';
    document.title = `${appName} - ${client}`;
  });

  return (
    <div class={`app skill-marca ${darkTheme() ? '' : 'light'}`}>
      <Sidebar />
      
      <Navbar hayProductos={pedido.productos.length > 0} tareaPendiente={pedido.tareaPendiente} />
      
      <main class="app-with-sidebar">
        {props.children}
      </main>

      <Footer />
    </div>
  )
}

export default App
