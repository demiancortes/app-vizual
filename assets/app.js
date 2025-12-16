/* ============================================================
   app.js - versión actualizada sin medidas en cotización
   + compartir imagen sin descargar
============================================================ */

/* ---------------- NAV ---------------- */
const navLinks = document.querySelectorAll(".bottom-nav .nav-link");
const screens = document.querySelectorAll(".screen");
navLinks.forEach(link => {
	link.addEventListener("click", (e) => {
		e.preventDefault();
		navLinks.forEach(l => l.classList.remove("active"));
		link.classList.add("active");
		const target = link.dataset.target;
		screens.forEach(s => s.classList.add("d-none"));
		document.getElementById(target).classList.remove("d-none");
	});
});

/* ---------------- DEFAULTS ---------------- */
const DEFAULT_PRECIOS = {
	basico: 599,
	intermedio: 850,
	premium: 950,
	semiBlackout: 1250,
	blackout: 1450,
	enrollableBase: 700,
	enrollableExtra: 440
};

const DEFAULT_NOMBRES = {
	basico: "Básico",
	intermedio: "Intermedio",
	premium: "Mejor calidad",
	semiBlackout: "Semiblackout",
	blackout: "Blackout",
	enrollable: "Enrollable"
};

const DEFAULT_COLORES = {
	basico: "#1CC26B",
	intermedio: "#0D6EFD",
	premium: "#6F42C1",
	semiBlackout: "#FFC107",
	blackout: "#DC3545",
	enrollable: "#198754"
};

/* ---------------- Objetos internos ---------------- */
const precios = { ...DEFAULT_PRECIOS };
const nombres = { ...DEFAULT_NOMBRES };
const colores = { ...DEFAULT_COLORES };

const LS_KEYS = {
	PRECIOS: "cotizador_precios_v1"
};

/* ---------------- localStorage ---------------- */
function initLocalStorageIfMissing() {
	if (!localStorage.getItem(LS_KEYS.PRECIOS))
		localStorage.setItem(LS_KEYS.PRECIOS, JSON.stringify(DEFAULT_PRECIOS));
}

function cargarDesdeLocalStorage() {
	const p = JSON.parse(localStorage.getItem(LS_KEYS.PRECIOS)) || {};
	Object.keys(DEFAULT_PRECIOS).forEach(k => {
		precios[k] = Number(p[k] ?? DEFAULT_PRECIOS[k]);
	});
}

initLocalStorageIfMissing();
cargarDesdeLocalStorage();

/* ---------------- fecha corta ---------------- */
function fechaCorta() {
	const mesesCortos = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
	const f = new Date();
	return `${f.getDate()}-${mesesCortos[f.getMonth()]}-${String(f.getFullYear()).slice(2)}`;
}

/* ---------------- DOM refs ---------------- */
const descInput = document.getElementById("desc");
const anchoInput = document.getElementById("ancho");
const altoInput = document.getElementById("alto");
const tabla = document.getElementById("tabla-medidas");
const selectAll = document.getElementById("selectAll");
const btnGenerar = document.getElementById("btnGenerar");
const gruposContainer = document.getElementById("grupos-modelos");

/* ---------------- crear fila ---------------- */
function crearFilaTabla(desc, ancho, alto, modelo, precioCeil) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
		<td><input type="checkbox" class="filaCheck"></td>
		<td>${desc}</td>
		<td><span class="badge" style="background:${colores[modelo]}; color:white;">
			${nombres[modelo]}</span></td>
		<td class="text-end">$${precioCeil}.00</td>
	`;
	return tr;
}

/* ---------------- agregar medida ---------------- */
document.getElementById("btnAgregar").addEventListener("click", () => {
	const desc = descInput.value.trim();
	const ancho = parseFloat(anchoInput.value);
	const alto = parseFloat(altoInput.value);

	if (!desc || isNaN(ancho) || isNaN(alto) || ancho <= 0 || alto <= 0)
		return alert("Llena correctamente descripción, ancho y alto.");

	const modelos = [];
	["basico","intermedio","premium","semiBlackout","blackout","enrollable"].forEach(id => {
		if (document.getElementById(id).checked) modelos.push(id);
	});
	if (!modelos.length) return alert("Selecciona al menos un modelo.");

	if (tabla.children.length === 1 && tabla.children[0].children[0].colSpan === 5)
		tabla.innerHTML = "";

	modelos.forEach(modelo => {
		let precio;
		const m2 = ancho * alto;

		if (modelo !== "enrollable") precio = m2 * precios[modelo];
		else precio = precios.enrollableBase + precios.enrollableExtra * ancho;

		tabla.appendChild(
			crearFilaTabla(desc, ancho, alto, modelo, Math.ceil(precio))
		);
	});

	descInput.value = "";
	anchoInput.value = "";
	altoInput.value = "";
	document.querySelectorAll(".form-check-input").forEach(i => i.checked = false);
});

/* ---------------- select all ---------------- */
selectAll.addEventListener("change", () => {
	document.querySelectorAll(".filaCheck").forEach(ch => ch.checked = selectAll.checked);
});

/* ---------------- generar cotización ---------------- */
btnGenerar.addEventListener("click", () => {
	const checks = [...document.querySelectorAll(".filaCheck:checked")];
	if (!checks.length) return alert("Selecciona al menos una medida.");

	const grupos = {};

	checks.forEach(chk => {
		const tr = chk.closest("tr");
		const desc = tr.children[1].textContent.trim();
		const modeloBadge = tr.children[2].textContent.trim();
		const precioNum = Number(tr.children[3].textContent.replace(/[^0-9.]/g, ""));

		if (!grupos[modeloBadge]) {
			let key = Object.keys(nombres).find(k => nombres[k] === modeloBadge);
			grupos[modeloBadge] = { color: colores[key], items: [], subtotal: 0 };
		}

		grupos[modeloBadge].items.push({ desc, precio: precioNum });
		grupos[modeloBadge].subtotal += precioNum;
	});

	gruposContainer.innerHTML = "";

	for (const modelo in grupos) {
		const group = grupos[modelo];

		const badge = document.createElement("div");
		badge.className = "model-badge";
		badge.style.background = group.color;
		badge.textContent = modelo;
		gruposContainer.appendChild(badge);

		const table = document.createElement("table");
		table.className = "group-table mb-2";
		table.innerHTML = `
			<thead>
				<tr>
					<th>Descripción</th>
					<th class="text-end">Precio</th>
				</tr>
			</thead>
			<tbody></tbody>
		`;

		group.items.forEach(item => {
			const tr = document.createElement("tr");
			tr.innerHTML = `
				<td>${item.desc}</td>
				<td class="text-end">$${item.precio}.00</td>
			`;
			table.querySelector("tbody").appendChild(tr);
		});

		const subtotal = document.createElement("div");
		subtotal.className = "group-subtotal mt-2 mb-2";

		subtotal.innerHTML = `
			<div class="d-flex justify-content-between">
				<span class="fw-bold">Total:</span>
				<span class="fw-bold">$${group.subtotal}.00</span>
			</div>
		`;

		gruposContainer.appendChild(table);
		gruposContainer.appendChild(subtotal);
	}

	// Folio + fecha corta en el badge
	const folio = 1000 + Math.floor(Math.random() * 9000);
	document.getElementById("badge-folio").innerText =
		`COTIZACIÓN #${folio} — ${fechaCorta()}`;

	document.querySelector("[data-target='cotizacion']").click();
});

