// frontend/src/components/ErrorBoundary.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRefresh, faHome } from '@fortawesome/free-solid-svg-icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Met à jour l'état pour afficher l'UI de fallback au prochain rendu
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur pour le debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Ici vous pourriez envoyer l'erreur à un service de monitoring
    // comme Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Icône d'erreur */}
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                className="text-red-500 text-2xl" 
              />
            </div>

            {/* Message principal */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Oups ! Une erreur est survenue
            </h1>
            
            <p className="text-gray-600 mb-6 font-secondary">
              Nous sommes désolés, mais quelque chose s'est mal passé. 
              L'équipe technique a été notifiée.
            </p>

            {/* Détails de l'erreur en mode développement */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 font-secondary">
                  Détails techniques (dev mode)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Erreur:</strong> {this.state.error && this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Stack trace:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg hover:bg-orange-600 transition font-secondary flex items-center justify-center space-x-2"
              >
                <FontAwesomeIcon icon={faRefresh} />
                <span>Recharger la page</span>
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition font-secondary flex items-center justify-center space-x-2"
              >
                <FontAwesomeIcon icon={faHome} />
                <span>Retour à l'accueil</span>
              </button>
            </div>

            {/* Informations de contact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 font-secondary">
                Si le problème persiste, contactez-nous à{' '}
                <a 
                  href="mailto:support@plateforme.com" 
                  className="text-orange-500 hover:text-orange-600"
                >
                  support@plateforme.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;