/* ============================================================
   ESTADO GLOBAL
============================================================ */
let currentOp = "soma";
let currentSisTab = 2;
let chartInstance = null;

/* ============================================================
   UTILITÁRIOS
============================================================ */
const V = (id) => document.getElementById(id);
const num = (id) => parseFloat(V(id).value) || 0;
const fmt = (n) => {
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toFixed(6)).toString();
};

/* ============================================================
   MATRIZES — RENDERIZAÇÃO
============================================================ */
function getSize() {
  return parseInt(V("matSize").value);
}

function resizeMatrices() {
  const n = getSize();
  renderMatrix("matA", n);
  renderMatrix("matB", n);
  V("calcResult").classList.remove("show");
}

function renderMatrix(id, n) {
  const grid = V(id);
  grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  grid.innerHTML = "";
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const inp = document.createElement("input");
      inp.type = "number";
      inp.id = `${id}_${i}_${j}`;
      inp.value = i === j ? 1 : 0;
      inp.placeholder = "0";
      grid.appendChild(inp);
    }
  }
}

function readMatrix(prefix, n) {
  const M = [];
  for (let i = 0; i < n; i++) {
    M.push([]);
    for (let j = 0; j < n; j++) {
      M[i].push(parseFloat(V(`${prefix}_${i}_${j}`).value) || 0);
    }
  }
  return M;
}

