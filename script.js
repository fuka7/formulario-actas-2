document.addEventListener("DOMContentLoaded", function () {

// ================= SELECTS =================

const organismoSelect = document.getElementById("organismo");
const regionSelect    = document.getElementById("region");
const ciudadSelect    = document.getElementById("ciudad");


// ================= CARGAR REGIONES =================

Object.keys(regionesComunas).forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    regionSelect.appendChild(option);
});


// ================= REGIÓN → CARGAR COMUNAS =================

regionSelect.addEventListener("change", function () {
    ciudadSelect.innerHTML = '<option value="">Seleccione Comuna</option>';
    const comunas = regionesComunas[this.value];
    if (comunas) {
        comunas.forEach(comuna => {
            const option = document.createElement("option");
            option.value = comuna;
            option.textContent = comuna;
            ciudadSelect.appendChild(option);
        });
    }
});


// ================= CARGAR ORGANISMOS =================

serviciosSalud.sort();
seremisSalud.sort();

const grupoServicios = document.createElement("optgroup");
grupoServicios.label = "Servicios de Salud";
serviciosSalud.forEach(servicio => {
    const option = document.createElement("option");
    option.value = servicio;
    option.textContent = servicio;
    grupoServicios.appendChild(option);
});

const grupoSeremi = document.createElement("optgroup");
grupoSeremi.label = "SEREMI de Salud";
seremisSalud.forEach(seremi => {
    const option = document.createElement("option");
    option.value = seremi;
    option.textContent = seremi;
    grupoSeremi.appendChild(option);
});

organismoSelect.appendChild(grupoServicios);
organismoSelect.appendChild(grupoSeremi);


// ================= ORGANISMO → AUTOSELECCIONAR REGIÓN =================

organismoSelect.addEventListener("change", function () {
    const region = organismoRegionMap[this.value];
    if (region) {
        regionSelect.value = region;
        regionSelect.disabled = true;
        regionSelect.style.opacity = '0.65';
        regionSelect.style.cursor = 'not-allowed';
        regionSelect.dispatchEvent(new Event("change"));
        ciudadSelect.value = "";
    } else {
        regionSelect.disabled = false;
        regionSelect.style.opacity = '';
        regionSelect.style.cursor = '';
    }
});


// ================= BOTÓN "SELECCIONAR TODO" =================

const btnSelectAllGlobal = document.querySelector('.select-all-global');

function toggleGlobalSelectAll(btn) {
    const inputs = Array.from(document.querySelectorAll('.checklist input[type="checkbox"]'));
    if (!inputs.length) return;
    const anyUnchecked = inputs.some(i => !i.checked);
    inputs.forEach(i => i.checked = anyUnchecked);
    if (!anyUnchecked) inputs.forEach(i => delete i.dataset.userChecked);
    if (btn) {
        const textEl = btn.querySelector('.btn-text');
        if (textEl) textEl.textContent = anyUnchecked ? 'Deseleccionar todo' : 'Seleccionar todo';
        else btn.textContent = anyUnchecked ? 'Deseleccionar todo' : 'Seleccionar todo';
    }
}

if (btnSelectAllGlobal) {
    (function () {
        const inputs = Array.from(document.querySelectorAll('.checklist input[type="checkbox"]'));
        if (inputs.length && inputs.every(i => i.checked)) {
            const textEl = btnSelectAllGlobal.querySelector('.btn-text');
            if (textEl) textEl.textContent = 'Deseleccionar todo';
        }
    })();

    const allCheckboxes = Array.from(document.querySelectorAll('.checklist input[type="checkbox"]'));

    function updateGlobalButtonState() {
        const anyChecked = document.querySelectorAll('.checklist input[type="checkbox"]:checked').length > 0;
        btnSelectAllGlobal.disabled = !anyChecked;
    }

    allCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateGlobalButtonState);
    });

    updateGlobalButtonState();

    btnSelectAllGlobal.addEventListener('click', () => {
        if (btnSelectAllGlobal.disabled) return;
        toggleGlobalSelectAll(btnSelectAllGlobal);
        updateGlobalButtonState();
    });
}


// ================= CHECKLIST COUNTERS =================

function updateCounter(groupClass, counterId, total) {
    const el = document.getElementById(counterId);
    if (!el) return;
    const checked = document.querySelectorAll(`.checklist.${groupClass} input:checked`).length;
    el.textContent = `${checked} / ${total}`;
}

document.querySelectorAll('.checklist.instalacion input').forEach(cb => {
    cb.addEventListener('change', () => updateCounter('instalacion', 'countInstalacion', 13));
});
document.querySelectorAll('.checklist.validacion input').forEach(cb => {
    cb.addEventListener('change', () => updateCounter('validacion', 'countValidacion', 4));
});


// ================= FIRMA DIGITAL =================

