import React, { useRef, useState } from 'react';
import { Column, TableData, FormatConfig } from '../types';
import './Toolbar.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ImportModal from './ImportModal';
import ExportModal, { ExportOptions } from './ExportModal';

interface ToolbarProps {
  onImport: (columns: Column[], data: TableData[]) => void;
  onAddRow: () => void;
  onSearch: (term: string) => void;
  onToggleSettings: () => void;
  columns: Column[];
  data: TableData[];
  formatConfig: FormatConfig;
  hasData: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onImport,
  onAddRow,
  onSearch,
  onToggleSettings,
  columns,
  data,
  formatConfig,
  hasData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = (importedColumns: Column[], importedData: TableData[]) => {
    onImport(importedColumns, importedData);
  };

  const handleExportWithConfig = ({ format, rowsPerChunk, csvDelimiter }: ExportOptions) => {
    if (!hasData) return;

    const effectiveRowsPerChunk = rowsPerChunk > 0 ? rowsPerChunk : 0;
    const chunks = effectiveRowsPerChunk > 0 ? Math.ceil(data.length / effectiveRowsPerChunk) : 1;
    const delimiter = format === 'csv' ? (csvDelimiter && csvDelimiter.length > 0 ? csvDelimiter : ',') : ',';

    if (chunks === 1) {
      // Exportar todo en un archivo
      switch (format) {
        case 'csv': handleExportCSV(undefined, undefined, undefined, delimiter); break;
        case 'excel': handleExportExcel(); break;
        case 'html': handleExportHTML(); break;
        case 'pdf': handleExportPDF(); break;
      }
    } else {
      // Exportar en múltiples archivos
      for (let i = 0; i < chunks; i++) {
        const start = i * effectiveRowsPerChunk;
        const end = Math.min(start + effectiveRowsPerChunk, data.length);
        const chunkData = data.slice(start, end);

        switch (format) {
          case 'csv': handleExportCSVChunk(chunkData, i + 1, chunks, delimiter); break;
          case 'excel': handleExportExcelChunk(chunkData, i + 1, chunks); break;
          case 'html': handleExportHTMLChunk(chunkData, i + 1, chunks); break;
          case 'pdf': handleExportPDFChunk(chunkData, i + 1, chunks); break;
        }
      }
    }
  };

