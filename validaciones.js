// ================= VALIDACIONES Y AUTOCOMPLETE =================

// ---------------------------------------------------------------
// FORMATEAR RUT
// ---------------------------------------------------------------
function formatearRut(rut) {
    rut = rut.replace(/[^0-9kK]/g, '').toUpperCase();
    if (rut.length <= 1) return rut;
    let cuerpo = rut.slice(0, -1);
    let dv = rut.slice(-1);
    cuerpo = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return cuerpo + "-" + dv;
}

// ---------------------------------------------------------------
// VALIDAR RUT 
// ---------------------------------------------------------------
function validarRut(rut) {
    rut = rut.replace(/\./g, '').toUpperCase();
    const rutRegex = /^[0-9]{1,8}-[0-9K]{1}$/;
    if (!rutRegex.test(rut)) return false;
    const [cuerpo, dv] = rut.split('-');
    let suma = 0;
    let multiplo = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplo;
        multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    let dvEsperado = 11 - (suma % 11);
    if (dvEsperado === 11) dvEsperado = "0";
    else if (dvEsperado === 10) dvEsperado = "K";
    else dvEsperado = dvEsperado.toString();
    return dv === dvEsperado;
}

// ---------------------------------------------------------------
// ACTIVAR VALIDACIÓN RUT (en tiempo real)
// ---------------------------------------------------------------
function activarValidacionRut(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return;

    input.addEventListener("input", function () {
        this.value = formatearRut(this.value);
        if (this.value.length < 3) {
            error.style.display = "none";
            input.classList.remove("input-error", "input-valid");
            return;
        }
        if (validarRut(this.value)) {
            error.textContent = "✔ RUT válido";
            error.className = "error-message valid-message";
            error.style.display = "block";
            input.classList.remove("input-error");
            input.classList.add("input-valid");
        } else {
            error.textContent = "RUT ingresado incorrecto";
            error.className = "error-message invalid-message";
            error.style.display = "block";
            input.classList.remove("input-valid");
            input.classList.add("input-error");
        }
    });
}

// ---------------------------------------------------------------
// DOMINIOS DE CORREO MINSAL (para autocomplete)
// ---------------------------------------------------------------
const DOMINIOS_EMAIL = [
    "redsalud.gob.cl",
    "minsal.cl",
    "seremi.gob.cl",
    "gmail.com",
    "outlook.com",
    "hotmail.com",
];

