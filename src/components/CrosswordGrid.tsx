import React, { useState, useCallback } from 'react';
import './CrosswordGrid.css';

interface CrosswordGridProps {
  width: number;
  height: number;
}

interface Cell {
  filled: boolean;
  number: number | null;
  letter: string | null;
}

enum Direction {
  Across,
  Down,
}

interface Cursor {
  row: number;
  col: number;
  direction: Direction;
}

const initialCells = (width: number, height: number) => {
  let num = 1;
  return Array.from({ length: height }, (_, rowIndex) => Array.from({ length: width }, (_, colIndex) => ({
    filled: false,
    number: (colIndex === 0 || rowIndex === 0) ? num++ : null,
    letter: null,
  })));
}

const isStartOfWord = (cells: Cell[][], rowIndex: number, colIndex: number) => {
  return !cells[rowIndex][colIndex].filled &&
    ((colIndex === 0 || cells[rowIndex][colIndex - 1].filled) ||
     (rowIndex === 0 || cells[rowIndex - 1][colIndex].filled));
}

const findWordBoundaries = (cells: Cell[][], row: number, col: number, direction: Direction) => {
  let start = direction === Direction.Across ? col : row;
  let end = start;
  const maxIndex = (direction === Direction.Across ? cells[row].length : cells.length) - 1;

  // Search backwards to find the start of the word
  while (start >= 0) {
    const checkCell = direction === Direction.Across ? cells[row][start] : cells[start][col];
    if (checkCell.filled) {
      start++;
      break;
    }
    if (start === 0) {
      break;
    }
    start--;
  }

  // Search forwards to find the end of the word
  while (end <= maxIndex) {
    const checkCell = direction === Direction.Across ? cells[row][end] : cells[end][col];
    if (checkCell.filled) {
      end--;
      break;
    }
    if (end === maxIndex) {
      break;
    }
    end++;
  }

  return { start, end };
};

// Given a cursor, returns the row and column of the start of the next word. Wraps around to the beginning of the grid if necessary.
const startOfNextWord = (cells: Cell[][], cursor: Cursor, searchDir: 'forwards' | 'backwards'): Cursor => {
  const { row, col, direction } = cursor;
  let currentRow = row;
  let currentCol = col;

  const height = cells.length;
  const width = cells[0].length;

  // Helper to check if the current cell is filled
  const isFilled = (r: number, c: number) => cells[r][c].filled;

  const advanceCol = () => {
    if (searchDir === 'forwards') currentCol++;
    else currentCol--;
  }

  const advanceRow = () => {
    if (searchDir === 'forwards') currentRow++;
    else currentRow--;
  }

  // Move to the next cell in the grid, respecting wrapping
  const moveNext = () => {
    if (direction === Direction.Across) {
      advanceCol();
      if (currentCol >= width) {
        currentCol = 0;
        advanceRow();
        if (currentRow >= height) {
          currentRow = 0;
        }
      } else if (currentCol < 0) {
        currentCol = width - 1;
        advanceRow();
        if (currentRow < 0) {
          currentRow = height - 1;
        }
      }
    } else { // Direction.Down
      advanceRow();
      if (currentRow >= height) {
        currentRow = 0;
        advanceCol();
        if (currentCol >= width) {
          currentCol = 0;
        }
      } else if (currentRow < 0) {
        currentRow = height - 1;
        advanceCol();
        if (currentCol < 0) {
          currentCol = width - 1;
        }
      }
    }
  };

  // Move to the next cell initially
  moveNext();

  // Skip past the end of the current word (until we hit a filled cell or grid boundary)
  while (!isFilled(currentRow, currentCol)) {
    moveNext();
    // Check if we have reached the end of a line or column
    if (direction === Direction.Across && currentCol === 0) break;
    if (direction === Direction.Down && currentRow === 0) break;
  }

  // Continue to the next unfilled cell, which is the start of the next word
  while (isFilled(currentRow, currentCol)) {
    moveNext();
    // If we reach the beginning of a line or column, stop if it's empty
    if (direction === Direction.Across && currentCol === 0 && !isFilled(currentRow, currentCol)) break;
    if (direction === Direction.Down && currentRow === 0 && !isFilled(currentRow, currentCol)) break;
  }

  return { row: currentRow, col: currentCol, direction };
};

