import React, { useState, useCallback } from 'react';
import './CrosswordGrid.css';

interface CrosswordGridProps {
  width: number;
  height: number;
}

interface Cell {
  filled: boolean;
  number: number | null;
}

enum Direction {
  Across,
  Down,
}

interface Cursor {
  row: number | null;
  col: number | null;
  direction: Direction;
}

const initialCells = (width: number, height: number) => {
  let num = 1;
  return Array.from({ length: height }, (_, rowIndex) => Array.from({ length: width }, (_, colIndex) => ({
    filled: false,
    number: (colIndex === 0 || rowIndex === 0) ? num++ : null,
  })));
}

const findWordBoundaries = (cells: Cell[][], row: number, col: number, direction: Direction) => {
    let start = direction === Direction.Across ? col : row;
    let end = start;
    const maxIndex = direction === Direction.Across ? cells[row].length : cells.length;

    // Search backwards to find the start of the word
    while (start > 0) {
        const checkCell = direction === Direction.Across ? cells[row][start - 1] : cells[start - 1][col];
        if (checkCell.filled) break;
        start--;
    }

    // Search forwards to find the end of the word
    while (end < maxIndex - 1) {
        const checkCell = direction === Direction.Across ? cells[row][end + 1] : cells[end + 1][col];
        if (checkCell.filled) break;
        end++;
    }

    return { start, end };
};

const CrosswordGrid = ({ width, height }: CrosswordGridProps) => {
  const [cells, setCells] = useState<Cell[][]>(initialCells(width, height));
  const [cursor, setCursor] = useState<Cursor | null>({row: null, col: null, direction: Direction.Across});

  const getClassName = (cell: Cell, rowIndex: number, colIndex: number) => {
    const classes = ['grid-cell'];
    if (cell.filled) classes.push('filled');

    if (cursor && cursor.row === rowIndex && cursor.col === colIndex) {
        classes.push('cursor');
    }

    if (cursor && cursor.row && cursor.col && !cell.filled) {
        const { start, end } = findWordBoundaries(cells, cursor.row, cursor.col, cursor.direction);

        if (cursor.direction === Direction.Across && cursor.row === rowIndex && colIndex >= start && colIndex <= end) {
            classes.push('cursor-across');
        }
        if (cursor.direction === Direction.Down && cursor.col === colIndex && rowIndex >= start && rowIndex <= end) {
            classes.push('cursor-down');
        }
    }

    return classes.join(' ');
};
  const handleCellClick = useCallback((event: React.MouseEvent<HTMLDivElement>, row: number, col: number) => {
    if (event.shiftKey) {
      setCells(prevCells => {
        const newCells = [...prevCells];
        newCells[row][col].filled = !newCells[row][col].filled;
        return newCells;
      });
    } else {
      if (!cells[row][col].filled) {
        setCursor(cursor && cursor.row === row && cursor.col === col ? null : {row, col, direction: cursor?.direction || Direction.Across});
      }
    }
  }, [cells, cursor]);

  return (
    <div className="grid">
      {cells.map((rowArray, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {rowArray.map((cell, colIndex) => (
            <div
              key={colIndex}
              className={getClassName(cell, rowIndex, colIndex)}
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
