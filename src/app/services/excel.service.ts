import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  async exportToExcelCustom(data: any[], fileName: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Recibo');

    // CONFIGURACIÓN DE COLUMNAS
    worksheet.columns = [
      { header: 'Folio', key: 'folio', width: 12 },
      { header: 'Cliente', key: 'cliente', width: 35 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Total', key: 'total', width: 15 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Chofer', key: 'chofer', width: 25 },
      { header: 'Unidad', key: 'unidad', width: 12 },
      { header: 'Destino', key: 'destino', width: 20 }
    ];

    // DISEÑO DE ENCABEZADO (Azul como tu tabla)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // DISEÑO DE FILAS (Datos)
    data.forEach((item) => {
      const row = worksheet.addRow(item);
      
      // Formato de moneda para el Total
      const totalCell = row.getCell('total');
      totalCell.numFmt = '"$"#,##0.00';

      // Color de texto según estado (Diseño condicional)
      const statusCell = row.getCell('estado');
      const status = item.estado.toLowerCase();
      if (status === 'entregado') statusCell.font = { color: { argb: 'FF059669' }, bold: true };
      if (status === 'en ruta') statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
      if (status === 'cancelado') statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      if (status === 'pendiente') statusCell.font = { color: { argb: 'FF6B7280' }, bold: true };
    });

    // CONGELAR PRIMERA FILA (Diseño Pro)
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  }
}