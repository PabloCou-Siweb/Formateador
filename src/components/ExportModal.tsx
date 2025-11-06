import React, { useState } from 'react';
import { Column, TableData, FormatConfig } from '../types';
import './ExportModal.css';

type ExportFormat = 'csv' | 'excel' | 'html' | 'pdf';
type DelimiterOption = 'comma' | 'semicolon' | 'hash' | 'pipe' | 'tab' | 'custom';

export interface ExportOptions {
  format: ExportFormat;
  rowsPerChunk: number;
  csvDelimiter?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  data: TableData[];
  formatConfig: FormatConfig;
  onExport: (options: ExportOptions) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  columns,
  data,
  formatConfig,
  onExport,
}) => {
  const [exportInChunks, setExportInChunks] = useState<boolean>(false);
  const [rowsPerChunk, setRowsPerChunk] = useState<number>(1000);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
  const [delimiterOption, setDelimiterOption] = useState<DelimiterOption>('comma');
  const [customDelimiter, setCustomDelimiter] = useState<string>('');
  const [customDelimiterError, setCustomDelimiterError] = useState<string | null>(null);

  const delimiterPresets: Record<DelimiterOption, { label: string; value: string; summaryLabel: string }> = {
    comma: { label: 'Coma (,)', value: ',', summaryLabel: ',' },
    semicolon: { label: 'Punto y coma (;)', value: ';', summaryLabel: ';' },
    hash: { label: 'Numeral (#)', value: '#', summaryLabel: '#' },
    pipe: { label: 'Barra vertical (|)', value: '|', summaryLabel: '|' },
    tab: { label: 'Tabulación', value: '	', summaryLabel: 'Tab' },
    custom: { label: 'Personalizado', value: '', summaryLabel: 'Personalizado' },
  };

  const delimiterOptionsOrder: DelimiterOption[] = ['comma', 'semicolon', 'hash', 'pipe', 'tab', 'custom'];

  const resolveDelimiterValue = () => {
    if (delimiterOption === 'custom') {
      return customDelimiter;
    }
    return delimiterPresets[delimiterOption].value;
  };

  const resolveDelimiterSummary = () => {
    if (delimiterOption === 'custom') {
      return customDelimiter ? customDelimiter : 'Personalizado';
    }
    return delimiterPresets[delimiterOption].summaryLabel;
  };

  const handleDelimiterOptionChange = (option: DelimiterOption) => {
    setDelimiterOption(option);
    if (option !== 'custom') {
      setCustomDelimiterError(null);
    }
  };

  const handleCustomDelimiterChange = (value: string) => {
    setCustomDelimiter(value);
    if (customDelimiterError) {
      setCustomDelimiterError(null);
    }
  };

  if (!isOpen) return null;

  const totalRows = data.length;
  const numberOfChunks = exportInChunks ? Math.ceil(totalRows / rowsPerChunk) : 1;
  const isCustomDelimiterSelected = selectedFormat === 'csv' && delimiterOption === 'custom';
  const isExportDisabled = isCustomDelimiterSelected && !customDelimiter;

  const handleExport = () => {
    if (selectedFormat === 'csv' && delimiterOption === 'custom' && !customDelimiter) {
      setCustomDelimiterError('Introduce un separador personalizado');
      return;
    }

    const csvDelimiter = selectedFormat === 'csv' ? resolveDelimiterValue() : undefined;

    setCustomDelimiterError(null);
    onExport({
      format: selectedFormat,
      rowsPerChunk: exportInChunks ? rowsPerChunk : 0,
      csvDelimiter,
    });
    onClose();
  };

  const formatOptions = [
    { value: 'csv', label: 'CSV', desc: 'Valores separados por comas' },
    { value: 'excel', label: 'Excel', desc: 'Libro de Excel (.xlsx)' },
    { value: 'html', label: 'HTML', desc: 'Página web con estilos' },
    { value: 'pdf', label: 'PDF', desc: 'Documento imprimible' },
  ];

  return (
    <>
      <div className="export-modal-overlay" onClick={onClose} />
      <div className="export-modal">
        <div className="export-modal-header">
          <h2>Configurar Exportación</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="export-modal-content">
          <div className="export-info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 3v14M15 3v14M3 8h14M3 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div>
              <strong>Total de filas a exportar: {totalRows}</strong>
              <span>{columns.filter(c => c.visible).length} columnas visibles</span>
            </div>
          </div>

          <div className="export-section">
            <h3>Formato de Exportación</h3>
            <div className="format-options">
              {formatOptions.map((format) => (
                <label key={format.value} className={`format-option ${selectedFormat === format.value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={(e) => setSelectedFormat(e.target.value as any)}
                  />
                  <div className="format-option-text">
                    <strong>{format.label}</strong>
                    <small>{format.desc}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {selectedFormat === 'csv' && (
            <div className="export-section">
              <h3>Separador CSV</h3>
              <div className="export-delimiter-options">
                {delimiterOptionsOrder.map((option) => (
                  <label
                    key={option}
                    className={`export-delimiter-option ${delimiterOption === option ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="delimiter"
                      value={option}
                      checked={delimiterOption === option}
                      onChange={(e) => handleDelimiterOptionChange(e.target.value as DelimiterOption)}
                    />
                    <span>{delimiterPresets[option].label}</span>
                  </label>
                ))}
              </div>

              {delimiterOption === 'custom' && (
                <div className="export-custom-delimiter-field">
                  <label htmlFor="custom-delimiter">Separador personalizado</label>
                  <input
                    id="custom-delimiter"
                    type="text"
                    value={customDelimiter}
                    onChange={(e) => handleCustomDelimiterChange(e.target.value)}
                    placeholder="Ej: ::"
                    maxLength={5}
                  />
                  <p className="export-custom-delimiter-hint">Puedes usar hasta 5 caracteres.</p>
                  {customDelimiterError && (
                    <p className="export-custom-delimiter-error">{customDelimiterError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="export-section">
            <div className="chunk-header">
              <h3>Dividir en Bloques</h3>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={exportInChunks}
                  onChange={(e) => setExportInChunks(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            {exportInChunks && (
              <div className="chunk-config">
                <div className="chunk-input-group">
                  <label>Filas por archivo:</label>
                  <input
                    type="number"
                    className="chunk-input"
                    value={rowsPerChunk}
                    onChange={(e) => setRowsPerChunk(Math.max(1, parseInt(e.target.value) || 1000))}
                    min="1"
                    max={totalRows}
                  />
                </div>

                <div className="chunk-preview">
                  <div className="chunk-info">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M10 6v4M10 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>
                      Se generarán <strong>{numberOfChunks}</strong> {numberOfChunks === 1 ? 'archivo' : 'archivos'}
                    </span>
                  </div>
                  
                  <div className="chunk-breakdown">
                    {Array.from({ length: Math.min(numberOfChunks, 5) }, (_, i) => {
                      const start = i * rowsPerChunk + 1;
                      const end = Math.min((i + 1) * rowsPerChunk, totalRows);
                      return (
                        <div key={i} className="chunk-item">
                          📄 Archivo {i + 1}: Filas {start} - {end} ({end - start + 1} filas)
                        </div>
                      );
                    })}
                    {numberOfChunks > 5 && (
                      <div className="chunk-item more">
                        ... y {numberOfChunks - 5} archivos más
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="export-summary">
            <div className="summary-item">
              <span className="summary-label">Archivos a generar:</span>
              <span className="summary-value">{numberOfChunks}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Formato:</span>
            <span className="summary-value">
              {selectedFormat === 'csv'
                ? `CSV (${resolveDelimiterSummary()})`
                : selectedFormat.toUpperCase()}
            </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total de filas:</span>
              <span className="summary-value">{totalRows}</span>
            </div>
          </div>
        </div>

        <div className="export-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-export" onClick={handleExport} disabled={isExportDisabled}>
            <img src="/img/export-icon.png" alt="" width="16" height="16" />
            Exportar {numberOfChunks > 1 ? `${numberOfChunks} Archivos` : 'Archivo'}
          </button>
        </div>
      </div>
    </>
  );
};

export default ExportModal;

