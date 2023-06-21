const ExcelJS = require('exceljs');
const fs = require('fs');
const libreoffice = require('libreoffice-convert');

libreoffice.convertAsync = require('util').promisify(libreoffice.convert);

// loadThemplate
async function loadExcelTemplate(path) {
  const workBook = new ExcelJS.Workbook();

  await workBook.xlsx.readFile(path);

  return {
    workBook,
    workSheet: workBook.getWorksheet(1),
  };
}

function mergeDuplicateExcelCells(sheet, row) {
  let mergeCells = [];
  let lastVal = '';
  const merge = (cells) => {
    try {
      sheet.mergeCells(
        cells[0].row,
        cells[0]._column._number,
        cells[cells.length - 1].row,
        cells[cells.length - 1]._column._number
      );
    } catch (error) {}
  };

  row.eachCell((rowCell, index) => {
    sheet.unMergeCells(rowCell.address);

    if (lastVal === rowCell.text) {
      mergeCells.push(rowCell);
    } else {
      merge(mergeCells);

      mergeCells = [];
      mergeCells.push(rowCell);
    }

    if (row._cells.length === index) {
      merge(mergeCells);
    }

    lastVal = rowCell.text;
  });
}

function duplicateExcelRow(workSheet, rowIndex) {
  let duplicateRow = null;
  const duplicateRowIndex = rowIndex + 1;

  workSheet.duplicateRow(rowIndex, 1, true);
  duplicateRow = workSheet.getRow(duplicateRowIndex);

  mergeDuplicateExcelCells(workSheet, duplicateRow);

  return duplicateRow;
}

function fillExcelDocumentTableRow(sheetRow, tablePefix, rowData) {
  sheetRow.eachCell(function (sheetCell) {
    const cellText = sheetCell.value ? sheetCell.text : '';

    if (cellText.match(/{{\s*[\w\.]+\s*}}/)) {
      const replacedText = cellText.replace(
        /{{\s*([\w\.]+)\s*}}/g,
        function (match, p1) {
          const attrName = p1.replace(tablePefix, '');

          return rowData[attrName] ? rowData[attrName] : ' ';
        }
      );

      sheetCell.value = replacedText;
    }
  });
}

async function fillExcelDocumentTables(workSheet, docTables) {
  docTables?.forEach((table) => {
    const { tableName, tableData } = table;
    let stopSearch = false;

    workSheet.eachRow(function (sheetRow, rowIndex) {
      if (stopSearch) return;

      sheetRow.eachCell(async function (sheetCell) {
        const cellText = sheetCell.value ? sheetCell.text : '';
        const searchQuery = `table_${tableName}`;
        const searchRegex = new RegExp(`{{\\s*${searchQuery}\\.[^}]*}}`, 'g');

        if (stopSearch) return;

        if (cellText.match(searchRegex)) {
          let currentRow = sheetRow;

          stopSearch = true;

          for (const [index, rowData] of tableData.rows.entries()) {
            let tempRow = null;

            if (tableData.rows.length !== index + 1) {
              tempRow = duplicateExcelRow(workSheet, rowIndex + index);
            }

            fillExcelDocumentTableRow(
              currentRow,
              `table_${tableName}.`,
              rowData
            );

            if (tempRow) {
              currentRow = tempRow;
              tempRow = null;
            }
          }
        }
      });
    });

    workSheet.eachRow(function (sheetRow) {
      sheetRow.eachCell(function (sheetCell) {
        try {
          const cellText = sheetCell.text;
          const searchQuery = `table_${tableName}_total`;
          const searchRegex = new RegExp(`{{\\s*${searchQuery}\\.[^}]*}}`, 'g');

          if (cellText.match(searchRegex)) {
            const replacedText = cellText.replace(
              /{{\s*([\w\.]+)\s*}}/g,
              function (match, p1) {
                const attrName = p1.replace(searchQuery + '.', '');

                return tableData?.total[attrName]
                  ? tableData.total[attrName]
                  : ' ';
              }
            );

            sheetCell.value = replacedText;
          }
        } catch (error) {}
      });
    });
  });
}

// generateDocument
async function fillExcelDocument(data, templatePath, outputPath) {
  const { workBook, workSheet } = await loadExcelTemplate(templatePath);
  let buffer = null;

  await fillExcelDocumentTables(workSheet, data.tables);

  workSheet.eachRow(function (sheetRow) {
    sheetRow.eachCell(function (sheetCell) {
      try {
        const cellText = sheetCell.text;

        if (cellText.match(/{{\s*[\w\.]+\s*}}/)) {
          const replacedText = cellText.replace(
            /{{\s*([\w\.]+)\s*}}/g,
            function (match, p1) {
              return data[p1] ? data[p1] : ' ';
            }
          );

          sheetCell.value = replacedText;
        }
      } catch (error) {}
    });
  });

  buffer = await workBook.xlsx.writeBuffer();

  if (outputPath) {
    await fs.writeFileSync(outputPath, buffer);

    return buffer;
  }

  return buffer;
}

// convertToPdf
async function convertDocumentToPDF(input, outputPath) {
  let buffer = await libreoffice.convertAsync(input, '.pdf', undefined);

  if (outputPath) {
    await fs.writeFileSync(outputPath, buffer);

    return outputPath;
  }

  return buffer;
}

