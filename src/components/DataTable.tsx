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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [headerEditValue, setHeaderEditValue] = useState<string>('');
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const rowsPerPage = 30;

  const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);

  // Calcular datos paginados
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, data.length);
  const paginatedData = data.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambian los datos
  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const handleCellDoubleClick = (rowId: string, columnId: string, currentValue: any) => {
    setEditingCell({ rowId, col: columnId });
    setEditValue(String(currentValue || ''));
  };

  const handleHeaderDoubleClick = (column: Column) => {
    setEditingHeader(column.id);
    setHeaderEditValue(column.name);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      onEditCell(editingCell.rowId, editingCell.col, editValue);
      setEditingCell(null);
    }
  };

  const commitHeaderEdit = () => {
    if (!editingHeader) return;

    const originalColumn = columns.find(col => col.id === editingHeader);
    if (!originalColumn) {
      setEditingHeader(null);
      return;
    }

    const trimmedValue = headerEditValue.trim();

    if (!trimmedValue) {
      setHeaderEditValue(originalColumn.name);
      setEditingHeader(null);
      return;
    }

    if (trimmedValue === originalColumn.name) {
      setEditingHeader(null);
      return;
    }

    const updatedColumns = columns.map(col =>
      col.id === editingHeader ? { ...col, name: trimmedValue } : col
    );

    onColumnsUpdate(updatedColumns);
    setEditingHeader(null);
  };

  const handleHeaderBlur = () => {
    commitHeaderEdit();
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitHeaderEdit();
    } else if (e.key === 'Escape') {
      if (editingHeader) {
        const originalColumn = columns.find(col => col.id === editingHeader);
        if (originalColumn) {
          setHeaderEditValue(originalColumn.name);
        }
      }
      setEditingHeader(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleHeaderDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    setDragOverColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleHeaderDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedColumn && columnId !== draggedColumn) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumn(columnId);
    }
  };

  const handleHeaderDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleHeaderDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
    const visibleColumnIds = sortedColumns.filter(col => col.visible).map(col => col.id);

    const fromIndex = visibleColumnIds.indexOf(draggedColumn);
    const toIndex = visibleColumnIds.indexOf(targetColumnId);

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const updatedVisibleIds = [...visibleColumnIds];
    const [movedId] = updatedVisibleIds.splice(fromIndex, 1);
    updatedVisibleIds.splice(toIndex, 0, movedId);

    const hiddenColumns = sortedColumns.filter(col => !col.visible);
    const reorderedColumns = [
      ...updatedVisibleIds.map(id => sortedColumns.find(col => col.id === id)).filter(Boolean) as Column[],
      ...hiddenColumns,
    ];

    const updatedColumns = reorderedColumns.map((col, index) => ({
      ...col,
      order: index,
    }));

    onColumnsUpdate(updatedColumns);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleHeaderDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
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

  const canDragHeaders = !editingHeader && visibleColumns.length > 1;

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
                  onDoubleClick={() => handleHeaderDoubleClick(column)}
                  className={[
                    'editable-header',
                    editingHeader === column.id ? 'is-editing' : '',
                    draggedColumn === column.id ? 'is-dragging' : '',
                    dragOverColumn === column.id && draggedColumn !== column.id ? 'is-drag-over' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  draggable={canDragHeaders}
                  onDragStart={(e) => canDragHeaders && handleHeaderDragStart(e, column.id)}
                  onDragOver={(e) => canDragHeaders && handleHeaderDragOver(e, column.id)}
                  onDragLeave={() => canDragHeaders && handleHeaderDragLeave()}
                  onDrop={(e) => canDragHeaders && handleHeaderDrop(e, column.id)}
                  onDragEnd={() => canDragHeaders && handleHeaderDragEnd()}
                >
                  {editingHeader === column.id ? (
                    <input
                      type="text"
                      value={headerEditValue}
                      onChange={(e) => setHeaderEditValue(e.target.value)}
                      onBlur={handleHeaderBlur}
                      onKeyDown={handleHeaderKeyDown}
                      autoFocus
                      className="header-input"
                    />
                  ) : (
                    <span>{column.name}</span>
                  )}
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
              paginatedData.map((row, relativeIndex) => {
                const rowIndex = startIndex + relativeIndex;
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
          <div className="footer-left">
            <span className="table-info">
              Mostrando {startIndex + 1}-{endIndex} de {data.length} {data.length === 1 ? 'fila' : 'filas'}
              {isFiltered && ` (filtradas de ${allData.length})`} · {visibleColumns.length} {visibleColumns.length === 1 ? 'columna' : 'columnas'}
              {sortColumn && (
                <span className="sort-indicator">
                  · Ordenado por {columns.find(c => c.id === sortColumn)?.name} {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </span>
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Primera página"
              >
                ««
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                title="Anterior"
              >
                ‹
              </button>
              
              <span className="pagination-info">
                Página {currentPage} de {totalPages}
              </span>
              
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                title="Siguiente"
              >
                ›
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Última página"
              >
                »»
              </button>
            </div>
          )}
          
          <span className="table-hint">
            {isFiltered 
              ? '🔍 Búsqueda activa'
              : sortColumn 
                ? '💡 Doble clic para editar'
                : '💡 Arrastra filas para reordenar'
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default DataTable;
