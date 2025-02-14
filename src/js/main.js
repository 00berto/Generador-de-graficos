// Import CSS
import "../scss/styles.scss";
const crea = document.getElementById("creaGraf");
const visual = document.getElementById("cargaFile");
const archivoXLSL = document.getElementById("file1");
const progressBar = document.getElementById("progressBar");
const selectHoja = document.getElementById("selectHoja");
const AsseX1 = document.getElementById("asseX1");
const AsseY1 = document.getElementById("asseY1");
const download = document.getElementById("download");

archivoXLSL.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  // Mostrar la barra de progreso
  progressBar.style.display = "block";

  const totalPasos = 10; // Ajusta este valor según la complejidad de tu carga
  let pasoActual = 0;
  const interval = setInterval(() => {
    pasoActual++;
    const porcentaje = (pasoActual / totalPasos) * 100;
    progressBar.style.width = porcentaje + "%";
    if (pasoActual === totalPasos) {
      clearInterval(interval);
      // Aquí puedes agregar código para procesar el archivo cargado
      console.log("Archivo cargado exitosamente");
    }
  }, 500);

  // leer la estension del file
  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split(".").pop();

  const reader = new FileReader();

  reader.onload = function (e) {
    const fileData = e.target.result;

    if (fileExtension === "csv") {
      readCSV(fileData);
    } else if (fileExtension === "xls" || fileExtension === "xlsx") {
      readExcel(fileData);
    } else if (fileExtension === "xml") {
      readXML(fileData);
    } else {
      alert("Formato del file non compatibile. Usa CSV , Excel o XML.");
    }
  };

  if (fileExtension === "csv" || fileExtension === "xml") {
    reader.readAsText(file); // Leer CSV como texto
  } else {
    reader.readAsArrayBuffer(file); // Leer Excel como ArrayBuffer
  }
});

let DataGlobal = []; // Variable global para almacenar los datos
let fileType = "";

// de CSV a JSON

function readCSV(csvData) {
  Papa.parse(csvData, {
    header: true,
    skipEmptyLines: true,
    complete: function (result) {
      fileType = "CSV";
      DataGlobal = result.data.map((row) => {
        Object.keys(row).forEach((key) => {
          if (typeof row[key] === "string" && row[key].includes(",")) {
            row[key] = parseFloat(row[key].replace(".", "").replace(",", ".")); // Formateo de números
          }
        });
        return row;
      });

      console.log("CSV convertido a JSON:", DataGlobal);
    },
  });
}

// de EXCEL a JSON
function readExcel(excelData) {
  const data = new Uint8Array(excelData);
  const excel = XLSX.read(data, { type: "array" });
  const sheetLength = excel.SheetNames;

  // Agregar opciones al select
  selectHoja.innerHTML = ""; // Limpiar opciones anteriores
  sheetLength.forEach((sheetName) => {
    const option = document.createElement("option");
    option.classList.add("px-1");
    option.value = sheetName;
    option.textContent = sheetName;
    selectHoja.appendChild(option);
  });

  fileType = "EXCEL";

  const sheet = excel.Sheets[sheetLength[0]];
  DataGlobal = XLSX.utils.sheet_to_json(sheet, { raw: false });

  console.log(`Hoja "${sheetLength[0]}" convertida a JSON:`, DataGlobal);
}

// de XML a JSON
function readXML(xmlData) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlData, "text/xml");

  const firstRow = xmlDoc.getElementsByTagName("*")[1]; // Primera fila de datos
  const headers = Array.from(firstRow.children).map((node) => node.nodeName);
  fileType = "XML";

  DataGlobal = Array.from(xmlDoc.getElementsByTagName(firstRow.nodeName)).map(
    (row) => {
      const obj = {};
      headers.forEach((header) => {
        obj[header] = row.getElementsByTagName(header)[0]?.textContent || "";
      });
      return obj;
    }
  );

  console.log("XML convertido a JSON:", DataGlobal);
}

function addColumnNamesToSelect(jsonData) {
  if (!jsonData || jsonData.length === 0) return;

  const headers = Object.keys(jsonData[0]); // Obtener nombres de columnas

  AsseX1.innerHTML = "";
  AsseY1.innerHTML = "";

  headers.forEach((header) => {
    const optionX = document.createElement("option");
    optionX.classList.add("px-1");
    optionX.value = header;
    optionX.textContent = header;
    AsseX1.appendChild(optionX);

    const optionY = document.createElement("option");
    optionY.classList.add("px-1");
    optionY.value = header;
    optionY.textContent = header;
    AsseY1.appendChild(optionY);
  });
}

crea.addEventListener("click", function () {
  const chartType = document.getElementById("chartType").value; // Obtener el tipo de gráfico actual

  generateChart(DataGlobal, chartType);
});

visual.addEventListener("click", function () {
  if (DataGlobal.length === 0) {
    alert("Non ci sono file caricati");
    return;
  }

  displayData(DataGlobal); // Muestra los datos en la página
  addColumnNamesToSelect(DataGlobal); // Carga los nombres de columnas en los <select>

  console.log(`Datos mostrados desde un archivo ${fileType}`);
});

// Función para mostrar datos en la página
function displayData(data) {
  const output = document.getElementById("output");
  output.innerHTML = ""; // Limpiar contenido anterior

  // Crear una tabla para mostrar los datos
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";

  // Crear encabezados de tabla
  const headers = Object.keys(data[0]);
  const headerRow = document.createElement("tr");
  headers.forEach((header) => {
    const th = document.createElement("th");
    th.textContent = header;
    th.style.border = "1px solid #ddd";
    th.style.padding = "8px";
    th.style.backgroundColor = "#f4f4f4";
    th.style.textAlign = "left";
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  // Crear filas de datos
  data.forEach((row) => {
    const tr = document.createElement("tr");
    headers.forEach((header) => {
      const td = document.createElement("td");
      td.textContent = row[header];
      td.style.border = "1px solid #ddd";
      td.style.padding = "8px";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  // Agregar la tabla al <pre>
  output.appendChild(table);
}

const colore = document.getElementById("colore");

let chartInstance; // almacen del grafico

function UpdateColor() {
  const UpColore = colore.value;

  if (chartInstance) {
    chartInstance.data.datasets[0].borderColor = UpColore;
    chartInstance.update();
  }
}

// Función para generar el gráfico
function generateChart(data, type) {
  const xAxis = AsseX1.value;
  const yAxis = AsseY1.value;
  const labels = data.map((item) => item[xAxis]);
  const values = data.map((item) => item[yAxis]);

  const nomeGrafico = document.getElementById("nomeGrafico").value;

  const ctx = document.getElementById("myChart").getContext("2d");
  ctx.canvas.width = 600;
  ctx.canvas.height = 300;

  if (chartInstance) {
    chartInstance.destroy(); // Destruir el gráfico existente
  }

  chartInstance = new Chart(ctx, {
    type: type,
    data: {
      labels: labels,
      datasets: [
        {
          label: nomeGrafico,
          data: values,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: colore,
          borderWidth: 1,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

colore.addEventListener("change", UpdateColor);

download.addEventListener("click", function () {
  if (chartInstance) {
    const nomeGrafico = document.getElementById("nomeGrafico").value;

    const canvas = chartInstance.canvas;
    //const dataURL = canvas.toDataURL("image/png");
    const dataURL = canvas.toDataURL();
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${nomeGrafico}.png`;
    link.click();
  } else {
    console.error("No hay gráfico para descargar");
  }
});
