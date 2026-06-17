export const G360_SKILL_CONFIG = {
  activeSkill: 'marca',

  skills: {
    full: {
      name: 'G360 Full',
      description: 'Proyectos web profesionales',
      author: 'Carlos Cusi',
      signature: 'CCUSI',
      brand: 'G360',
      colors: {
        bg: '#0b1220',
        surface: '#151e2e',
        accent: '#00d084',
        text: '#f0f4f8',
        muted: '#94a3b8'
      },
      effects: {
        glassmorphism: true,
        blur: '16px',
        glow: true,
        rounded: '16px'
      },
      layout: {
        sidebar: '280px',
        asymmetry: true
      },
      branding: {
        logo: 'large',
        logoPosition: 'header',
        signature: 'prominent',
        signaturePosition: ['header', 'footer']
      },
      technology: {
        type: 'web',
        framework: 'react/vue',
        deploy: 'github-pages'
      }
    },

    marca: {
      name: 'CIPSA OrderX',
      description: 'Traductor de RPE - CIPSA',
      author: 'Carlos Cusi',
      signature: 'CCUSI',
      brand: 'G360',
      colors: {
        bg: '#0b1220',
        surface: '#151e2e',
        accent: '#00d084',
        text: '#f0f4f8',
        muted: '#94a3b8'
      },
      effects: {
        glassmorphism: true,
        blur: '16px',
        glow: true,
        rounded: '16px'
      },
      layout: {
        sidebar: '280px',
        asymmetry: true
      },
      branding: {
        clientName: 'CIPSA',
        clientLogo: 'large',
        clientLogoFile: '/logo-cipsa.svg',
        clientFavicon: '/favicon.svg',
        g360Badge: 'powered by G360',
        g360Logo: 'small',
        g360Position: 'header-secondary',
        signature: 'footer-small',
        signatureText: 'Engine by Carlos Cusi (CCUSI)'
      },
      technology: {
        type: 'web',
        framework: 'react/vue',
        deploy: 'github-pages'
      }
    },

    libre: {
      name: 'G360 Libre',
      description: 'Herramientas libres',
      author: 'Carlos Cusi',
      signature: 'optional',
      brand: 'none',
      colors: {
        bg: '#ffffff',
        surface: '#ffffff',
        accent: '#2563eb',
        text: '#1f2937',
        muted: '#6b7280'
      },
      effects: {
        glassmorphism: false,
        blur: '0px',
        glow: false,
        rounded: '8px'
      },
      layout: {
        type: 'flexible',
        sidebar: '0px'
      },
      branding: {
        logo: 'none',
        signature: 'optional',
        signaturePosition: ['about'],
        credit: 'Carlos Cusi'
      },
      technology: {
        type: 'desktop',
        framework: 'python/vba',
        deploy: 'release'
      }
    }
  },

  methods: {
    getActiveConfig: () => {
      return G360_SKILL_CONFIG.skills[G360_SKILL_CONFIG.activeSkill]
    },

    setActiveSkill: (skill) => {
      if (G360_SKILL_CONFIG.skills[skill]) {
        G360_SKILL_CONFIG.activeSkill = skill
        return true
      }
      return false
    },

    isValidSkill: (skill) => {
      return !!G360_SKILL_CONFIG.skills[skill]
    },

    getAllSkills: () => {
      return Object.keys(G360_SKILL_CONFIG.skills)
    }
  }
}

export const getSkillConfig = (skill) => {
  return G360_SKILL_CONFIG.skills[skill] || G360_SKILL_CONFIG.skills.full
}

export const setActiveSkill = (skill) => {
  return G360_SKILL_CONFIG.methods.setActiveSkill(skill)
}

export const getActiveSkill = () => {
  return G360_SKILL_CONFIG.activeSkill
}

export const isValidSkill = (skill) => {
  return G360_SKILL_CONFIG.methods.isValidSkill(skill)
}

export const getAllSkills = () => {
  return G360_SKILL_CONFIG.methods.getAllSkills()
}
