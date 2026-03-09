import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({
    providedIn: 'root'
})
export class ExcelInventario {

    async exportToExcelCustom(data: any[], fileName: string) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte de Recibo');

        // CONFIGURACIÓN DE COLUMNAS
        worksheet.columns = [
            { header: '*', key: 'index', width: 4 },
            { header: 'Rango Inicial', key: 'lbl_txt1', width: 12 },
            { header: 'Rango Final', key: 'lbl_txt2', width: 12 },
            { header: 'Descripción', key: 'lbl_txt3', width: 50 },
        ];

        worksheet.getColumn('index').alignment = { horizontal: 'left' }; //alinea
        worksheet.getColumn('index').font = {color:{ argb: 'FF888888' }};  //color de letra y mas ajustes

        // La descripción suele ir a la izquierda (valor por defecto)
        worksheet.getColumn('lbl_txt1').alignment = { horizontal: 'left', indent: 1 };
        worksheet.getColumn('lbl_txt2').alignment = { horizontal: 'left', indent: 1 };


        // DISEÑO DE ENCABEZADO (Azul como tu tabla)
        const headerRow = worksheet.getRow(1);
        headerRow.height = 25;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '003366' } };
            cell.font = { color: { argb: 'FFFFFF' }, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // 4. Agregar los datos de tu Signal
        data.forEach((fila, i) => {
            //console.log("archivo fila " , fila);            
            const row = worksheet.addRow({
                index: i + 1,
                lbl_txt1: fila.lbl_txt1,
                lbl_txt2: fila.lbl_txt2,
                lbl_txt3: fila.lbl_txt3
            });

            // Si el índice es par, aplicamos un gris muy suave
            if ((i + 1) % 2 === 0) {
                row.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',

                        fgColor: { argb: 'FFF2F2F2' } // Gris claro "austere"
                    };
                });
            }
        });

        // CONGELAR PRIMERA FILA (Diseño Pro)
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        //Genera y descarga archivo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${fileName}.xlsx`);
    }
}