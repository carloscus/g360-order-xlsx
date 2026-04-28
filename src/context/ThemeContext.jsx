import { createContext, useContext, createSignal, createEffect } from 'solid-js'

const THEME_KEY = 'g360_theme_dark'

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