function setOp(op, btn) {
  currentOp = op;
  document
    .querySelectorAll(".op-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const symbols = { soma: "+", sub: "−", mult: "×", det: "" };
  V("opSymbol").textContent = symbols[op];
  V("matBWrapper").style.display = op === "det" ? "none" : "";
  V("opSymbol").style.display = op === "det" ? "none" : "";
  V("calcResult").classList.remove("show");
}

/* ============================================================
   OPERAÇÕES MATRICIAIS
============================================================ */
function matAdd(A, B) {
  return A.map((r, i) => r.map((v, j) => v + B[i][j]));
}
function matSub(A, B) {
  return A.map((r, i) => r.map((v, j) => v - B[i][j]));
}

function matMult(A, B) {
  const n = A.length;
  const R = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      for (let k = 0; k < n; k++) R[i][j] += A[i][k] * B[k][j];
  return R;
}

function det(M) {
  const n = M.length;
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  let d = 0;
  for (let j = 0; j < n; j++) {
    d += Math.pow(-1, j) * M[0][j] * det(minor(M, 0, j));
  }
  return d;
}

function minor(M, row, col) {
  return M.filter((_, i) => i !== row).map((r) =>
    r.filter((_, j) => j !== col),
  );
}

/* ============================================================
   RENDERIZAÇÃO DO RESULTADO
============================================================ */
function renderResultMatrix(R) {
  const n = R.length;
  const html = `
    <div class="result-matrix">
      <span class="result-bracket">[</span>
      <div class="result-grid" style="grid-template-columns:repeat(${n},1fr)">
        ${R.flat()
          .map((v) => `<div class="result-cell">${fmt(v)}</div>`)
          .join("")}
      </div>
      <span class="result-bracket">]</span>
    </div>`;
  return html;
}

function calcular() {
  const n = getSize();
  const A = readMatrix("matA", n);
  const res = V("calcResult");
  const content = V("resultContent");
  res.classList.add("show");

  if (currentOp === "det") {
    const d = det(A);
    content.innerHTML = `<div class="result-scalar">${fmt(d)}</div><p style="margin-top:10px;font-size:0.85rem;color:var(--text-muted);">${Math.abs(d) < 1e-9 ? "⚠ Determinante = 0 → Matriz singular (não invertível)" : "Matriz invertível (det ≠ 0)"}</p>`;
    return;
  }

  const B = readMatrix("matB", n);
  let R;
  if (currentOp === "soma") R = matAdd(A, B);
  else if (currentOp === "sub") R = matSub(A, B);
  else R = matMult(A, B);
  content.innerHTML = renderResultMatrix(R);
}

/* ============================================================
   SISTEMAS LINEARES
============================================================ */
function setSisTab(n, btn) {
  currentSisTab = n;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  V("sis2").style.display = n === 2 ? "" : "none";
  V("sis3").style.display = n === 3 ? "" : "none";
}

/* --- SISTEMA 2x2 --- */
function resolverSistema2() {
  let a = num("s2_a1"),
    b = num("s2_b1"),
    c = num("s2_c1");
  let d = num("s2_a2"),
    e = num("s2_b2"),
    f = num("s2_c2");

  const out = V("result2");

  let steps = `
    <div class="steps-area">
    <div class="steps-title">escalonamento</div>
  `;

  // Step 1: matriz aumentada
  steps += `
    <div class="step-block">
      <strong>Matriz aumentada inicial:</strong><br>
      <code>[ ${a} ${b} | ${c} ]</code><br>
      <code>[ ${d} ${e} | ${f} ]</code>
    </div>
  `;

  // Step 2: eliminar x da segunda linha
  let factor = d / a;

  let d2 = d - factor * a;
  let e2 = e - factor * b;
  let f2 = f - factor * c;

  steps += `
    <div class="step-block">
      <strong>R₂ → R₂ − (${fmt(factor)})R₁</strong><br>
      <code>[ ${fmt(a)} ${fmt(b)} | ${fmt(c)} ]</code><br>
      <code>[ ${fmt(d2)} ${fmt(e2)} | ${fmt(f2)} ]</code>
    </div>
  `;

  if (Math.abs(e2) < 1e-10) {
    out.innerHTML = `<div class="error-msg">Sistema sem solução única.</div>`;
    return;
  }

  let y = f2 / e2;
  let x = (c - b * y) / a;

  steps += `
    <div class="step-block">
      <strong>Resolver y:</strong><br>
      <code>y = ${fmt(f2)} / ${fmt(e2)} = ${fmt(y)}</code>
    </div>

    <div class="step-block">
      <strong>Substituir em R₁ para achar x:</strong><br>
      <code>x = (${fmt(c)} − ${fmt(b)}·${fmt(y)}) / ${fmt(a)} = ${fmt(x)}</code>
    </div>
  </div>
  `;

  out.innerHTML =
    steps +
    `
    <div class="solution-box">
      <div class="sol-item"><div class="sol-var">x =</div><div class="sol-val">${fmt(x)}</div></div>
      <div class="sol-item"><div class="sol-var">y =</div><div class="sol-val">${fmt(y)}</div></div>
    </div>
  `;

  renderGrafico2x2(a, b, c, d, e, f, x, y);
}

/* --- GRÁFICO 2x2 --- */
function renderGrafico2x2(a1, b1, c1, a2, b2, c2, xi, yi) {
  V("graficoWrapper").style.display = "";

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const xRange = [xi - 6, xi + 6];
  const pts = 80;
  const xs = Array.from(
    { length: pts },
    (_, i) => xRange[0] + (i * (xRange[1] - xRange[0])) / (pts - 1),
  );

  const yLine = (a, b, c, x) => (b !== 0 ? (c - a * x) / b : null);

  const data1 = xs
    .map((x) => ({ x, y: yLine(a1, b1, c1, x) }))
    .filter((p) => p.y !== null && isFinite(p.y));
  const data2 = xs
    .map((x) => ({ x, y: yLine(a2, b2, c2, x) }))
    .filter((p) => p.y !== null && isFinite(p.y));

  const ctx = V("grafico2x2").getContext("2d");
  chartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: `Equação 1: ${a1}x + ${b1}y = ${c1}`,
          data: data1,
          borderColor: "#4a9eff",
          backgroundColor: "transparent",
          showLine: true,
          pointRadius: 0,
          borderWidth: 2.5,
          tension: 0,
        },
        {
          label: `Equação 2: ${a2}x + ${b2}y = ${c2}`,
          data: data2,
          borderColor: "#e68a1a",
          backgroundColor: "transparent",
          showLine: true,
          pointRadius: 0,
          borderWidth: 2.5,
          tension: 0,
        },
        {
          label: `Interseção (${fmt(xi)}, ${fmt(yi)})`,
          data: [{ x: xi, y: yi }],
          borderColor: "#1a9e6e",
          backgroundColor: "#1a9e6e",
          pointRadius: 8,
          pointHoverRadius: 10,
          showLine: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.datasetIndex === 2)
                return ` Interseção: (${fmt(xi)}, ${fmt(yi)})`;
              return ` (${fmt(ctx.parsed.x)}, ${fmt(ctx.parsed.y)})`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "x",
            color: "#6b7d8f",
            font: {
              family: "DM Serif Display",
              style: "italic",
              size: 13,
            },
          },
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: {
            color: "#6b7d8f",
            font: { family: "DM Mono", size: 11 },
          },
        },
        y: {
          title: {
            display: true,
            text: "y",
            color: "#6b7d8f",
            font: {
              family: "DM Serif Display",
              style: "italic",
              size: 13,
            },
          },
          grid: { color: "rgba(0,0,0,0.06)" },
          ticks: {
            color: "#6b7d8f",
            font: { family: "DM Mono", size: 11 },
          },
        },
      },
    },
  });

  V("chartLegend").innerHTML = `
    <div class="legend-item"><div class="legend-dot" style="background:#4a9eff"></div><span>Equação 1: ${a1}x + ${b1}y = ${c1}</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#e68a1a"></div><span>Equação 2: ${a2}x + ${b2}y = ${c2}</span></div>
    <div class="legend-item"><div class="legend-dot" style="background:#1a9e6e"></div><span>Interseção: (${fmt(xi)}, ${fmt(yi)})</span></div>`;
}

