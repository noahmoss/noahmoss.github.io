// src/App.tsx
import React from 'react';
import './App.css';
import CrosswordGrid from './components/CrosswordGrid';

function App() {
    return (
        <div className="App">
            <CrosswordGrid width={5} height={5} />
        </div>
    );
}

export default App;