// ---------------------------------------------------------------
// ACTIVAR VALIDACIÓN EMAIL + AUTOCOMPLETE DE DOMINIO
// ---------------------------------------------------------------
function activarValidacionEmail(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return;

    const esValido = val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    // --- Dropdown de dominios ---
    const wrapper = input.closest('div') || input.parentElement;
    if (wrapper) wrapper.style.position = 'relative';

    const dropdown = document.createElement('ul');
    dropdown.style.cssText = [
        'position:absolute',
        'top:100%',
        'left:0',
        'right:0',
        'background:white',
        'border:1px solid #c0cfe0',
        'border-radius:6px',
        'box-shadow:0 4px 16px rgba(0,0,0,0.13)',
        'list-style:none',
        'margin:2px 0 0',
        'padding:4px 0',
        'z-index:9999',
        'display:none',
        'max-height:200px',
        'overflow-y:auto'
    ].join(';');
    wrapper.appendChild(dropdown);

    function ocultarDropdown() { dropdown.style.display = 'none'; }

    function mostrarDropdown(val) {
        const atIdx = val.lastIndexOf('@');
        // Solo mostrar si hay @ y aún no hay un dominio completo válido
        if (atIdx === -1) { ocultarDropdown(); return; }

        const prefijo   = val.slice(0, atIdx + 1); // "usuario@"
        const sufijo    = val.slice(atIdx + 1);    // lo que hay después del @

        const coinciden = DOMINIOS_EMAIL.filter(d =>
            d.toLowerCase().startsWith(sufijo.toLowerCase())
        );

        if (!coinciden.length || esValido(val)) { ocultarDropdown(); return; }

        dropdown.innerHTML = '';
        coinciden.forEach(dominio => {
            const li = document.createElement('li');
            // Resaltar la parte ya escrita
            li.innerHTML =
                `<strong style="color:#1560BD">${dominio.slice(0, sufijo.length)}</strong>` +
                dominio.slice(sufijo.length);
            li.style.cssText = 'padding:7px 12px;cursor:pointer;font-size:12px;color:#222;font-family:monospace;';
            li.title = prefijo + dominio;
            li.addEventListener('mousedown', e => {
                e.preventDefault();
                input.value = prefijo + dominio;
                ocultarDropdown();
                input.dispatchEvent(new Event('input')); // re-validar
                input.focus();
            });
            li.addEventListener('mouseover', () => li.style.background = '#f0f6ff');
            li.addEventListener('mouseout',  () => li.style.background = '');
            dropdown.appendChild(li);
        });
        dropdown.style.display = 'block';
    }

    // Navegación con teclado en el dropdown
    input.addEventListener('keydown', function (e) {
        const items = Array.from(dropdown.querySelectorAll('li'));
        if (dropdown.style.display === 'none' || !items.length) return;
        const activeIdx = items.findIndex(li => li.classList.contains('active'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeIdx >= 0) { items[activeIdx].classList.remove('active'); items[activeIdx].style.background = ''; }
            const next = items[Math.min(activeIdx + 1, items.length - 1)];
            next.classList.add('active'); next.style.background = '#f0f6ff';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeIdx >= 0) { items[activeIdx].classList.remove('active'); items[activeIdx].style.background = ''; }
            const prev = items[Math.max(activeIdx - 1, 0)];
            prev.classList.add('active'); prev.style.background = '#f0f6ff';
        } else if ((e.key === 'Enter' || e.key === 'Tab') && activeIdx >= 0) {
            e.preventDefault();
            items[activeIdx].dispatchEvent(new Event('mousedown'));
        } else if (e.key === 'Escape') {
            ocultarDropdown();
        }
    });

    // --- Validación en tiempo real ---
    input.addEventListener("input", function () {
        const val = this.value.trim();
        mostrarDropdown(val);
        if (!val) {
            error.style.display = "none";
            input.classList.remove("input-error", "input-valid");
            return;
        }
        if (esValido(val)) {
            error.textContent = "✔ Email válido";
            error.className = "error-message valid-message";
            error.style.display = "block";
            input.classList.remove("input-error");
            input.classList.add("input-valid");
            ocultarDropdown();
        } else {
            error.textContent = "Ingrese un email válido (ej: nombre@dominio.cl)";
            error.className = "error-message invalid-message";
            error.style.display = "block";
            input.classList.remove("input-valid");
            input.classList.add("input-error");
        }
    });

    input.addEventListener("blur", function () {
        setTimeout(ocultarDropdown, 150);
        if (!this.value.trim()) {
            error.style.display = "none";
            input.classList.remove("input-error", "input-valid");
        }
    });
}

// ---------------------------------------------------------------
// ACTIVAR VALIDACIÓN TELÉFONO
// ---------------------------------------------------------------
function activarValidacionTelefono(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return;

    const esValido = val => /^\d{7,15}$/.test(val.replace(/[\s\-().+]/g, ''));

    input.addEventListener("input", function () {
        const val = this.value.trim();
        if (!val) {
            error.style.display = "none";
            input.classList.remove("input-error", "input-valid");
            return;
        }
        if (esValido(val)) {
            error.textContent = "✔ Teléfono válido";
            error.className = "error-message valid-message";
            error.style.display = "block";
            input.classList.remove("input-error");
            input.classList.add("input-valid");
        } else {
            error.textContent = "Ingrese un teléfono válido (ej: +56 9 1234 5678)";
            error.className = "error-message invalid-message";
            error.style.display = "block";
            input.classList.remove("input-valid");
            input.classList.add("input-error");
        }
    });

    input.addEventListener("blur", function () {
        if (!this.value.trim()) {
            error.style.display = "none";
            input.classList.remove("input-error", "input-valid");
        }
    });
}

