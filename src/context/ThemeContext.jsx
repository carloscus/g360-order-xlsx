import { createContext, useContext, createSignal, createEffect } from 'solid-js'
import { STORAGE_KEYS } from '../constants/storage'

const THEME_KEY = STORAGE_KEYS.THEME_DARK

const ThemeContext = createContext()

export function ThemeProvider(props) {
  const savedTheme = localStorage.getItem(THEME_KEY)
  const [darkTheme, setDarkTheme] = createSignal(savedTheme !== 'false')

  const applyTheme = (isDark) => {
    const root = document.documentElement
    root.dataset.theme = isDark ? 'dark' : 'light'
    root.style.colorScheme = isDark ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, isDark ? 'true' : 'false')
  }

  applyTheme(darkTheme())

  createEffect(() => {
    applyTheme(darkTheme())
  })

  const toggleTheme = () => setDarkTheme(!darkTheme())

  return (
    <ThemeContext.Provider value={{ darkTheme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}