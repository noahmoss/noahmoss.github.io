// src/App.tsx
import React from 'react';
import './App.css';
import CrosswordGrid from './components/CrosswordGrid';

function App() {
    return (
        <div className="App">
            <header className="App-header">
                {/* Other components or content */}
                <CrosswordGrid width={5} height={5} />
            </header>
        </div>
    );
}

export default App;