// ---------------------------------------------------------------
// AUTOCOMPLETE UNIDAD / DEPARTAMENTO
// ---------------------------------------------------------------
const UNIDADES = [
    // Clínicas y atención
    "Urgencia",
    "Urgencia Pediátrica",
    "Unidad de Cuidados Intensivos (UCI)",
    "Unidad de Cuidados Intermedios (UCIM)",
    "Unidad de Cuidados Intensivos Pediátricos (UCIP)",
    "Unidad de Cuidados Intensivos Neonatales (UCIN)",
    "Unidad de Paciente Crítico (UPC)",
    "Pabellón Quirúrgico",
    "Pabellón Obstétrico",
    "Anestesiología",
    "Cirugía",
    "Cirugía Pediátrica",
    "Medicina Interna",
    "Traumatología",
    "Ortopedia",
    "Neurología",
    "Neurocirugía",
    "Cardiología",
    "Oncología",
    "Hematología",
    "Nefrología",
    "Diálisis",
    "Urología",
    "Ginecología",
    "Obstetricia",
    "Maternidad",
    "Neonatología",
    "Pediatría",
    "Oftalmología",
    "Otorrinolaringología",
    "Dermatología",
    "Endocrinología",
    "Reumatología",
    "Infectología",
    "Psiquiatría",
    "Salud Mental",
    "Geriatría",
    "Medicina Física y Rehabilitación",
    "Kinesiología",
    "Terapia Ocupacional",
    "Fonoaudiología",
    // Diagnóstico y apoyo clínico
    "Laboratorio Clínico",
    "Banco de Sangre",
    "Imagenología",
    "Radiología",
    "Ecografía",
    "Scanner / Tomografía",
    "Resonancia Magnética",
    "Medicina Nuclear",
    "Anatomía Patológica",
    "Farmacia",
    "Nutrición y Dietética",
    "Esterilización",
    "Pabellón de Procedimientos",
    // Consulta Externa / Ambulatorio
    "Consultorio Adosado de Especialidades (CAE)",
    "Unidad de Medicina Preventiva",
    "Centro de Salud Familiar (CESFAM)",
    "Programa de Salud Cardiovascular (PSCV)",
    "GES",
    "SOME",
    "Policlínico",
    "Consultorio de Especialidades",
    // Administración y gestión
    "Administración",
    "Dirección",
    "Subdirección Médica",
    "Subdirección Administrativa",
    "Subdirección de Gestión del Cuidado",
    "Recursos Humanos",
    "Finanzas",
    "Contabilidad",
    "Abastecimiento",
    "Bodega",
    "Informática",
    "Tecnologías de la Información (TI)",
    "Comunicaciones",
    "Calidad y Seguridad del Paciente",
    "Gestión Clínica",
    "Servicio al Paciente",
    "Trabajo Social",
    "Asesoría Jurídica",
    "Oficina de Partes",
    // Infraestructura
    "Mantención",
    "Servicios Generales",
    "Aseo y Ornato",
    "Lavandería",
    "Alimentación y Casino",
    "Central de Esterilización y Equipos (CEyE)",
];

