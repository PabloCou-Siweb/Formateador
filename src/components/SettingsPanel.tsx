import React, { useState } from 'react';
import { Column, FormatConfig } from '../types';
import './SettingsPanel.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  formatConfig: FormatConfig;
  onColumnsUpdate: (columns: Column[]) => void;
  onFormatUpdate: (config: FormatConfig) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnId: string | null, direction: 'asc' | 'desc') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  columns,
  formatConfig,
  onColumnsUpdate,
  onFormatUpdate,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  const [activeSection, setActiveSection] = useState<'columns' | 'format'>('columns');

  const handleColumnChange = (id: string, field: keyof Column, value: any) => {
    const updated = columns.map(col =>
      col.id === id ? { ...col, [field]: value } : col
    );
    onColumnsUpdate(updated);
  };

  const handleMoveColumn = (id: string, direction: 'up' | 'down') => {
    const index = columns.findIndex(col => col.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === columns.length - 1)
    ) {
      return;
    }

    const newColumns = [...columns];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];
    
    const updated = newColumns.map((col, idx) => ({ ...col, order: idx }));
    onColumnsUpdate(updated);
  };

  const handleAddColumn = () => {
    const newColumnId = `col_${Date.now()}`;
    const newColumn: Column = {
      id: newColumnId,
      name: `Nueva Columna ${columns.length + 1}`,
      type: 'text',
      visible: true,
      order: columns.length,
      alignment: 'left',
    };
    
    const updated = [...columns, newColumn];
    onColumnsUpdate(updated);
  };

  const handleDeleteColumn = (id: string) => {
    if (columns.length === 1) {
      alert('No puedes eliminar la última columna');
      return;
    }
    
    const confirmed = window.confirm('¿Estás seguro de eliminar esta columna? Se perderán los datos de esta columna.');
    if (!confirmed) return;
    
    const updated = columns.filter(col => col.id !== id).map((col, idx) => ({ ...col, order: idx }));
    onColumnsUpdate(updated);
  };

  const handleFormatChange = (field: keyof FormatConfig, value: any) => {
    onFormatUpdate({ ...formatConfig, [field]: value });
  };

  const presetStyles = [
    {
      name: 'Claro',
      config: {
        headerBgColor: '#f3f4f6',
        headerTextColor: '#374151',
        rowBgColor: '#ffffff',
        alternateRowBgColor: '#f9fafb',
        borderColor: '#e5e7eb',
        showBorders: false,
      },
    },
    {
      name: 'Azul',
      config: {
        headerBgColor: '#3b82f6',
        headerTextColor: '#ffffff',
        rowBgColor: '#ffffff',
        alternateRowBgColor: '#eff6ff',
        borderColor: '#93c5fd',
        showBorders: false,
      },
    },
    {
      name: 'Verde',
      config: {
        headerBgColor: '#10b981',
        headerTextColor: '#ffffff',
        rowBgColor: '#ffffff',
        alternateRowBgColor: '#ecfdf5',
        borderColor: '#6ee7b7',
        showBorders: false,
      },
    },
    {
      name: 'Con Bordes',
      config: {
        headerBgColor: '#1e293b',
        headerTextColor: '#ffffff',
        rowBgColor: '#ffffff',
        alternateRowBgColor: '#f8fafc',
        borderColor: '#cbd5e1',
        showBorders: true,
        borderWidth: 1,
      },
    },
  ];

  const applyPreset = (preset: any) => {
    onFormatUpdate({ ...formatConfig, ...preset.config });
  };

  const resetFormat = () => {
    const defaultConfig: FormatConfig = {
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
    };
    onFormatUpdate(defaultConfig);
  };

  return (
    <>
      {isOpen && <div className="settings-overlay" onClick={onClose} />}
      
      <div className={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div className="settings-header">
          <h2>Configuración</h2>
          <button className="close-button" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeSection === 'columns' ? 'active' : ''}`}
            onClick={() => setActiveSection('columns')}
          >
            Columnas
          </button>
          <button
            className={`settings-tab ${activeSection === 'format' ? 'active' : ''}`}
            onClick={() => setActiveSection('format')}
          >
            Formato
          </button>
        </div>

        <div className="settings-content">
          {activeSection === 'columns' && (
            <div className="section">
              <div className="section-header">
                <h3>Columnas de la Tabla</h3>
                <button className="add-column-button" onClick={handleAddColumn}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                    <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Añadir Columna
                </button>
              </div>

              {columns.length === 0 ? (
                <div className="empty-message">
                  <p>No hay columnas configuradas. Importa datos primero.</p>
                </div>
              ) : (
                <>
                  <div className="sort-section">
                    <div className="sort-header">
                      <h4>Ordenar Filas</h4>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={!!sortColumn}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Activar con la primera columna visible
                              const firstCol = columns.find(col => col.visible);
                              if (firstCol) onSort(firstCol.id, sortDirection);
                            } else {
                              // Desactivar
                              onSort(null, sortDirection);
                            }
                          }}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    
                    {sortColumn && (
                      <div className="sort-controls">
                        <div className="sort-control-group">
                          <label>Ordenar por:</label>
                          <select
                            className="sort-select"
                            value={sortColumn}
                            onChange={(e) => onSort(e.target.value, sortDirection)}
                          >
                            {columns.filter(col => col.visible).map(col => (
                              <option key={col.id} value={col.id}>{col.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="sort-control-group">
                          <label>Dirección:</label>
                          <div className="sort-direction-buttons">
                            <button
                              className={`sort-dir-btn ${sortDirection === 'asc' ? 'active' : ''}`}
                              onClick={() => onSort(sortColumn, 'asc')}
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                <path d="M10 17V3M5 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              A-Z / 0-9
                            </button>
                            <button
                              className={`sort-dir-btn ${sortDirection === 'desc' ? 'active' : ''}`}
                              onClick={() => onSort(sortColumn, 'desc')}
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                <path d="M10 3v14M5 12l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Z-A / 9-0
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="columns-list">
                  {columns.map((column, index) => (
                    <div key={column.id} className="column-item">
                      <div className="column-header">
                        <input
                          type="text"
                          value={column.name}
                          onChange={(e) => handleColumnChange(column.id, 'name', e.target.value)}
                          className="column-name-input"
                        />
                        <div className="column-actions">
                          <button
                            className="icon-btn"
                            onClick={() => handleMoveColumn(column.id, 'up')}
                            disabled={index === 0}
                            title="Mover arriba"
                          >
                            ↑
                          </button>
                          <button
                            className="icon-btn"
                            onClick={() => handleMoveColumn(column.id, 'down')}
                            disabled={index === columns.length - 1}
                            title="Mover abajo"
                          >
                            ↓
                          </button>
                          <button
                            className="icon-btn delete-btn"
                            onClick={() => handleDeleteColumn(column.id)}
                            title="Eliminar columna"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="column-options">
                        <div className="option-row">
                          <label>Alineación:</label>
                          <select
                            value={column.alignment || 'left'}
                            onChange={(e) => handleColumnChange(column.id, 'alignment', e.target.value)}
                            className="select-input"
                          >
                            <option value="left">Izquierda</option>
                            <option value="center">Centro</option>
                            <option value="right">Derecha</option>
                          </select>
                        </div>

                        <div className="option-row">
                          <label>Ancho (px):</label>
                          <input
                            type="number"
                            value={column.width || ''}
                            onChange={(e) => handleColumnChange(column.id, 'width', parseInt(e.target.value) || undefined)}
                            placeholder="Auto"
                            className="number-input"
                            min="50"
                          />
                        </div>

                        <div className="option-row checkbox-row">
                          <label>
                            <input
                              type="checkbox"
                              checked={column.visible}
                              onChange={(e) => handleColumnChange(column.id, 'visible', e.target.checked)}
                            />
                            <span>Visible</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeSection === 'format' && (
            <div className="section">
              <div className="format-section">
                <div className="section-header">
                  <h3>Estilos Predefinidos</h3>
                  <button className="reset-button" onClick={resetFormat} title="Restablecer formato">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <path d="M1 4v6h6M19 16v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m18 0l-4.64 4.36A9 9 0 0 1 0.51 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Restablecer
                  </button>
                </div>
                <div className="presets">
                  {presetStyles.map((preset) => (
                    <button
                      key={preset.name}
                      className="preset-btn"
                      onClick={() => applyPreset(preset)}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="format-section">
                <h3>Encabezado</h3>
                <div className="color-option">
                  <label>Color de fondo:</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={formatConfig.headerBgColor}
                      onChange={(e) => handleFormatChange('headerBgColor', e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={formatConfig.headerBgColor}
                      onChange={(e) => handleFormatChange('headerBgColor', e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>
                <div className="color-option">
                  <label>Color de texto:</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={formatConfig.headerTextColor}
                      onChange={(e) => handleFormatChange('headerTextColor', e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={formatConfig.headerTextColor}
                      onChange={(e) => handleFormatChange('headerTextColor', e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>
              </div>

              <div className="format-section">
                <h3>Filas</h3>
                <div className="color-option">
                  <label>Color de fila:</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={formatConfig.rowBgColor}
                      onChange={(e) => handleFormatChange('rowBgColor', e.target.value)}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      value={formatConfig.rowBgColor}
                      onChange={(e) => handleFormatChange('rowBgColor', e.target.value)}
                      className="color-text"
                    />
                  </div>
                </div>
                <div className="checkbox-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={formatConfig.alternateRows}
                      onChange={(e) => handleFormatChange('alternateRows', e.target.checked)}
                    />
                    <span>Alternar colores de filas</span>
                  </label>
                </div>
                {formatConfig.alternateRows && (
                  <div className="color-option">
                    <label>Color alternativo:</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        value={formatConfig.alternateRowBgColor}
                        onChange={(e) => handleFormatChange('alternateRowBgColor', e.target.value)}
                        className="color-picker"
                      />
                      <input
                        type="text"
                        value={formatConfig.alternateRowBgColor}
                        onChange={(e) => handleFormatChange('alternateRowBgColor', e.target.value)}
                        className="color-text"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="format-section">
                <h3>Tipografía</h3>
                <div className="range-option">
                  <label>Tamaño: {formatConfig.fontSize}px</label>
                  <input
                    type="range"
                    min="10"
                    max="20"
                    value={formatConfig.fontSize}
                    onChange={(e) => handleFormatChange('fontSize', parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>
                <div className="range-option">
                  <label>Espaciado: {formatConfig.padding}px</label>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    value={formatConfig.padding}
                    onChange={(e) => handleFormatChange('padding', parseInt(e.target.value))}
                    className="range-slider"
                  />
                </div>
              </div>

              <div className="format-section">
                <h3>Bordes</h3>
                <div className="checkbox-option">
                  <label>
                    <input
                      type="checkbox"
                      checked={formatConfig.showBorders}
                      onChange={(e) => handleFormatChange('showBorders', e.target.checked)}
                    />
                    <span>Mostrar bordes</span>
                  </label>
                </div>

                {formatConfig.showBorders && (
                  <>
                    <div className="color-option">
                      <label>Color:</label>
                      <div className="color-input-group">
                        <input
                          type="color"
                          value={formatConfig.borderColor}
                          onChange={(e) => handleFormatChange('borderColor', e.target.value)}
                          className="color-picker"
                        />
                        <input
                          type="text"
                          value={formatConfig.borderColor}
                          onChange={(e) => handleFormatChange('borderColor', e.target.value)}
                          className="color-text"
                        />
                      </div>
                    </div>

                    <div className="range-option">
                      <label>Grosor: {formatConfig.borderWidth}px</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={formatConfig.borderWidth}
                        onChange={(e) => handleFormatChange('borderWidth', parseInt(e.target.value))}
                        className="range-slider"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SettingsPanel;
