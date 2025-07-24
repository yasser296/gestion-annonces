// tailwind.config.js - Configuration mise à jour avec les polices
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      // NOUVEAU: Configuration des polices personnalisées
      fontFamily: {
        'primary': ['Lora', 'Georgia', 'serif'], // Police principale pour le contenu
        'secondary': ['Inter', 'system-ui', '-apple-system', 'sans-serif'], // Police pour l'interface
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'serif': ['Lora', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace']
      },
      
      // Couleurs personnalisées de votre plateforme
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Couleur principale orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      
      // Espacement personnalisé
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Animations personnalisées
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      },
      
      // Ombres personnalisées
      boxShadow: {
        'gentle': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'strong': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(249, 115, 22, 0.3)',
      },
      
      // Bordures arrondies personnalisées
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [
    // Plugin pour les formulaires
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    
    // Plugin personnalisé pour les utilitaires de police
    function({ addUtilities }) {
      const newUtilities = {
        '.font-primary': {
          fontFamily: 'Lora, Georgia, serif',
        },
        '.font-secondary': {
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        },
        '.text-balance': {
          textWrap: 'balance',
        },
        '.text-pretty': {
          textWrap: 'pretty',
        }
      }
      addUtilities(newUtilities)
    },
    
    // Plugin personnalisé pour les composants
    function({ addComponents }) {
      const components = {
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem 1.25rem',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontWeight: '500',
          borderRadius: '0.5rem',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
        },
        
        '.btn-primary': {
          backgroundColor: '#f97316',
          color: 'white',
          '&:hover': {
            backgroundColor: '#ea580c',
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          '&:focus': {
            boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.3)',
          }
        },
        
        '.btn-secondary': {
          backgroundColor: '#e5e7eb',
          color: '#1f2937',
          '&:hover': {
            backgroundColor: '#d1d5db',
          }
        },
        
        '.card': {
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }
        },
        
        '.input-field': {
          width: '100%',
          padding: '0.75rem 1rem',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          border: '2px solid #e5e7eb',
          borderRadius: '0.5rem',
          transition: 'all 0.2s ease',
          fontSize: '0.95rem',
          '&:focus': {
            borderColor: '#f97316',
            boxShadow: '0 0 0 3px rgba(249, 115, 22, 0.1)',
            outline: 'none',
          }
        },
        
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.25rem 0.75rem',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontSize: '0.75rem',
          fontWeight: '500',
          borderRadius: '9999px',
          transition: 'all 0.2s ease',
        },
        
        '.modal': {
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '50',
          padding: '1rem',
        },
        
        '.modal-content': {
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: 'scale(0.95)',
          transition: 'transform 0.2s ease',
        },
        
        '.modal.show .modal-content': {
          transform: 'scale(1)',
        }
      }
      addComponents(components)
    }
  ],
}