function activarAutocompleteUnidad(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const wrapper = input.parentElement;
    if (wrapper) wrapper.style.position = 'relative';

    const dropdown = document.createElement('ul');
    dropdown.style.cssText = [
        'position:absolute',
        'top:100%',
        'left:0',
        'right:0',
        'background:white',
        'border:1px solid #c0cfe0',
        'border-radius:6px',
        'box-shadow:0 4px 16px rgba(0,0,0,0.13)',
        'list-style:none',
        'margin:2px 0 0',
        'padding:4px 0',
        'z-index:9999',
        'display:none',
        'max-height:220px',
        'overflow-y:auto'
    ].join(';');
    wrapper.appendChild(dropdown);

    function ocultar() { dropdown.style.display = 'none'; }

    function normalizar(str) {
        return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function mostrar(filtro) {
        const q = normalizar(filtro.trim());
        const coincidentes = q
            ? UNIDADES.filter(u => normalizar(u).includes(q))
            : UNIDADES;

        if (!coincidentes.length) { ocultar(); return; }

        dropdown.innerHTML = '';
        coincidentes.slice(0, 10).forEach(unidad => {
            const li = document.createElement('li');
            if (q) {
                const idx = normalizar(unidad).indexOf(q);
                if (idx !== -1) {
                    li.innerHTML =
                        unidad.slice(0, idx) +
                        `<strong style="color:#1560BD">${unidad.slice(idx, idx + filtro.trim().length)}</strong>` +
                        unidad.slice(idx + filtro.trim().length);
                } else {
                    li.textContent = unidad;
                }
            } else {
                li.textContent = unidad;
            }
            li.style.cssText = 'padding:7px 12px;cursor:pointer;font-size:12px;color:#222;';
            li.addEventListener('mousedown', e => {
                e.preventDefault();
                input.value = unidad;
                ocultar();
                input.focus();
            });
            li.addEventListener('mouseover', () => li.style.background = '#f0f6ff');
            li.addEventListener('mouseout',  () => li.style.background = '');
            dropdown.appendChild(li);
        });
        dropdown.style.display = 'block';
    }

    input.addEventListener('input',  function () { mostrar(this.value); });
    input.addEventListener('focus',  function () { mostrar(this.value); });
    input.addEventListener('blur',   () => setTimeout(ocultar, 150));

    // Navegación con teclado
    input.addEventListener('keydown', function (e) {
        const items = Array.from(dropdown.querySelectorAll('li'));
        if (dropdown.style.display === 'none' || !items.length) return;
        const activeIdx = items.findIndex(li => li.classList.contains('active'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (activeIdx >= 0) { items[activeIdx].classList.remove('active'); items[activeIdx].style.background = ''; }
            const next = items[Math.min(activeIdx + 1, items.length - 1)];
            next.classList.add('active'); next.style.background = '#f0f6ff';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (activeIdx >= 0) { items[activeIdx].classList.remove('active'); items[activeIdx].style.background = ''; }
            const prev = items[Math.max(activeIdx - 1, 0)];
            prev.classList.add('active'); prev.style.background = '#f0f6ff';
        } else if ((e.key === 'Enter' || e.key === 'Tab') && activeIdx >= 0) {
            e.preventDefault();
            items[activeIdx].dispatchEvent(new Event('mousedown'));
        } else if (e.key === 'Escape') {
            ocultar();
        }
    });
}

// ---------------------------------------------------------------
// VALIDACIÓN DE CAMPOS REQUERIDOS AL SALIR DEL CAMPO
// ---------------------------------------------------------------
// function activarValidacionRequeridos() {
//     const required = Array.from(document.querySelectorAll('#registroForm [required]'));
//     required.forEach(input => {
//         input.addEventListener('blur', () => {
//             const val = (input.value || '').toString().trim();
//             if (!val) {
//                 input.classList.add('input-error', 'input-shake');
//                 input.addEventListener('animationend', function onEnd() {
//                     input.classList.remove('input-shake');
//                     input.removeEventListener('animationend', onEnd);
//                 });
//             } else {
//                 input.classList.remove('input-error', 'input-valid');
//             }
//         });
//     });
// }

// ---------------------------------------------------------------
// INIT
// ---------------------------------------------------------------
// function inicializarValidaciones() {
//     // Datos Generales (usuario del equipo)
//     activarValidacionRut("rutUsuarioDG",       "errorRutUsuarioDG");
//     activarValidacionEmail("emailUsuarioDG",   "errorEmailUsuarioDG");
//     activarValidacionTelefono("telefonoDG",    "errorTelefonoDG");


//     // Usuario Asignado (responsable MINSAL)
//     activarValidacionRut("rutUsuarioAsignado", "errorRutUsuarioAsignado");
//     activarValidacionEmail("correoUsuario",    "errorCorreoUsuario");
//     activarValidacionTelefono("telefonoUsuario", "errorTelefonoUsuario");

//     // Datos Firmante (solo activos cuando el checkbox NO está marcado)
//     activarValidacionRutFirmante("rutFirmante",       "errorRutFirmante");
//     activarValidacionEmail("correoFirmante",          "errorCorreoFirmante");
//     activarValidacionTelefono("telefonoFirmante",     "errorTelefonoFirmante");

//     activarAutocompleteUnidad("unidad");
//     activarAutocompleteUnidad("unidadUsuario");
//     activarAutocompleteUnidad("unidadFirmante");

//     activarValidacionRequeridos();
// }

// ---------------------------------------------------------------
// ACTIVAR VALIDACIÓN RUT FIRMANTE (solo si sección visible)
// ---------------------------------------------------------------
function activarValidacionRutFirmante(inputId, errorId) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return;

    input.addEventListener("input", function () {
        // Ignorar si el firmante es el mismo que el usuario asignado
        if (document.getElementById('mismoFirmante')?.checked) return;
        this.value = formatearRut(this.value);
        if (this.value.length < 3) {
            error.style.display = "none";
            input.classList.remove("input-error", "input-valid");
            return;
        }
        if (validarRut(this.value)) {
            error.textContent = "✔ RUT válido";
            error.className = "error-message valid-message";
            error.style.display = "block";
            input.classList.remove("input-error");
            input.classList.add("input-valid");
        } else {
            error.textContent = "RUT ingresado incorrecto";
            error.className = "error-message invalid-message";
            error.style.display = "block";
            input.classList.remove("input-valid");
            input.classList.add("input-error");
        }
    });
}

// ---------------------------------------------------------------
// LIMPIAR ERRORES DE LOS CAMPOS FIRMANTE (al marcar checkbox)
// ---------------------------------------------------------------
function limpiarValidacionesFirmante() {
    const fields = [
        { input: 'nombreFirmante',   error: null },
        { input: 'rutFirmante',      error: 'errorRutFirmante' },
        { input: 'cargoFirmante',    error: null },
        { input: 'unidadFirmante',   error: null },
        { input: 'correoFirmante',   error: 'errorCorreoFirmante' },
        { input: 'telefonoFirmante', error: 'errorTelefonoFirmante' },
    ];
    fields.forEach(({ input: id, error: eid }) => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            el.classList.remove('input-error', 'input-valid');
        }
        if (eid) {
            const err = document.getElementById(eid);
            if (err) { err.style.display = 'none'; err.textContent = ''; }
        }
    });
}