const CrosswordGrid = ({ width, height }: CrosswordGridProps) => {
  const [cells, setCells] = useState<Cell[][]>(initialCells(width, height));
  const [cursor, setCursor] = useState<Cursor>({row: 0, col: 0, direction: Direction.Across});

  const getClassName = (cell: Cell, rowIndex: number, colIndex: number) => {
    const classes = ['grid-cell'];
    if (cell.filled) classes.push('filled');

    if (cursor && cursor.row === rowIndex && cursor.col === colIndex) {
      classes.push('cursor');
    }

    if (cursor && (cursor.row === rowIndex || cursor.col === colIndex) && !cell.filled) {
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

  const handleCellClick = useCallback((event: React.MouseEvent<HTMLDivElement>, row: number, col: number) => {
    if (event.shiftKey) {
      setCells(prevCells => {
        const newCells = prevCells.map(row => row.map(cell => ({ ...cell })));
        newCells[row][col].filled = !newCells[row][col].filled;
        return newCells;
      });
      updateNumbering();
    } else {
      // If the cell is not filled, set the cursor to the clicked cell.
      // If an existing cursor is clicked, toggle the direction.
      if (!cells[row][col].filled) {
        const clickedOnCursor = cursor && cursor.row === row && cursor.col === col;
        const newDirection = clickedOnCursor ? (cursor.direction === Direction.Across ? Direction.Down : Direction.Across) : cursor?.direction || Direction.Across;

        setCursor({row, col, direction: newDirection});

      }
    }
  }, [cells, cursor, updateNumbering]);

  const incrementCursor = useCallback(() => {
    setCursor(prevCursor => {
      const { end } = findWordBoundaries(cells, prevCursor.row, prevCursor.col, prevCursor.direction);
      if (prevCursor.direction === Direction.Across && prevCursor.col < end) {
        return {
          row: prevCursor.row,
          col: prevCursor.col + 1,
          direction: prevCursor.direction,
        }
      }
      if (prevCursor.direction === Direction.Down && prevCursor.row < end) {
        return {
          row: prevCursor.row + 1,
          col: prevCursor.col,
          direction: prevCursor.direction,
        }
      }
      return prevCursor;
    });
  }, [cells]);

  const handleKeyInput = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (/^[A-Z]$/.test(event.key.toUpperCase())) {
      if (cursor) {
        setCells(prevCells => {
          const newCells = prevCells.map(row => row.map(cell => ({ ...cell })));
          newCells[cursor.row][cursor.col].letter = event.key.toUpperCase();
          return newCells;
        });
      }
      incrementCursor();
    }

    if (event.code === 'Tab') {
      console.log('Tab');
      event.preventDefault();
      setCursor(prevCursor => {
        return startOfNextWord(cells, prevCursor, event.shiftKey ? "backwards" : "forwards");
      });
    }

    if (event.code === 'Space') {
      setCursor(prevCursor => {
        if (prevCursor) {
          return {...prevCursor, direction: prevCursor.direction === Direction.Across ? Direction.Down : Direction.Across};
        }
        return prevCursor;
      });
    }

    if (event.code === 'Backspace') {
      if (cursor) {
        const currentCell = cells[cursor.row][cursor.col];
        if (currentCell.letter) {
          // If there is a letter in the current cell, delete it and leave the cursor in place
          setCells(prevCells => {
            const newCells = prevCells.map(row => row.map(cell => ({ ...cell })));
            newCells[cursor.row][cursor.col].letter = null;
            return newCells;
          });
        } else {
          // If there is no letter, move back one cell
          const { start } = findWordBoundaries(cells, cursor.row, cursor.col, cursor.direction);
          if ((cursor.direction === Direction.Across && cursor.col === start) ||
              (cursor.direction === Direction.Down && cursor.row === start)) {
            // If at the start, move to the last letter of the previous word
            const prevCursor = startOfNextWord(cells, cursor, 'backwards');
            if (prevCursor) {
              const { end: prevEnd } = findWordBoundaries(cells, prevCursor.row, prevCursor.col, cursor.direction);
              setCursor({ row: prevCursor.row, col: prevCursor.col, direction: cursor.direction });
              setCells(prevCells => {
                const newCells = prevCells.map(row => row.map(cell => ({ ...cell })));
                if (cursor.direction === Direction.Across) {
                  newCells[prevCursor.row][prevEnd].letter = null;
                } else {
                  newCells[prevEnd][prevCursor.col].letter = null;
                }
                return newCells;
              });
            }
          } else {
            // Move back within the current word
            setCursor(prevCursor => {
              if (prevCursor) {
                if (cursor.direction === Direction.Across) {
                  return {...prevCursor, col: prevCursor.col - 1};
                } else {
                  return {...prevCursor, row: prevCursor.row - 1};
                }
              }
              return prevCursor;
            });
            setCells(prevCells => {
              const newCells = prevCells.map(row => row.map(cell => ({ ...cell })));
              if (cursor.direction === Direction.Across) {
                newCells[cursor.row][cursor.col - 1].letter = null;
              } else {
                newCells[cursor.row - 1][cursor.col].letter = null;
              }
              return newCells;
            });
          }
        }
      }
    }

    const { row, col, direction } = cursor || {};

    switch (event.code) {
      case 'ArrowUp':
        if (direction === Direction.Down) {
        setCursor({ ...cursor, row: row - 1 });
      } else if (direction === Direction.Across && row > 0 && !cells[row - 1][col].filled) {
        setCursor({ ...cursor, direction: Direction.Down });
      }
      break;
      case 'ArrowDown':
        if (direction === Direction.Down) {
        setCursor({ ...cursor, row: row + 1 });
      } else if (direction === Direction.Across && row < cells.length - 1 && !cells[row + 1][col].filled) {
        setCursor({ ...cursor, direction: Direction.Down });
      }
      break;
      case 'ArrowLeft':
        if (direction === Direction.Across) {
        setCursor({ ...cursor, col: col - 1 });
      } else if (direction === Direction.Down && col > 0 && !cells[row][col - 1].filled) {
        setCursor({ ...cursor, direction: Direction.Across });
      }
      break;
      case 'ArrowRight':
        if (direction === Direction.Across) {
        setCursor({ ...cursor, col: col + 1 });
      } else if (direction === Direction.Down && col < cells[0].length - 1 && !cells[row][col + 1].filled) {
        setCursor({ ...cursor, direction: Direction.Across });
      }
      break;
      default:
        break;
    }
  }, [cells, cursor, incrementCursor]);

  return (
    <div className="crossword-container">
      <div className="grid">
        {cells.map((rowArray, rowIndex) => (
          <div key={rowIndex} className="grid-row">
            {rowArray.map((cell, colIndex) => (
              <div
                tabIndex={-1}
                key={colIndex}
                className={getClassName(cell, rowIndex, colIndex)}
                onClick={(event) => handleCellClick(event, rowIndex, colIndex)}
                onKeyDown={handleKeyInput}
              >
                {cell.number !== null && <div className="cell-number">{cell.number}</div>}
                {cell.letter !== null && <div className="cell-letter">{cell.letter}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="clues-across">
        <h3>Across</h3>
        <ul>
          <li><span className="clue-number">1</span> City on Florida's Space Coast</li>
          <li><span className="clue-number">2</span> What we're doing for dinner.</li>
        </ul>
      </div>
      <div className="clues-down">
        <h3>Down</h3>
      </div>
    </div>
  );
};

export default CrosswordGrid;