  const handleExportCSV = (chunkData?: TableData[], fileNumber?: number, totalChunks?: number, delimiter: string = ',') => {
    if (!hasData) return;

    const exportData = chunkData || data;
    const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
    let csv = visibleColumns.map(col => `"${col.name}"`).join(delimiter) + '\n';
    
    exportData.forEach(row => {
      const values = visibleColumns.map(col => {
        const value = row[col.id] ?? '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csv += values.join(delimiter) + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = fileNumber 
      ? `tabla_exportada_parte${fileNumber}de${totalChunks}.csv`
      : 'tabla_exportada.csv';
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportCSVChunk = (chunkData: TableData[], fileNumber: number, totalChunks: number, delimiter: string) => {
    handleExportCSV(chunkData, fileNumber, totalChunks, delimiter);
  };

  const handleExportHTML = (chunkData?: TableData[], fileNumber?: number, totalChunks?: number) => {
    if (!hasData) return;

    const exportData = chunkData || data;
    const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
    const {
      fontSize,
      headerBgColor,
      headerTextColor,
      rowBgColor,
      alternateRowBgColor,
      borderColor,
      borderWidth,
      padding,
      showBorders,
      alternateRows,
    } = formatConfig;

    const borderStyle = showBorders
      ? `border: ${borderWidth}px solid ${borderColor};`
      : 'border: none;';

    let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tabla Exportada</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      background-color: #fafafa;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      font-size: ${fontSize}px;
      border-collapse: collapse;
    }
    th {
      background-color: ${headerBgColor};
      color: ${headerTextColor};
      padding: ${padding}px;
      ${borderStyle}
      font-weight: 600;
      text-align: left;
    }
    td {
      padding: ${padding}px;
      ${borderStyle}
    }
    ${alternateRows ? `tr:nth-child(even) td { background-color: ${alternateRowBgColor}; }` : ''}
    ${!alternateRows ? `td { background-color: ${rowBgColor}; }` : `tr:nth-child(odd) td { background-color: ${rowBgColor}; }`}
  </style>
</head>
<body>
  <div class="container">
    <table>
      <thead>
        <tr>
`;

    visibleColumns.forEach(col => {
      const align = col.alignment || 'left';
      html += `          <th style="text-align: ${align};">${col.name}</th>\n`;
    });

    html += `        </tr>
      </thead>
      <tbody>
`;

    exportData.forEach(row => {
      html += '        <tr>\n';
      visibleColumns.forEach(col => {
        const align = col.alignment || 'left';
        const value = row[col.id] ?? '';
        html += `          <td style="text-align: ${align};">${String(value)}</td>\n`;
      });
      html += '        </tr>\n';
    });

    html += `      </tbody>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = fileNumber 
      ? `tabla_exportada_parte${fileNumber}de${totalChunks}.html`
      : 'tabla_exportada.html';
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleExportHTMLChunk = (chunkData: TableData[], fileNumber: number, totalChunks: number) => {
    handleExportHTML(chunkData, fileNumber, totalChunks);
  };

  const handleExportExcel = (chunkData?: TableData[], fileNumber?: number, totalChunks?: number) => {
    if (!hasData) return;

    const exportData = chunkData || data;
    const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
    
    // Crear datos para Excel (solo columnas visibles, sin _rowId)
    const excelData = [
      visibleColumns.map(col => col.name), // Encabezados
      ...exportData.map(row => visibleColumns.map(col => row[col.id] ?? '')) // Datos
    ];

    // Crear libro de trabajo
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Aplicar estilos a los encabezados
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: formatConfig.headerBgColor.replace('#', '') } },
        alignment: { horizontal: 'left' }
      };
    }

    // Ajustar ancho de columnas
    const colWidths = visibleColumns.map(col => ({
      wch: col.width ? col.width / 8 : 15
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    
    // Descargar archivo
    const filename = fileNumber 
      ? `tabla_exportada_parte${fileNumber}de${totalChunks}.xlsx`
      : 'tabla_exportada.xlsx';
    XLSX.writeFile(wb, filename);
  };

  const handleExportExcelChunk = (chunkData: TableData[], fileNumber: number, totalChunks: number) => {
    handleExportExcel(chunkData, fileNumber, totalChunks);
  };

  const handleExportPDF = (chunkData?: TableData[], fileNumber?: number, totalChunks?: number) => {
    if (!hasData) return;

    const exportData = chunkData || data;
    const visibleColumns = columns.filter(col => col.visible).sort((a, b) => a.order - b.order);
    
    // Crear documento PDF
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(16);
    const title = fileNumber 
      ? `Tabla Exportada (Parte ${fileNumber} de ${totalChunks})`
      : 'Tabla Exportada';
    doc.text(title, 14, 15);
    
    // Preparar datos para la tabla (solo columnas visibles, sin _rowId)
    const headers = [visibleColumns.map(col => col.name)];
    const body = exportData.map(row => visibleColumns.map(col => String(row[col.id] ?? '')));
    
    // Convertir color hex a RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    const headerColor = hexToRgb(formatConfig.headerBgColor);
    const headerTextColor = hexToRgb(formatConfig.headerTextColor);
    const rowColor = hexToRgb(formatConfig.rowBgColor);
    const altRowColor = hexToRgb(formatConfig.alternateRowBgColor);
    
    const borderColor = hexToRgb(formatConfig.borderColor);

    // Generar tabla
    autoTable(doc, {
      head: headers,
      body: body,
      startY: 25,
      styles: {
        fontSize: formatConfig.fontSize * 0.75,
        cellPadding: formatConfig.padding * 0.3,
        lineColor: formatConfig.showBorders ? [borderColor.r, borderColor.g, borderColor.b] : [255, 255, 255],
        lineWidth: formatConfig.showBorders ? formatConfig.borderWidth * 0.264583 : 0,
      },
      headStyles: {
        fillColor: [headerColor.r, headerColor.g, headerColor.b],
        textColor: [headerTextColor.r, headerTextColor.g, headerTextColor.b],
        fontStyle: 'bold',
      },
      alternateRowStyles: formatConfig.alternateRows ? {
        fillColor: [altRowColor.r, altRowColor.g, altRowColor.b],
      } : undefined,
      bodyStyles: {
        fillColor: [rowColor.r, rowColor.g, rowColor.b],
      },
      columnStyles: visibleColumns.reduce((acc, col, idx) => {
        acc[idx] = { 
          halign: col.alignment || 'left',
          cellWidth: col.width ? col.width * 0.264583 : 'auto' // Convertir px a mm
        };
        return acc;
      }, {} as any),
    });
    
    // Descargar PDF
    const filename = fileNumber 
      ? `tabla_exportada_parte${fileNumber}de${totalChunks}.pdf`
      : 'tabla_exportada.pdf';
    doc.save(filename);
  };

  const handleExportPDFChunk = (chunkData: TableData[], fileNumber: number, totalChunks: number) => {
    handleExportPDF(chunkData, fileNumber, totalChunks);
  };

  return (
    <>
      <ImportModal
        isOpen={showImportModal}
        fileContent={fileContent}
        fileName={fileName}
        onClose={() => setShowImportModal(false)}
        onConfirm={handleImportConfirm}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        columns={columns}
        data={data}
        formatConfig={formatConfig}
        onExport={handleExportWithConfig}
      />

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, ID, email..."
              onChange={(e) => onSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

      <div className="toolbar-right">
        <div className="button-group">
          <button 
            className="toolbar-button" 
            onClick={() => setShowExportModal(true)}
            disabled={!hasData}
          >
            <img src="/img/export-icon.png" alt="Exportar" width="16" height="16" />
            Exportar
          </button>

          <button className="toolbar-button" onClick={() => fileInputRef.current?.click()}>
            <img src="/img/import-icon.png" alt="Importar" width="16" height="16" />
            Importar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <button className="toolbar-button" onClick={onToggleSettings}>
            <img src="/img/settings-icon.png" alt="Configurar" width="16" height="16" />
            Configurar
          </button>
        </div>

        <button className="add-button" onClick={onAddRow} disabled={columns.length === 0}>
          <img src="/img/add-icon.png" alt="Añadir" width="16" height="16" />
          Nueva fila
        </button>
      </div>
      </div>
    </>
  );
};

export default Toolbar;
