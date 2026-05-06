/**
 * Fichier de configuration centralisé pour l'API.
 * On utilise le port 3003 pour éviter le conflit avec Docker (qui utilise le 3000).
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://fulll-aadvh5h7hrhmdye2.francecentral-01.azurewebsites.net';

export default API_BASE_URL;