/* --- SISTEMA 3x3 --- */
function det3(M) {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
}

function resolverSistema3() {
  let A = [
    [num("s3_a1"), num("s3_b1"), num("s3_c1"), num("s3_d1")],
    [num("s3_a2"), num("s3_b2"), num("s3_c2"), num("s3_d2")],
    [num("s3_a3"), num("s3_b3"), num("s3_c3"), num("s3_d3")],
  ];

  const out = V("result3");

  let steps = `
    <div class="steps-area">
    <div class="steps-title">escalonamento (3×3)</div>
  `;

  // Mostrar matriz inicial
  steps += `
    <div class="step-block">
      <strong>Matriz aumentada:</strong><br>
      ${A.map((r) => `<code>[ ${r.map(fmt).join(" ")} ]</code>`).join("<br>")}
    </div>
  `;

  // Eliminação
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      let factor = A[j][i] / A[i][i];
      for (let k = i; k < 4; k++) {
        A[j][k] -= factor * A[i][k];
      }

      steps += `
        <div class="step-block">
          <strong>R${j + 1} → R${j + 1} − (${fmt(factor)})R${i + 1}</strong><br>
          ${A.map((r) => `<code>[ ${r.map(fmt).join(" ")} ]</code>`).join("<br>")}
        </div>
      `;
    }
  }

  // Back substitution
  let z = A[2][3] / A[2][2];
  let y = (A[1][3] - A[1][2] * z) / A[1][1];
  let x = (A[0][3] - A[0][2] * z - A[0][1] * y) / A[0][0];

  steps += `
    <div class="step-block">
      <strong>Substituição regressiva:</strong><br>
      <code>z = ${fmt(z)}</code><br>
      <code>y = ${fmt(y)}</code><br>
      <code>x = ${fmt(x)}</code>
    </div>
  </div>
  `;

  out.innerHTML =
    steps +
    `
    <div class="solution-box">
      <div class="sol-item"><div class="sol-var">x =</div><div class="sol-val">${fmt(x)}</div></div>
      <div class="sol-item"><div class="sol-var">y =</div><div class="sol-val">${fmt(y)}</div></div>
      <div class="sol-item"><div class="sol-var">z =</div><div class="sol-val">${fmt(z)}</div></div>
    </div>
  `;
}
window.addEventListener("DOMContentLoaded", () => {
  resizeMatrices();
});

window.MathJax = {
  tex: {
    inlineMath: [
      ["\\(", "\\)"],
      ["$", "$"],
    ],
    displayMath: [["$$", "$$"]],
  },
  startup: {
    ready() {
      MathJax.startup.defaultReady();
    },
  },
};
