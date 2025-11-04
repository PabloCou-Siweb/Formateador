import React, { useState } from 'react';
import { Column, TableData } from '../types';
import './ImportModal.css';

interface ImportModalProps {
  isOpen: boolean;
  fileContent: string;
  fileName: string;
  onClose: () => void;
  onConfirm: (columns: Column[], data: TableData[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  fileContent,
  fileName,
  onClose,
  onConfirm,
}) => {
  const [delimiter, setDelimiter] = useState<string>(',');
  const [customDelimiter, setCustomDelimiter] = useState<string>('');
  const [hasHeaders, setHasHeaders] = useState<boolean>(true);
  const [trimSpaces, setTrimSpaces] = useState<boolean>(true);
  const [removeQuotes, setRemoveQuotes] = useState<boolean>(true);

  if (!isOpen) return null;

  const processData = () => {
    const activeDelimiter = delimiter === 'custom' ? customDelimiter : delimiter;
    
    if (!activeDelimiter) {
      alert('Por favor selecciona o ingresa un delimitador');
      return;
    }

    const lines = fileContent.trim().split('\n');
    if (lines.length === 0) {
      alert('El archivo está vacío');
      return;
    }

    // Función para parsear una línea considerando comillas
    const parseLine = (line: string): string[] => {
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          if (insideQuotes && nextChar === '"') {
            // Comilla escapada ("")
            currentValue += '"';
            i++; // Saltar la siguiente comilla
          } else {
            // Cambiar estado de comillas
            insideQuotes = !insideQuotes;
            // Si removeQuotes está desactivado, mantener las comillas
            if (!removeQuotes) {
              currentValue += char;
            }
          }
        } else if (char === activeDelimiter && !insideQuotes) {
          // Encontramos un delimitador fuera de comillas
          values.push(trimSpaces ? currentValue.trim() : currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      // Agregar el último valor
      values.push(trimSpaces ? currentValue.trim() : currentValue);

      return values;
    };

    let headers: string[];
    let dataLines: string[];

    if (hasHeaders) {
      headers = parseLine(lines[0]);
      dataLines = lines.slice(1);
    } else {
      // Generar encabezados automáticos
      const firstLine = parseLine(lines[0]);
      headers = firstLine.map((_, idx) => `Columna ${idx + 1}`);
      dataLines = lines;
    }

    // Crear columnas
    const columns: Column[] = headers.map((header, index) => ({
      id: `col_${index}`,
      name: header,
      type: 'text',
      visible: true,
      order: index,
      alignment: 'left',
    }));

    // Procesar datos
    const data: TableData[] = dataLines
      .filter(line => line.trim().length > 0) // Ignorar líneas vacías
      .map((line, lineIndex) => {
        const values = parseLine(line);
        const row: TableData = {
          _rowId: `row_${Date.now()}_${lineIndex}` // Asignar ID único
        };
        headers.forEach((_, index) => {
          row[`col_${index}`] = values[index] || '';
        });
        return row;
      });

    if (data.length === 0) {
      alert('No se encontraron datos para importar');
      return;
    }

    onConfirm(columns, data);
    onClose();
  };

  // Vista previa de las primeras líneas en formato tabla
  const getPreviewData = () => {
    const activeDelimiter = delimiter === 'custom' ? customDelimiter : delimiter;
    if (!activeDelimiter) return null;

    const lines = fileContent.trim().split('\n').slice(0, 6); // Header + 5 filas
    if (lines.length === 0) return null;

    // Función simplificada de parseo para preview
    const parsePreviewLine = (line: string): string[] => {
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
          insideQuotes = !insideQuotes;
          if (!removeQuotes) currentValue += char;
        } else if (char === activeDelimiter && !insideQuotes) {
          values.push(trimSpaces ? currentValue.trim() : currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      values.push(trimSpaces ? currentValue.trim() : currentValue);
      return values;
    };

    return lines.map(line => parsePreviewLine(line));
  };

  return (
    <>
      <div className="import-modal-overlay" onClick={onClose} />
      <div className="import-modal">
        <div className="modal-header">
          <h2>Configurar Importación</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-content">
          <div className="file-info">
            <img src="/img/import-icon.png" alt="Archivo" width="20" height="20" />
            <div>
              <strong>{fileName}</strong>
              <span>{fileContent.split('\n').length} líneas</span>
            </div>
          </div>

          <div className="config-section">
            <h3>Delimitador</h3>
            <div className="delimiter-options">
              <label className={`delimiter-option ${delimiter === ',' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delimiter"
                  value=","
                  checked={delimiter === ','}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                <span className="option-label">
                  <strong>Coma (,)</strong>
                  <small>Estándar CSV</small>
                </span>
              </label>

              <label className={`delimiter-option ${delimiter === ';' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delimiter"
                  value=";"
                  checked={delimiter === ';'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                <span className="option-label">
                  <strong>Punto y coma (;)</strong>
                  <small>Excel europeo</small>
                </span>
              </label>

              <label className={`delimiter-option ${delimiter === '#' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delimiter"
                  value="#"
                  checked={delimiter === '#'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                <span className="option-label">
                  <strong>Hashtag (#)</strong>
                  <small>Hash separated</small>
                </span>
              </label>

              <label className={`delimiter-option ${delimiter === '|' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delimiter"
                  value="|"
                  checked={delimiter === '|'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                <span className="option-label">
                  <strong>Barra vertical (|)</strong>
                  <small>Pipe separated</small>
                </span>
              </label>

              <label className={`delimiter-option ${delimiter === 'custom' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="delimiter"
                  value="custom"
                  checked={delimiter === 'custom'}
                  onChange={(e) => setDelimiter(e.target.value)}
                />
                <span className="option-label">
                  <strong>Personalizado</strong>
                  <input
                    type="text"
                    className="custom-delimiter-input"
                    placeholder="Ej: @, %, etc."
                    value={customDelimiter}
                    onChange={(e) => setCustomDelimiter(e.target.value)}
                    disabled={delimiter !== 'custom'}
                    maxLength={3}
                  />
                </span>
              </label>
            </div>
          </div>

          <div className="config-section">
            <h3>Opciones</h3>
            <div className="checkbox-options">
              <label className="checkbox-simple">
                <input
                  type="checkbox"
                  checked={hasHeaders}
                  onChange={(e) => setHasHeaders(e.target.checked)}
                />
                <span>La primera fila contiene encabezados</span>
              </label>

              <label className="checkbox-simple">
                <input
                  type="checkbox"
                  checked={removeQuotes}
                  onChange={(e) => setRemoveQuotes(e.target.checked)}
                />
                <span>Eliminar comillas</span>
              </label>

              <label className="checkbox-simple">
                <input
                  type="checkbox"
                  checked={trimSpaces}
                  onChange={(e) => setTrimSpaces(e.target.checked)}
                />
                <span>Eliminar espacios al inicio y final de valores</span>
              </label>
            </div>
          </div>

          <div className="preview-section">
            <h3>Vista Previa</h3>
            <div className="preview-table-container">
              {(() => {
                const previewData = getPreviewData();
                if (!previewData || previewData.length === 0) {
                  return <p className="preview-empty">Selecciona un delimitador para ver la vista previa</p>;
                }

                const headers = hasHeaders ? previewData[0] : previewData[0].map((_, i) => `Columna ${i + 1}`);
                const rows = hasHeaders ? previewData.slice(1) : previewData;

                return (
                  <table className="preview-table">
                    <thead>
                      <tr>
                        {headers.map((header, i) => (
                          <th key={i}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
            <small className="preview-note">Mostrando las primeras 5 filas de {fileContent.split('\n').length}</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-import" onClick={processData}>
            <img src="/img/import-icon.png" alt="" width="16" height="16" />
            Importar Datos
          </button>
        </div>
      </div>
    </>
  );
};

export default ImportModal;