const canvas = document.getElementById("signaturePad");
const ctx    = canvas.getContext("2d");
let drawing      = false;
let hasSignature = false;

function applyCtxStyles() {
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.strokeStyle = "#1e2d3d";
}

function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect  = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    applyCtxStyles();
}

window.addEventListener("resize", resizeCanvas);
requestAnimationFrame(() => requestAnimationFrame(resizeCanvas));

function getPosition(event) {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width  / (window.devicePixelRatio || 1);
    const scaleY = canvas.height / rect.height / (window.devicePixelRatio || 1);
    if (event.touches) {
        return {
            x: (event.touches[0].clientX - rect.left) * scaleX,
            y: (event.touches[0].clientY - rect.top)  * scaleY
        };
    }
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top)  * scaleY
    };
}

function startDraw(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    const ph = document.getElementById('firmaPlaceholder');
    if (ph) ph.style.opacity = '0';
}

function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasSignature = true;
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar && !document.getElementById("firmaBase64").value) {
        btnConfirmar.style.boxShadow = '0 0 0 3px rgba(21,96,189,0.35)';
    }
}

function endDraw() { drawing = false; }

canvas.addEventListener("mousedown",  startDraw);
canvas.addEventListener("mousemove",  draw);
canvas.addEventListener("mouseup",    endDraw);
canvas.addEventListener("mouseleave", endDraw);
canvas.addEventListener("touchstart", startDraw, { passive: false });
canvas.addEventListener("touchmove",  draw,      { passive: false });
canvas.addEventListener("touchend",   endDraw);

window.clearSignature = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("firmaBase64").value = "";
    const ph = document.getElementById('firmaPlaceholder');
    if (ph) ph.style.opacity = '1';
    const confirmed = document.getElementById('firmaConfirmada');
    if (confirmed) confirmed.classList.remove('show');
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar) btnConfirmar.style.boxShadow = '';
    const msg = document.getElementById('firmaErrorMsg');
    if (msg) msg.textContent = '';
    hasSignature = false;
};

window.saveSignature = function () {
    if (!hasSignature) { alert("Debe realizar la firma antes de confirmarla"); return; }
    const dataURL = canvas.toDataURL("image/png");
    document.getElementById("firmaBase64").value = dataURL;
    const btnConfirmar = document.querySelector('.btn-confirmar');
    if (btnConfirmar) btnConfirmar.style.boxShadow = '';
    const msg = document.getElementById('firmaErrorMsg');
    if (msg) msg.textContent = '';
    const confirmed = document.getElementById('firmaConfirmada');
    if (confirmed) confirmed.classList.add('show');
    else alert("Firma confirmada correctamente ✔");
};


// ================= RESET FORMULARIO =================

function resetForm() {
    const form = document.getElementById('registroForm');
    if (form) form.reset();

    const inputs = Array.from(document.querySelectorAll('.checklist input[type="checkbox"]'));
    inputs.forEach(i => { i.checked = false; delete i.dataset.userChecked; });

    const ci = document.getElementById('countInstalacion');
    const cv = document.getElementById('countValidacion');
    if (ci) ci.textContent = '0 / 13';
    if (cv) cv.textContent = '0 / 4';


    if (window.clearSignature) window.clearSignature();
    const hiddenFirma = document.getElementById('firmaBase64');
    if (hiddenFirma) hiddenFirma.value = '';
    const firmaConfirmada = document.getElementById('firmaConfirmada');
    if (firmaConfirmada) firmaConfirmada.classList.remove('show');

    if (btnSelectAllGlobal) {
        btnSelectAllGlobal.disabled = true;
        const textEl = btnSelectAllGlobal.querySelector('.btn-text');
        if (textEl) textEl.textContent = 'Seleccionar todo';
        else btnSelectAllGlobal.textContent = 'Seleccionar todo';
    }

    Array.from(document.querySelectorAll('#registroForm .input-error, #registroForm .input-valid'))
        .forEach(el => el.classList.remove('input-error', 'input-valid'));

    ['errorRutUsuarioDG','errorRutTecnico','errorEmailUsuarioDG','errorCorreoUsuario','errorTelefonoDG',
     'errorRutFirmante','errorCorreoFirmante','errorTelefonoFirmante']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.textContent = ''; }
        });
}


// ================= BOTÓN NUEVA ACTA =================

