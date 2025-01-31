// Import CSS
import "../scss/styles.scss";
const invio = document.getElementById("creaGraf");
const visual = document.getElementById("cargaFile");
const archivoXLSL = document.getElementById("file1");
const progressBar = document.getElementById("progressBar");
const selectHoja = document.getElementById("selectHoja");
const AsseX1 = document.getElementById("asseX1");
const AsseY1 = document.getElementById("asseY1");
const chartType = document.getElementById("chartType").value;
const download = document.getElementById("download");

archivoXLSL.addEventListener("change", () => {
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
});

// Evento para leer el archivo Excel al seleccionarlo
archivoXLSL.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result); // archivo en formato binario
    const excel = XLSX.read(data, { type: "array" }); // Leer el contenido del archivo Excel
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

    // Manejar el cambio de selección y la visualización de los datos

    let sheetData = {};

    // Función para obtener los datos de la hoja
    function getSheetData() {
      const selectedSheet = selectHoja.value;
      const sheet = excel.Sheets[selectedSheet];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      return { selectedSheet, sheet, jsonData };
    }

    visual.addEventListener("click", function () {
      sheetData = getSheetData();
      displayData(sheetData.jsonData);

      console.log(sheetData.jsonData[0]);

      const headers =
        sheetData.jsonData.length > 0 ? Object.keys(sheetData.jsonData[0]) : [];

      AsseX1.innerHTML = "";
      headers.forEach((header) => {
        const option = document.createElement("option");
        option.classList.add("px-1");
        option.value = header;
        option.textContent = header;
        AsseX1.appendChild(option);
      });

      AsseY1.innerHTML = "";
      headers.forEach((header) => {
        const option = document.createElement("option");
        option.classList.add("px-1");
        option.value = header;
        option.textContent = header;
        AsseY1.appendChild(option);
      });
    });

    invio.addEventListener("click", function () {
      const chartType = document.getElementById("chartType").value; // Obtener el tipo de gráfico actual
      sheetData = getSheetData();
      generateChart(sheetData.jsonData, chartType);
    });
  };

  reader.readAsArrayBuffer(file); // Leer el archivo como buffer
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

// Función cambio color
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

download.addEventListener("click", () => {
  if (chartInstance) {
    const nomeGrafico = document.getElementById("nomeGrafico").value;

    const canvas = chartInstance.canvas;
    const dataURL = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${nomeGrafico}.png`;
    link.click();
  } else {
    console.error("No hay gráfico para descargar");
  }
});
