import { createContext, useContext, createSignal, createEffect } from 'solid-js'
import { STORAGE_KEYS } from '../constants/storage'

const THEME_KEY = STORAGE_KEYS.THEME_DARK

const ThemeContext = createContext()

export function ThemeProvider(props) {
  const savedTheme = localStorage.getItem(THEME_KEY)
  const [darkTheme, setDarkTheme] = createSignal(savedTheme !== 'false')

  createEffect(() => {
    const isDark = darkTheme()
    localStorage.setItem(THEME_KEY, isDark ? 'true' : 'false')
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