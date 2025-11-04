import React, { useState } from 'react';
import { Column, TableData, FormatConfig } from '../types';
import './DataTable.css';

interface DataTableProps {
  columns: Column[];
  data: TableData[];
  allData: TableData[];
  formatConfig: FormatConfig;
  onEditCell: (rowId: string, columnId: string, value: any) => void;
  onDeleteRow: (rowId: string) => void;
  onColumnsUpdate: (columns: Column[]) => void;
  onReorderRows: (data: TableData[]) => void;
  isFiltered: boolean;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  allData,
  formatConfig,
  onEditCell,
  onDeleteRow,
  onColumnsUpdate,
  onReorderRows,
  isFiltered,
  sortColumn,
  sortDirection,
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; col: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const [dragOverRow, setDragOverRow] = useState<number | null>(null);

  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);

  const handleCellDoubleClick = (rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, col: columnId });
    setEditValue(String(currentValue || ''));
  };

  const handleCellBlur = () => {
    if (editingCell) {
      onEditCell(editingCell.rowId, editingCell.col, editValue);
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedRow(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRow(index);
  };

  const handleDragLeave = () => {
    setDragOverRow(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedRow === null || draggedRow === dropIndex) {
      setDraggedRow(null);
      setDragOverRow(null);
      return;
    }

    const newData = [...data];
    const [draggedItem] = newData.splice(draggedRow, 1);
    newData.splice(dropIndex, 0, draggedItem);

    onReorderRows(newData);
    setDraggedRow(null);
    setDragOverRow(null);
  };

  const handleDragEnd = () => {
    setDraggedRow(null);
    setDragOverRow(null);
  };

  if (columns.length === 0) {
    return (
      <div className="data-table-container">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="16" width="48" height="36" rx="2" stroke="#D1D5DB" strokeWidth="2"/>
            <line x1="8" y1="24" x2="56" y2="24" stroke="#D1D5DB" strokeWidth="2"/>
            <line x1="24" y1="24" x2="24" y2="52" stroke="#D1D5DB" strokeWidth="2"/>
            <line x1="40" y1="24" x2="40" y2="52" stroke="#D1D5DB" strokeWidth="2"/>
          </svg>
          <h3>No hay datos para mostrar</h3>
          <p>Importa un archivo CSV para comenzar</p>
        </div>
      </div>
    );
  }

  const tableStyle: React.CSSProperties = {
    fontSize: `${formatConfig.fontSize}px`,
    borderCollapse: 'collapse',
  };

  const getHeaderStyle = (column: Column): React.CSSProperties => {
    return {
      backgroundColor: formatConfig.headerBgColor,
      color: formatConfig.headerTextColor,
      textAlign: column.alignment || 'left',
      padding: `${formatConfig.padding}px`,
      width: column.width ? `${column.width}px` : 'auto',
      border: formatConfig.showBorders 
        ? `${formatConfig.borderWidth}px solid ${formatConfig.borderColor}`
        : 'none',
    };
  };

  const getCellStyle = (rowIndex: number, column: Column): React.CSSProperties => {
    const isAlternate = formatConfig.alternateRows && rowIndex % 2 === 1;
    
    return {
      backgroundColor: isAlternate ? formatConfig.alternateRowBgColor : formatConfig.rowBgColor,
      textAlign: column.alignment || 'left',
      padding: `${formatConfig.padding}px`,
      border: formatConfig.showBorders 
        ? `${formatConfig.borderWidth}px solid ${formatConfig.borderColor}`
        : 'none',
    };
  };

  return (
    <div className="data-table-container">
      <div className="table-wrapper">
        <table className="data-table" style={tableStyle}>
          <thead>
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  style={getHeaderStyle(column)}
                >
                  {column.name}
                </th>
              ))}
              <th style={getHeaderStyle({ alignment: 'center' } as Column)}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="no-data-cell">
                  No hay filas. Haz clic en "Nueva fila" para agregar datos.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = row._rowId || `row_${rowIndex}`;
                const isDragging = draggedRow === rowIndex;
                const isDragOver = dragOverRow === rowIndex;
                
                const canDrag = !isFiltered && !sortColumn;
                
                return (
                  <tr 
                    key={rowId}
                    draggable={canDrag}
                    onDragStart={(e) => canDrag && handleDragStart(e, rowIndex)}
                    onDragOver={(e) => canDrag && handleDragOver(e, rowIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => canDrag && handleDrop(e, rowIndex)}
                    onDragEnd={handleDragEnd}
                    className={`${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                    title={
                      isFiltered 
                        ? "Limpia la búsqueda para reordenar" 
                        : sortColumn 
                          ? "Quita el ordenamiento para reordenar manualmente"
                          : "Arrastra la fila para reordenar"
                    }
                  >
                    {visibleColumns.map((column) => {
                      const isEditing = editingCell?.rowId === rowId && editingCell?.col === column.id;
                      const cellValue = row[column.id];

                      return (
                        <td
                          key={column.id}
                          style={getCellStyle(rowIndex, column)}
                          onDoubleClick={() => handleCellDoubleClick(rowId, column.id, cellValue)}
                          className="table-cell"
                        >
                          {isEditing ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={handleCellBlur}
                              onKeyDown={handleKeyDown}
                              autoFocus
                              className="cell-input"
                            />
                          ) : (
                            <span>{String(cellValue || '')}</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={getCellStyle(rowIndex, visibleColumns[0])} className="actions-cell">
                      <button
                        className="delete-button"
                        onClick={() => onDeleteRow(rowId)}
                        title="Eliminar fila"
                      >
                        <img src="/img/trash-icon.png" alt="Eliminar" width="16" height="16" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="table-footer">
          <span className="table-info">
            Mostrando {data.length} {data.length === 1 ? 'fila' : 'filas'}
            {isFiltered && ` de ${allData.length}`} · {visibleColumns.length} {visibleColumns.length === 1 ? 'columna' : 'columnas'}
            {sortColumn && (
              <span className="sort-indicator">
                · Ordenado por {columns.find(c => c.id === sortColumn)?.name} {sortDirection === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </span>
          <span className="table-hint">
            {isFiltered 
              ? '🔍 Búsqueda activa · Limpia para reordenar filas'
              : sortColumn 
                ? '💡 Doble clic para editar · Ordenamiento activo'
                : '💡 Doble clic para editar · Arrastra para reordenar'
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default DataTable;
