import React, { useState, useCallback, useEffect } from 'react';
import './CrosswordGrid.css';

interface CrosswordGridProps {
  width: number;
  height: number;
}

interface Cell {
  filled: boolean;
  number: number | null;
}

interface Cursor {
  row: number;
  col: number;
}

const CrosswordGrid = ({ width, height }: CrosswordGridProps) => {
  const [cells, setCells] = useState<Cell[][]>(() =>
    Array.from({ length: height }, () => Array.from({ length: width }, () => ({
      filled: false,
      number: null
    })))
  );

  const [cursor, setCursor] = useState<Cursor | null>();

  // Is the cell at the given row and column the start of a word?
  const isStartOfWord = (cells: Cell[][], rowIndex: number, colIndex: number) => {
    return !cells[rowIndex][colIndex].filled &&
      ((colIndex === 0 || cells[rowIndex][colIndex - 1].filled) ||
        (rowIndex === 0 || cells[rowIndex - 1][colIndex].filled));
  }

  // Recomputes the numbering of the cells based on where each word starts, and updates the state
  const updateNumbering = useCallback(() => {
    setCells(prevCells => {
      let num = 1;
      return prevCells.map((rowArray, rowIndex) =>
        rowArray.map((cell, colIndex) => {
          if (isStartOfWord(prevCells, rowIndex, colIndex)) {
            return { ...cell, number: num++ };
          }
          return { ...cell, number: null };
        })
      );
    });
  }, []);

  useEffect(() => {
    updateNumbering();
  }, [updateNumbering]);

  const handleCellClick = useCallback((event: React.MouseEvent<HTMLDivElement>, row: number, col: number) => {
    if (event.shiftKey) {
      setCells(prevCells => {
        const newCells = prevCells.map((rowArray, rowIndex) =>
          rowArray.map((cell, colIndex) => {
            if (rowIndex === row && colIndex === col) {
              return { ...cell, filled: !cell.filled };
            }
            return cell;
          })
        );
        return newCells;
      });
      updateNumbering();
    }
    else {

    }
  }, [updateNumbering]);

  return (
    <div className="grid">
      {cells.map((rowArray, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {rowArray.map((cell, colIndex) => (
            <div
              key={colIndex}
              className={`grid-cell ${cell.filled ? 'filled' : ''}`}
              onClick={(event) => handleCellClick(event, rowIndex, colIndex)}
            >
              {cell.number !== null && <div className="cell-number">{cell.number}</div>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default CrosswordGrid;