async function start_goodsspendings() {
  const file = await fillExcelDocument(
    {
      docnumber: '45',
      docdate: '08.05.2023',
      organization: 'Наша организация',
      contractor: 'Контрагент',
      tables: [
        {
          tableName: 'items',
          tableData: {
            rows: [
              {
                rownumber: '1',
                code: 'Код 1',
                nomenclature: 'Номенклатура 1',
                measure: 'шт',
                quantity: '2.00',
                price: '1000.00',
                summ: '2000.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '3',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '4',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '4',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '5',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '6',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '7',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '8',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '9',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '10',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '11',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '12',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
            ],
            total: {
              summ: '3500.00',
            },
          },
        },
      ],
    },
    'templates/document.goodsspendings.xlsx',
    'documents/document.goodsspendings.xlsx'
  );

  await convertDocumentToPDF(file, 'documents/document.goodsspendings.pdf');
}

async function start_goodsreceipts() {
  const file = await fillExcelDocument(
    {
      docnumber: '45',
      docdate: '08.05.2023',
      organization: 'Наша организация',
      contractor: 'Контрагент',
      storage: 'Склад',
      summ: '1 400.00',
      summwords: 'Одна тысяча четыреста тенге 00 тиын',
      tables: [
        {
          tableName: 'items',
          tableData: {
            rows: [
              {
                rownumber: 1,
                code: 'Кру19',
                nomenclature: 'Фунчеза плоская',
                measure: 'кг',
                quantity: '14.000',
                price: '2200.00',
                sum: '30800.00',
              },
              {
                rownumber: 2,
                code: 'Ово7',
                nomenclature: 'Грибы древесные сухие',
                measure: 'кг',
                quantity: '3.000',
                price: '8500.00',
                sum: '25500.00',
              },
              {
                rownumber: 3,
                code: 'Фру15',
                nomenclature: 'Орех арахис',
                measure: 'кг',
                quantity: '3.000',
                price: '2600.00',
                sum: '7800.00',
              },
              {
                rownumber: 4,
                code: 'Спе7',
                nomenclature: 'Джиджин (куриный порошок)',
                measure: 'кг',
                quantity: '10.000',
                price: '2500.00',
                sum: '25000.00',
              },
              {
                rownumber: 5,
                code: 'Спе99',
                nomenclature: '13 приправ',
                measure: 'кг',
                quantity: '0.454',
                price: '7500.00',
                sum: '3405.00',
              },
              {
                rownumber: 6,
                code: 'Спе30',
                nomenclature: 'Семечки кунжутные',
                measure: 'кг',
                quantity: '1.000',
                price: '2800.00',
                sum: '2800.00',
              },
            ],
            total: {
              quantity: '2',
              sum: '3500.00',
            },
          },
        },
      ],
    },
    'templates/document.goodsreceipts.xlsx',
    'documents/document.goodsreceipts.xlsx'
  );

  await convertDocumentToPDF(file, 'documents/document.goodsreceipts.pdf');
}

async function start_goodswriteoffs() {
  const file = await fillExcelDocument(
    {
      docnumber: '45',
      docdate: '08.05.2023',
      organization: 'Наша организация',
      company: 'Рога и Копыта',
      contractor: 'Контрагент',
      storage: 'Склад',
      writeoff: 'Статья списания',
      tables: [
        {
          tableName: 'items',
          tableData: {
            rows: [
              {
                rownumber: '1',
                code: 'Код 1',
                nomenclature: 'Номенклатура 1',
                measure: 'шт',
                quantity: '2.00',
                price: '1000.00',
                summ: '2000.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '2',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
              {
                rownumber: '223423423',
                code: 'Код 2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                quantity: '3.00',
                price: '500.00',
                summ: '1500.00',
              },
            ],
            total: {
              summ: '3500.00',
            },
          },
        },
      ],
    },
    'templates/document.goodswriteoffs.xlsx',
    'documents/document.goodswriteoffs.xlsx'
  );

  await convertDocumentToPDF(file, 'documents/document.goodswriteoffs.pdf');
}

async function start_calculations() {
  const file = await fillExcelDocument(
    {
      docnumber: '45',
      docdate: '08.05.2023',
      organization: 'Наша организация',
      dish: 'Блюдо Рога и Копыта',
      dishweight: '2 kg',
      tables: [
        {
          tableName: 'items',
          tableData: {
            rows: [
              {
                rownumber: '1',
                nomenclature: 'Номенклатура 1',
                measure: 'шт',
                grossweight: '2.00',
                netweight: '1000.00',
                dishweight: '2000.00',
              },
              {
                rownumber: '2',
                nomenclature: 'Номенклатура 2',
                measure: 'шт',
                grossweight: '2.00',
                netweight: '1000.00',
                dishweight: '2000.00',
              },
            ],
            total: {
              netweight: '2000.00',
              dishweight: '4000.00',
            },
          },
        },
      ],
    },
    'templates/document.calculations.xlsx',
    'documents/document.calculations.xlsx'
  );

  await convertDocumentToPDF(file, 'documents/document.calculations.pdf');
}

async function start_incashorders() {
  const file = await fillExcelDocument(
    {
      docnumber: '45',
      docdate: '08.05.2023',
      organization: 'Наша организация',
      contractor: 'Контрагент',
      sendfrom: 'От Валеры',
      comment: 'Дай пж ёмаё',
      summ: '20 000.00',
      summwords: 'Двадцать тыщ',
    },
    'templates/document.incashorders.xlsx',
    'documents/document.incashorders.xlsx'
  );

  await convertDocumentToPDF(file, 'documents/document.incashorders.pdf');
}

// start_goodsspendings();

// start_goodsreceipts();

start_goodswriteoffs();

// start_calculations();

// start_incashorders();
