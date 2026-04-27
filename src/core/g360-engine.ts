/**
 * G360 Engine - Base del ecosistema
 * Layout, efectos, colores, componentes base
 * 
 * ✅ Migrado a Typescript - 100% identico al original
 */

export interface G360Config {
  version: string
  author: string
  brand: string
  signature: string
}

export interface G360Colors {
  bg: string
  surface: string
  accent: string
  text: string
  muted: string
  apt: string
  qc: string
  ves: string
}

export interface G360Effects {
  glassmorphism: boolean
  blur: string
  glow: boolean
  rounded: string
}

export interface G360Layout {
  sidebar: string
  asymmetry: boolean
  responsive: {
    mobile: string
    tablet: string
  }
}

export interface G360ComponentStyles {
  width?: string
  background?: string
  backdropFilter?: string
  borderRight?: string
  border?: string
  borderRadius?: string
  boxShadow?: string
  color?: string
  fontWeight?: string
  textTransform?: string
  letterSpacing?: string
  filter?: string
  padding?: string
  transition?: string
  [key: string]: unknown
}

export interface G360Components {
  sidebar: G360ComponentStyles
  card: G360ComponentStyles
  button: G360ComponentStyles
}

export interface G360Animation {
  from: Record<string, string | number>
  to: Record<string, string | number>
}

export interface G360Skill {
  name: string
  styles: G360ComponentStyles
}

export interface G360Engine {
  config: G360Config
  branding: {
    appTitle: string
    clientName: string
  }
  colors: G360Colors
  effects: G360Effects
  layout: G360Layout
  components: G360Components
  animations: Record<string, G360Animation>
  utils: {
    createComponent: (type: string, props?: Record<string, unknown>) => G360ComponentStyles
    applySkill: (component: G360ComponentStyles, skill: string) => G360ComponentStyles
    getSkillConfig: (skill: string) => G360Skill
  }
}

export const G360_ENGINE: G360Engine = {
  // Configuración base
  config: {
    version: '1.0.0',
    author: 'Carlos Cusi',
    brand: 'G360',
    signature: 'CCUSI'
  },

  branding: {
    appTitle: 'G360 ORDER XLSX',
    clientName: 'CIPSA'
  },

  // Colores G360 inmutables
  colors: {
    bg: '#0b1220',
    surface: '#151e2e',
    accent: '#00d084',        // Verde neón
    text: '#f0f4f8',
    muted: '#94a3b8',
    apt: '#10b981',           // Verde apt
    qc: '#f59e0b',            // Naranja qc
    ves: '#06b6d4'            // Azul ves
  },

  // Efectos visuales
  effects: {
    glassmorphism: true,
    blur: '16px',
    glow: true,
    rounded: '16px'
  },

  // Layout base
  layout: {
    sidebar: '280px',
    asymmetry: true,
    responsive: {
      mobile: '768px',
      tablet: '1024px'
    }
  },

  // Componentes base
  components: {
    sidebar: {
      width: '280px',
      background: 'rgba(21, 30, 46, 0.75)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.1)'
    },
    card: {
      background: 'rgba(21, 30, 46, 0.75)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
    },
    button: {
      background: '#00d084',
      color: '#0b1220',
      borderRadius: '8px',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      filter: 'drop-shadow(0 0 10px rgba(0, 208, 132, 0.4))'
    }
  },

  // Animaciones
  animations: {
    fadeInUp: {
      from: {
        opacity: 0,
        transform: 'translateY(30px)'
      },
      to: {
        opacity: 1,
        transform: 'translateY(0)'
      }
    }
  },

  // Utilidades
  utils: {
    // Crear componente con estilo G360
    createComponent: function (type: string, props: Record<string, unknown> = {}) {
      const baseStyles = {
        background: G360_ENGINE.colors.surface,
        borderRadius: G360_ENGINE.effects.rounded,
        padding: '1rem',
        transition: 'all 0.3s ease'
      }

      return { ...baseStyles, ...props }
    },

    // Aplicar skill a componente
    applySkill: function (component: G360ComponentStyles, skill: string) {
      const skillConfig = this.getSkillConfig(skill)
      return { ...component, ...skillConfig.styles }
    },

    // Obtener configuración de skill
    getSkillConfig: function (skill: string): G360Skill {
      const skills: Record<string, G360Skill> = {
        full: {
          name: 'G360 Full',
          styles: {
            background: 'rgba(21, 30, 46, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }
        },
        marca: {
          name: 'G360 Marca',
          styles: {
            background: 'rgba(21, 30, 46, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }
        },
        libre: {
          name: 'G360 Libre',
          styles: {
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: 'none',
            border: '1px solid #e5e7eb'
          }
        }
      }

      return skills[skill] || skills.full
    }
  }
}

// Exportar funciones útiles
export const createG360Component = (type: string, props: Record<string, unknown> = {}) => {
  return G360_ENGINE.utils.createComponent(type, props)
}

export const applyG360Skill = (component: G360ComponentStyles, skill: string) => {
  return G360_ENGINE.utils.applySkill(component, skill)
}