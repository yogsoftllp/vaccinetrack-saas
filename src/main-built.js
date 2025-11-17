// Simple React app entry point for development server
import App from './App-built.js';

// Mount the app
const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(React.createElement(React.StrictMode, null, React.createElement(App)))