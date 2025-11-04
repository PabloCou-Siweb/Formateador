import React, { useState } from 'react';
import './App.css';
import { Column, TableData, FormatConfig } from './types';
import Toolbar from './components/Toolbar';
import DataTable from './components/DataTable';
import SettingsPanel from './components/SettingsPanel';

const App: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [data, setData] = useState<TableData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formatConfig, setFormatConfig] = useState<FormatConfig>({
    fontSize: 14,
    headerBgColor: '#f3f4f6',
    headerTextColor: '#374151',
    rowBgColor: '#ffffff',
    alternateRowBgColor: '#f9fafb',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    padding: 12,
    showBorders: false,
    alternateRows: true,
  });

  const handleDataImport = (importedColumns: Column[], importedData: TableData[]) => {
    // Los IDs ya vienen asignados desde ImportModal
    setColumns(importedColumns);
    setData(importedData);
  };

  const handleAddRow = () => {
    if (columns.length === 0) {
      alert('Primero debes tener al menos una columna. Ve a Configurar → Columnas → Añadir Columna');
      return;
    }
    const newRow: TableData = {
      _rowId: `row_${Date.now()}`
    };
    columns.forEach(col => {
      newRow[col.id] = '';
    });
    setData([...data, newRow]);
  };

  const handleDeleteRow = (rowId: string) => {
    setData(data.filter(row => row._rowId !== rowId));
  };

  const handleEditCell = (rowId: string, columnId: string, value: any) => {
    const newData = data.map(row => {
      if (row._rowId === rowId) {
        return { ...row, [columnId]: value };
      }
      return row;
    });
    setData(newData);
  };

  const handleColumnsUpdate = (updatedColumns: Column[]) => {
    const oldColumnIds = columns.map(col => col.id);
    const newColumnIds = updatedColumns.map(col => col.id);
    
    // Verificar si se agregó una columna nueva
    const addedColumns = newColumnIds.filter(id => !oldColumnIds.includes(id));
    
    // Verificar si se eliminó una columna
    const removedColumns = oldColumnIds.filter(id => !newColumnIds.includes(id));
    
    // Actualizar datos
    let updatedData = [...data];
    
    // Agregar columnas nuevas a los datos existentes (con valores vacíos)
    if (addedColumns.length > 0) {
      updatedData = updatedData.map((row, index) => {
        const newRow = { ...row };
        // Asegurar que tiene rowId
        if (!newRow._rowId) {
          newRow._rowId = `row_${Date.now()}_${index}`;
        }
        addedColumns.forEach(colId => {
          newRow[colId] = '';
        });
        return newRow;
      });
    }
    
    // Eliminar columnas de los datos
    if (removedColumns.length > 0) {
      updatedData = updatedData.map((row, index) => {
        const newRow = { ...row };
        // Asegurar que tiene rowId
        if (!newRow._rowId) {
          newRow._rowId = `row_${Date.now()}_${index}`;
        }
        removedColumns.forEach(colId => {
          delete newRow[colId];
        });
        return newRow;
      });
    }
    
    setColumns(updatedColumns);
    setData(updatedData);
  };

  const handleFormatUpdate = (updatedFormat: FormatConfig) => {
    setFormatConfig(updatedFormat);
  };

  const handleReorderRows = (reorderedData: TableData[]) => {
    setData(reorderedData);
    // Limpiar ordenamiento al reordenar manualmente
    setSortColumn(null);
  };

  const handleSort = (columnId: string | null, direction: 'asc' | 'desc') => {
    setSortColumn(columnId);
    setSortDirection(direction);

    if (!columnId) {
      // Restablecer orden original (por _rowId o importación)
      return;
    }

    const sorted = [...data].sort((a, b) => {
      const aVal = a[columnId];
      const bVal = b[columnId];

      // Manejar valores vacíos
      if (aVal === '' || aVal === null || aVal === undefined) return 1;
      if (bVal === '' || bVal === null || bVal === undefined) return -1;

      // Intentar convertir a número para comparación numérica
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        // Comparación numérica
        return direction === 'asc' ? aNum - bNum : bNum - aNum;
      } else {
        // Comparación alfabética
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (direction === 'asc') {
          return aStr > bStr ? 1 : -1;
        } else {
          return aStr < bStr ? 1 : -1;
        }
      }
    });

    setData(sorted);
  };

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return columns.some(col => {
      const value = String(row[col.id] || '').toLowerCase();
      return value.includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="app">
      <header className="app-header">
        <h1>Formateador de Tablas</h1>
      </header>

      <div className="app-container">
        <Toolbar
          onImport={handleDataImport}
          onAddRow={handleAddRow}
          onSearch={setSearchTerm}
          onToggleSettings={() => setShowSettings(!showSettings)}
          columns={columns}
          data={data}
          formatConfig={formatConfig}
          hasData={data.length > 0}
        />

        <div className="main-content">
          <DataTable
            columns={columns}
            data={searchTerm ? filteredData : data}
            allData={data}
            formatConfig={formatConfig}
            onEditCell={handleEditCell}
            onDeleteRow={handleDeleteRow}
            onColumnsUpdate={handleColumnsUpdate}
            onReorderRows={handleReorderRows}
            isFiltered={!!searchTerm}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
          />

          <SettingsPanel
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            columns={columns}
            formatConfig={formatConfig}
            onColumnsUpdate={handleColumnsUpdate}
            onFormatUpdate={handleFormatUpdate}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        </div>
      </div>
    </div>
  );
};

export default App;