/* ============================================================
   CONFIGURACIÓN
============================================================ */
function generarFormularioConfiguracion() {
	const div = document.getElementById("config-form");
	let html = `<form id="form-precios">`;

	function row(label, key) {
		return `
			<div class="d-flex justify-content-between align-items-center mb-2">
				<label class="form-label fw-bold mb-0">${label}</label>
				<input class="form-control precio-input w-50" data-key="${key}" value="${precios[key]}">
			</div>
		`;
	}

	html += row("Básico","basico");
	html += row("Intermedio","intermedio");
	html += row("Mejor calidad","premium");
	html += row("Semiblackout","semiBlackout");
	html += row("Blackout","blackout");

	html += `<hr>`;

	html += row("Enrollable Base","enrollableBase");
	html += row("Enrollable Extra (por metro)","enrollableExtra");

	html += `
		<button class="btn btn-success w-100 py-2 mt-3 mb-5">Guardar</button>
	</form>`;

	div.innerHTML = html;

	document.getElementById("form-precios").addEventListener("submit",(e)=>{
		e.preventDefault();

		const nuevos = { ...precios };

		document.querySelectorAll(".precio-input").forEach(inp => {
			nuevos[inp.dataset.key] = Number(inp.value);
		});

		localStorage.setItem(LS_KEYS.PRECIOS, JSON.stringify(nuevos));
		Object.keys(nuevos).forEach(k => precios[k] = nuevos[k]);

		alert("Precios actualizados correctamente.");
		location.reload();
	});
}

generarFormularioConfiguracion();

/* ============================================================
   GENERAR IMAGEN PNG
============================================================ */
document.getElementById("btnGenerarImagen").addEventListener("click", async () => {
	const section = document.getElementById("cotizacion");

	const nav = document.querySelector(".bottom-nav");
	const btn1 = document.getElementById("btnGenerarImagen");
	const btn2 = document.getElementById("btnWhatsApp");

	nav.style.display = "none";
	btn1.style.display = "none";
	btn2.style.display = "none";

	const canvas = await html2canvas(section, {
		scale: 2,
		useCORS: true,
		scrollY: -window.scrollY
	});

	nav.style.display = "";
	btn1.style.display = "";
	btn2.style.display = "";

	const link = document.createElement("a");
	link.download = `cotizacion_${Math.floor(Math.random()*9000)}.png`;
	link.href = canvas.toDataURL("image/png");
	link.click();
});

/* ============================================================
   COMPARTIR IMAGEN POR WHATSAPP SIN DESCARGAR
============================================================ */
async function compartirImagenWhatsApp() {
	const section = document.getElementById("cotizacion");

	const nav = document.querySelector(".bottom-nav");
	const btn1 = document.getElementById("btnGenerarImagen");
	const btn2 = document.getElementById("btnWhatsApp");

	nav.style.display = "none";
	btn1.style.display = "none";
	btn2.style.display = "none";

	const canvas = await html2canvas(section, {
		scale: 2,
		useCORS: true,
		scrollY: -window.scrollY
	});

	nav.style.display = "";
	btn1.style.display = "";
	btn2.style.display = "";

	canvas.toBlob(async (blob) => {
		const archivo = new File([blob], "cotizacion.png", { type: "image/png" });

		if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
			try {
				await navigator.share({
					files: [archivo],
					title: "Cotización"
				});
			} catch (err) {
				console.log("Compartir cancelado", err);
			}
		} else {
			alert("Tu dispositivo no permite compartir imágenes directamente. Usa el botón de Descargar.");
		}
	}, "image/png");
}

document.getElementById("btnWhatsApp").addEventListener("click", compartirImagenWhatsApp);

/* ========================== FIN ========================== */