function mostrarBotonNuevaActa() {
    const btn = document.getElementById('btnNuevaActa');
    if (!btn) return;
    btn.style.display = 'inline-flex';
    btn.onclick = function () {
        resetForm();
        btn.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


// ================= GENERAR PDF =================

window.generarPDF = async function () {
    // Permitir descargar el acta sin requerir firma digital
    const firmaGuardada = document.getElementById("firmaBase64").value;
    const firma = firmaGuardada || "";
    const numeroActa = "ACTA-" + Date.now();
    const g = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

    const data = {
        numeroActa,
        // Si el campo fecha está vacío, dejarlo vacío en el acta
        fecha: g("fecha")
            ? new Date(g("fecha") + 'T12:00:00').toLocaleDateString('es-CL')
            : '',
        // Datos del establecimiento
        organismo:         g("organismo"),
        establecimiento:   g("establecimiento"),
        direccion:         g("direccion"),
        region:            g("region"),
        ciudad:            g("ciudad"),
        unidad:            g("unidad"),
        // Usuario del equipo (Datos Generales)
        usuarioDG:         g("usuarioDG"),
        rutUsuarioDG:      g("rutUsuarioDG"),
        emailUsuarioDG:    g("emailUsuarioDG"),
        telefonoDG:        g("telefonoDG"),
        cargoUsuarioDG:    g("cargoUsuarioDG"),
        // Series
        serieSaliente:     g("serieSaliente"),
        serieRecambio:     g("serieRecambio"),
        // Técnico Instalador
        tecnico:           g("tecnico"),
        rutTecnico:        g("rutTecnico"),
        // Checklists
        instalacionChecks: Array.from(document.querySelectorAll(".checklist.instalacion input")).map(i => i.checked),
        validacionChecks:  Array.from(document.querySelectorAll(".checklist.validacion input")).map(i => i.checked),
        // Firmante
        nombreFirmante:    g("nombreFirmante"),
        firma,
        rutFirmante:       g("rutFirmante"),
        cargoFirmante:     g("cargoFirmante"),
        unidadFirmante:    g("unidadFirmante"),
        correoFirmante:    g("correoFirmante"),
        telefonoFirmante:  g("telefonoFirmante"),
    };

    // Validar requeridos (desactivado para permitir descarga en blanco)
    // const required = Array.from(document.querySelectorAll('#registroForm [required]'));
    // const empty    = required.filter(i => !(i.value || '').toString().trim());
    // if (empty.length) {
    //     empty.forEach(i => {
    //         i.classList.add('input-error', 'input-shake');
    //         i.addEventListener('animationend', function onEnd() {
    //             i.classList.remove('input-shake');
    //             i.removeEventListener('animationend', onEnd);
    //         });
    //     });
    //     empty[0].focus();
    //     return;
    // }

    const contenido = generarContenidoActa(data);
    const tempDiv   = document.createElement("div");
    tempDiv.innerHTML        = contenido;
    tempDiv.style.width      = "210mm";
    tempDiv.style.background = "white";
    tempDiv.style.padding    = "20px";
    tempDiv.style.position   = "fixed";
    tempDiv.style.top        = "10px";
    tempDiv.style.left       = "-10000px";
    tempDiv.style.zIndex     = "9999";
    tempDiv.style.opacity    = "1";
    tempDiv.style.visibility = "visible";
    document.body.appendChild(tempDiv);

    const overlay = document.createElement('div');
    overlay.id = 'pdfOverlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.4)',
        zIndex: '10000', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
    });
    overlay.innerHTML = '<div style="background:#fff;padding:16px 24px;border-radius:8px;font-family:Arial">Generando PDF, por favor espere...</div>';
    document.body.appendChild(overlay);

    await new Promise(resolve => setTimeout(resolve, 1200));

    try {
        const canvasRender = await (window.html2canvas
            ? window.html2canvas(tempDiv, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
            : html2canvas(tempDiv, { scale: 2, backgroundColor: '#ffffff', useCORS: true }));

        const imgData = canvasRender.toDataURL('image/png');
        const JsPDFConstructor =
            (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF :
            (window.jsPDF ? window.jsPDF : null);

        if (!JsPDFConstructor) throw new Error('jsPDF no disponible');

        const pdf        = new JsPDFConstructor({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        const pdfWidth   = pdf.internal.pageSize.getWidth();
        const pdfHeight  = (canvasRender.height * pdfWidth) / canvasRender.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        if (pdfHeight > pageHeight) {
            const scale = pageHeight / pdfHeight;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth * scale, pdfHeight * scale);
        } else {
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        }
        pdf.save(numeroActa + '.pdf');
        mostrarBotonNuevaActa();

    } catch (err) {
        console.error('Error creando PDF:', err);
        await html2pdf().set({
            margin: 10,
            filename: numeroActa + ".pdf",
            html2canvas: { scale: 2, backgroundColor: "#ffffff" },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
        }).from(tempDiv).save();
        mostrarBotonNuevaActa();

    } finally {
        try { if (document.body.contains(tempDiv)) document.body.removeChild(tempDiv); } catch(e){}
        try { if (document.body.contains(overlay)) document.body.removeChild(overlay); } catch(e){}
    }
};


// ================= INICIALIZAR VALIDACIONES =================
inicializarValidaciones();

}); // fin DOMContentLoaded