import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Spinner, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheckCircle, faTimes, faDownload, faEye, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import './formato_banner.css';
import Banner_semantico from '../../img/banner_semantico.png';
import Banner_ipa from '../../img/banner_ipa.png';
import Banner_home from '../../img/banner_home.png';
import ChipInput from "../../components/ChipInput/ChipInput";

function FormatoBanner() {
    const [formData, setFormData] = useState({
        tipoPlataforma: '',
        tipoBanner: '',
        laboratorio: '',
        nombreCampana: '',
        duracionCampana: '',
        keywordsWeb: [],
        keywordsApp: [],
        especialidades: '',
        comentarios: '',
        imagenes: [] // ← AHORA ES UN ARRAY DE IMÁGENES
        // { file, preview, width, height, sizeKB, name, format, isValid }
    });

    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
    const [show, setShow] = useState(false);


    // URL del webhook de Make (reemplaza con la tuya)
    const MAKE_WEBHOOK_URL = 'http://localhost:5678/webhook-test/banner-validation';

    // Banners para WEB
    const bannerInfoWeb = {
        'Banner Home Web': {
            destinado: 'Pacientes y Médicos',
            dimensiones: '1220 × 320 px',
            formato: 'JPG, PNG o GIF',
            peso: 'Máx 2MB',
            color: 'RGB, 72 dpi'
        },
        'Banner Keyword Buscador': {
            destinado: 'Pacientes y Médicos',
            dimensiones: '1400 × 256 px',
            formato: 'JPG, PNG o GIF',
            peso: 'Máx 2MB',
            color: 'RGB, 72 dpi'
        },
        'Banner IPPA Web': {
            destinado: 'Pacientes y Médicos',
            dimensiones: ['285 × 517 px', '649 × 325 px'],
            formato: 'JPG, PNG o GIF',
            peso: 'Máx 2MB',
            color: 'RGB, 72 dpi'
        }
    };
    const bannerInfoApp = {
        'Banner Bienvenida': {
            destinado: 'Pacientes',
            dimensiones: '1050 × 614 px',
            formato: 'JPG, PNG o GIF',
            peso: 'Máx 3MB',
            color: 'RGB, 72 dpi'
        },
        'Video Bienvenida': {
            destinado: 'Pacientes',
            dimensiones: '1028 × 720 px',
            formato: 'MP4 (16:9)',
            peso: 'Máx 50MB recomendado',
            color: 'RGB'
        },
        'Banner Home App': {
            destinado: 'Pacientes y Médicos',
            dimensiones: ['960 × 240 px', '1400 × 256 px'],
            formato: 'JPG, PNG o GIF',
            peso: 'Máx 3MB',
            color: 'RGB, 72 dpi'
        },
        'Banner Keywords App': {
            destinado: 'Pacientes y Médicos',
            dimensiones: ['960 × 240 px', '1400 × 256 px'],
            formato: 'JPG, PNG o GIF',
            peso: 'Máx 3MB',
            color: 'RGB, 72 dpi'
        },
        'Ícono Podcast': {
            destinado: 'Pacientes',
            dimensiones: '300 × 300 px',
            formato: 'PNG (con fondo transparente recomendado)',
            peso: 'Máx 1MB',
            color: 'RGB'
        }
    };



    // Información del modal para cada tipo de banner
    const bannerModalInfo = {
        "Banner Home Web": {
            ubicacion: "Banner Home - Web",
            imagen: Banner_home // Reemplaza con tu imagen real
        },
        "Banner Keyword Buscador": {
            ubicacion: "Keyword Buscador - Web",
            imagen: Banner_semantico // Reemplaza con tu imagen real
        },
        "Banner IPPA Web": {
            ubicacion: "Banner IPPA - Web",
            imagen: Banner_ipa // Reemplaza con tu imagen real
        },
        "Banner Bienvenida": {
            ubicacion: "Banner Bienvenida - App",
            imagen: Banner_home // Reemplaza con tu imagen real
        },
        "Video Bienvenida": {
            ubicacion: "Video Bienvenida - App",
            imagen: Banner_home // Reemplaza con tu imagen real
        },
        "Banner Home App": {
            ubicacion: "Banner Home - App",
            imagen: Banner_home // Reemplaza con tu imagen real
        },
        "Banner Keywords App": {
            ubicacion: "Keywords - App",
            imagen: Banner_semantico // Reemplaza con tu imagen real
        },
        "Ícono Podcast": {
            ubicacion: "Ícono Podcast - App",
            imagen: Banner_home // Reemplaza con tu imagen real
        }
    };

    // MEDIDAS ESPERADAS PARA VALIDACIÓN AUTOMÁTICA
    const medidasEsperadas = {
        'Banner Home Web': [[1220, 320]],
        'Banner Keyword Buscador': [[1400, 256]],
        'Banner IPPA Web': [[285, 517], [649, 325]],
        'Banner Bienvenida': [[1050, 614]],
        'Banner Home App': [[960, 240], [1400, 256]],
        'Banner Keywords App': [[960, 240], [1400, 256]],
        'Ícono Podcast': [[300, 300]]
        // Video Bienvenida lo ignoramos porque es MP4
    };

    const getMedidasEsperadas = () => {
        if (!formData.tipoBanner || formData.tipoBanner.includes('Video')) return [];
        return medidasEsperadas[formData.tipoBanner] || [];
    };

    const cantidadEsperada = getMedidasEsperadas().length;


    const getBannerOptions = () => {
        if (!formData.tipoPlataforma) return [];

        if (formData.tipoPlataforma === 'Web') {
            return Object.keys(bannerInfoWeb).map(key => ({
                value: key,
                label: key
            }));
        }

        if (formData.tipoPlataforma === 'App') {
            return Object.keys(bannerInfoApp).map(key => ({
                value: key,
                label: key
            }));
        }

        // Para "Ambos"
        const webOptions = Object.keys(bannerInfoWeb).map(k => ({
            value: k,
            label: `${k}`
        }));
        const appOptions = Object.keys(bannerInfoApp).map(k => ({
            value: k,
            label: `${k}`
        }));
        return [...webOptions, ...appOptions];
    };


    const selectedBannerModal = formData.tipoBanner ? bannerModalInfo[formData.tipoBanner] : null;

    const handleOpen = () => setShow(true);
    const handleClose = () => setShow(false);



    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    // Esto va arriba con los demás useState


    // Esto reemplaza tu handleChange actual del select de plataforma
    const handlePlataformaChange = (e) => {
        const valor = e.target.value;
        setFormData(prev => ({
            ...prev,
            tipoPlataforma: valor
        }));

        // Si elige solo Web o solo App, limpiamos el otro campo
        if (valor === 'Web') {
            setFormData(prev => ({ ...prev, keywordsApp: [] }));
        } else if (valor === 'App') {
            setFormData(prev => ({ ...prev, keywordsWeb: [] }));
        }
    };



    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };
    // ==================== OBTENER INFO DEL BANNER SELECCIONADO ====================
    const getSelectedBannerInfo = () => {
        if (!formData.tipoBanner) return null;
        if (formData.tipoPlataforma === "Web" || formData.tipoPlataforma === "Ambos") {
            return bannerInfoWeb[formData.tipoBanner] || null;
        }
        return bannerInfoApp[formData.tipoBanner] || null;
    };

    // PROCESAR Y VALIDAR IMAGEN
    const procesarImagen = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const sizeKB = (file.size / 1024).toFixed(1);
                    const format = file.type.split('/')[1].toUpperCase();

                    const medidas = getMedidasEsperadas();
                    let valida = false;
                    let medidaTexto = '';

                    for (let i = 0; i < medidas.length; i++) {
                        if (img.width === medidas[i][0] && img.height === medidas[i][1]) {
                            valida = true;
                            medidaTexto = `${medidas[i][0]}×${medidas[i][1]}px`;
                            break;
                        }
                    }

                    resolve({
                        file,
                        preview: e.target.result,
                        width: img.width,
                        height: img.height,
                        size: sizeKB + ' KB',
                        name: file.name,
                        format,
                        valida,
                        medidaTexto
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    // MANEJAR SUBIDA MÚLTIPLE
    const handleFileChangeMultiple = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            if (formData.imagenes.length >= cantidadEsperada) break;
            if (!file.type.startsWith('image/')) continue;

            const imgData = await procesarImagen(file);
            setFormData(prev => ({
                ...prev,
                imagenes: [...prev.imagenes, imgData]
            }));
        }
        e.target.value = '';
    };



    // Función para eliminar imagen del array
    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            imagenes: prev.imagenes.filter((_, i) => i !== index)
        }));
    };

    // Manejar drop de imágenes
    const handleDrop = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        for (const file of files) {
            if (formData.imagenes.length >= cantidadEsperada) break;
            if (!file.type.startsWith('image/')) continue;

            const imgData = await procesarImagen(file);
            setFormData(prev => ({
                ...prev,
                imagenes: [...prev.imagenes, imgData]
            }));
        }
    };
    const handleDownloadPDF = async () => {
        setLoadingPDF(true);

        try {
            const html2pdf = (await import('html2pdf.js')).default;

            const fechaActual = new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // 👇 AQUÍ PEGAS TU BASE64 DE LA PLANTILLA PARA BANNER
            const plantillaBase64 = "data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC6n/wQYAAzyo53Fraa/AAAAAElFTkSuQmCC";

            const contenidoHTML = `
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { margin: 0; padding: 0; width: 297mm; height: 210mm; }
    .pagina { 
        position: relative; 
        width: 297mm; 
        height: 210mm; 
        background: white;
    }
    .fondo-plantilla {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
    }
    .contenido-real {
        position: absolute;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
        padding: 15mm 12mm;
        z-index: 2;
        font-family: Arial, sans-serif;
    }
    .header { border-bottom: 2px solid #0066cc; margin-bottom: 8px; padding-bottom:8px; }
    .title { font-size: 14px; font-weight: bold; color: #333; text-align: right; }
    .seccion-titulo {
        background-color: #E8F4FD;
        color: #4A90E2;
        font-weight: bold;
        font-size: 14px;
        padding: 10px;
        text-align: center;
        margin: 15px 0 10px 0;
    }
    .dato-label {
        color: #4A90E2;
        font-size: 11px;
        font-weight: bold;
        padding: 5px 0;
        border-bottom: 1px solid #4A90E2;
    }
    .dato-valor {
        font-size: 13px;
        padding: 8px 0;
        min-height: 60px;
        vertical-align: top;
    }
    .arte-container {
        border: 2px solid #4A90E2;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        background: white;
        height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .arte-container img {
        max-width: 100%;
        max-height: 190px;
        object-fit: contain;
    }
    .metrica-box {
        border: 1px solid #4A90E2;
        border-radius: 6px;
        overflow: hidden;
        margin: 5px;
    }
    .metrica-header {
        background-color: #E8F4FD;
        color: #4A90E2;
        font-weight: bold;
        font-size: 12px;
        padding: 8px;
        text-align: center;
    }
    .metrica-valor {
        background: white;
        padding: 12px;
        font-size: 13px;
        min-height: 70px;
    }
</style>

<div class="pagina">
    <img src="${plantillaBase64}" class="fondo-plantilla" />
    <div class="contenido-real">
        <div class="header">
            <table width="100%"><tr><td class="title"><strong>Fecha:</strong> ${fechaActual}</td></tr></table>
        </div>

        <div class="seccion-titulo">FORMATO PARA SUBIDA DE BANNERS</div>

        <table width="100%" style="margin-top: 15px;">
            <tr>
                <td width="65%" valign="top" style="padding-right: 15px;">
                    <table width="100%">
                        <tr>
                            <td width="50%"><div class="dato-label">Tipo de plataforma</div><div class="dato-valor">${formData.tipoPlataforma || '-'}</div></td>
                            <td width="50%"><div class="dato-label">Tipo de Banner</div><div class="dato-valor">${formData.tipoBanner || '-'}</div></td>
                        </tr>
                        <tr>
                            <td><div class="dato-label">Laboratorio</div><div class="dato-valor">${formData.laboratorio || '-'}</div></td>
                            <td><div class="dato-label">Nombre de la campaña</div><div class="dato-valor">${formData.nombreCampana || '-'}</div></td>
                        </tr>
                        <tr>
                            <td colspan="2"><div class="dato-label">Duración de la campaña</div><div class="dato-valor">${formData.duracionCampana || '-'}</div></td>
                        </tr>
                    </table>
                </td>
                <td width="35%" valign="top">
                    <div class="dato-label" style="margin-bottom: 8px;">Miniatura del banner</div>
                    <div class="arte-container">
                    ${formData.imagenes.length > 0 ?
                    formData.imagenes.map(img => `<img src="${img.preview}" style="max-width:48%; margin:1%; display:inline-block;" />`).join('')
                    : '<div style="color:#999;">Sin imagen</div>'
                }
                    </div>
                </td>
            </tr>
        </table>

        <div class="seccion-titulo">DETALLES DE LA CAMPAÑA</div>

        <table width="100%">
            <tr>
                <td width="50%" valign="top" style="padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Keywords Web</div>
                        <div class="metrica-valor">${Array.isArray(formData.keywordsWeb) ? formData.keywordsWeb.join(', ') : '-'}</div>
                    </div>
                </td>
                <td width="50%" valign="top" style="padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Keywords App</div>
                        <div class="metrica-valor">${Array.isArray(formData.keywordsApp) ? formData.keywordsApp.join(', ') : '-'}</div>
                    </div>
                </td>
            </tr>
            <tr>
                <td valign="top" style="padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Especialidades</div>
                        <div class="metrica-valor">${formData.especialidades || '-'}</div>
                    </div>
                </td>
                <td valign="top" style="padding: 5px;">
                    <div class="metrica-box">
                        <div class="metrica-header">Comentarios adicionales</div>
                        <div class="metrica-valor">${formData.comentarios || '-'}</div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</div>`;

            const element = document.createElement('div');
            element.innerHTML = contenidoHTML;
            document.body.appendChild(element);

            const opt = {
                margin: 0,
                filename: `reporte_banner_${fechaActual.replace(/\//g, '-')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 1122,
                    windowHeight: 794
                },
                jsPDF: {
                    unit: 'mm',
                    format: [297, 210],
                    orientation: 'landscape'
                }
            };

            await html2pdf().set(opt).from(contenidoHTML).save();
            document.body.removeChild(element);

        } catch (error) {
            console.error('Error PDF:', error);
            setMensaje({ tipo: 'danger', texto: 'Error al generar el PDF' });
        } finally {
            setLoadingPDF(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMensaje({ tipo: '', texto: '' });

        try {
            const dataParaMake = {
                fecha: new Date().toISOString(),
                tipoPlataforma: formData.tipoPlataforma,
                tipoBanner: formData.tipoBanner,
                laboratorio: formData.laboratorio,
                nombreCampana: formData.nombreCampana,
                keywordsWeb: formData.keywordsWeb,
                keywordsApp: formData.keywordsApp,
                especialidades: formData.especialidades,
                duracionCampana: formData.duracionCampana,
                comentarios: formData.comentarios,
                imagenes: formData.imagenes.map(img => ({
                    name: img.name,
                    width: img.width,
                    height: img.height,
                    size: img.size,
                    format: img.format,
                    valida: img.valida,
                    preview: img.preview
                }))
            };

            const response = await fetch(MAKE_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataParaMake)
            });

            if (response.ok) {
                setMensaje({
                    tipo: 'success',
                    texto: '✅ Formato guardado exitosamente en Google Sheets'
                });
                handleCancel();
            } else {
                setMensaje({
                    tipo: 'danger',
                    texto: '❌ Error al guardar. Intenta nuevamente.'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            setMensaje({
                tipo: 'danger',
                texto: '❌ Error de conexión con el servidor'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            tipoPlataforma: '',
            tipoBanner: '',
            laboratorio: '',
            nombreCampana: '',
            duracionCampana: '',
            keywordsWeb: [],
            keywordsApp: [],
            especialidades: '',
            comentarios: '',
            imagenes: []
        });

        setMensaje({ tipo: '', texto: '' });
    };

    const getCurrentDate = () => {
        const today = new Date();
        return today.toLocaleDateString('es-MX');
    };

    return (
        <>
            <Container className="mt-4 mb-5">
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h3 className="mb-0">Formato para subida de Banners</h3>
                            <div>
                                <span className="fw-bold me-2">Fecha:</span>
                                <span>{getCurrentDate()}</span>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Form onSubmit={handleSubmit}>
                    {/* Información del cliente */}
                    <Row className="mt-4">
                        <Col md={12}>
                            <h5 className="titulo_formato">Información del cliente</h5>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <Row>
                                <Col sm={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tipo de plataforma</Form.Label>
                                        <Form.Select
                                            name="tipoPlataforma"
                                            value={formData.tipoPlataforma}
                                            onChange={handlePlataformaChange}   // <-- aquí el nuevo handler
                                        >
                                            <option value="">Selecciona una opción</option>
                                            <option value="Ambos">Ambos (Web y App)</option>
                                            <option value="Web">Solo Web</option>
                                            <option value="App">Solo App</option>
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Tipo de Banner *</Form.Label>
                                        <Form.Select
                                            name="tipoBanner"
                                            value={formData.tipoBanner}
                                            onChange={handleChange}
                                            disabled={!formData.tipoPlataforma}
                                            required
                                        >
                                            <option value="">
                                                {formData.tipoPlataforma ? "Selecciona un banner..." : "Primero elige la plataforma"}
                                            </option>
                                            {getBannerOptions().map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </Form.Select>

                                        {/* INFO DEL BANNER */}
                                        {getSelectedBannerInfo() && (
                                            <div className="mt-3 p-3 bg-light border rounded">
                                                <small className="text-muted">Especificaciones:</small>
                                                <ul className="small mb-0 mt-2">
                                                    <li><strong>Destinado a:</strong> {getSelectedBannerInfo().destinado}</li>
                                                    <li><strong>Medidas:</strong>{" "}
                                                        {Array.isArray(getSelectedBannerInfo().dimensiones)
                                                            ? getSelectedBannerInfo().dimensiones.join(" y ")
                                                            : getSelectedBannerInfo().dimensiones}
                                                    </li>
                                                    <li><strong>Formato:</strong> {getSelectedBannerInfo().formato}</li>
                                                    <li><strong>Peso máx:</strong> {getSelectedBannerInfo().peso}</li>
                                                    <li><strong>Color:</strong> {getSelectedBannerInfo().color}</li>
                                                </ul>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="mt-2"
                                                    onClick={handleOpen}
                                                >
                                                    Ver ubicación
                                                </Button>
                                            </div>
                                        )}
                                    </Form.Group>
                                </Col>


                            </Row>

                            <Row>

                                <Col sm={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Laboratorio</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="laboratorio"
                                            value={formData.laboratorio}
                                            onChange={handleChange}
                                            placeholder="Nombre del laboratorio"
                                        />
                                    </Form.Group>
                                </Col>

                                <Col sm={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Marca</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="nombreCampana"
                                            value={formData.nombreCampana}
                                            onChange={handleChange}
                                            placeholder="nombre de la campaña"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label>Duración de la campaña:</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="duracionCampana"
                                            value={formData.duracionCampana}
                                            onChange={handleChange}
                                            placeholder="Ej: 30 días, del 1 al 31 de diciembre..."
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Col>

                        <Col md={6}>
                            <Form.Label className="mb-2 fw-bold text-primary">
                                {cantidadEsperada > 1
                                    ? `Sube las ${cantidadEsperada} imágenes requeridas`
                                    : cantidadEsperada === 1
                                        ? "Sube la imagen del banner"
                                        : "Selecciona primero el tipo de banner"}
                            </Form.Label>
                            <Card
                                className={`p-4 ${dragActive ? 'border-primary bg-light' : ''}`}
                                style={{
                                    border: dragActive ? '3px dashed #0d6efd' : '2px dashed #ccc',
                                    minHeight: '380px',
                                    cursor: 'pointer'
                                }}
                                onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('fileInputMultiple').click()}
                            >
                                <Card.Body className="d-flex flex-column justify-content-center">
                                    {formData.imagenes.length === 0 ? (
                                        <div className="text-center py-4">
                                            <FontAwesomeIcon icon={faUpload} size="4x" className="text-primary mb-3" />
                                            <p className="fw-bold mb-1">Arrastra aquí tus imágenes</p>
                                            {cantidadEsperada > 0 && (
                                                <p className="text-muted small">
                                                    Se esperan {cantidadEsperada} imagen(es): <br />
                                                    {getMedidasEsperadas().map(m => `${m[0]}×${m[1]}px`).join(' y ')}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <Row className="g-3">
                                            {formData.imagenes.map((img, idx) => (
                                                <Col key={idx} xs={12} md={cantidadEsperada > 1 ? 6 : 12}>
                                                    <Card className="h-100 position-relative shadow-sm">
                                                        <Button
                                                            variant="danger"
                                                            size="sm"
                                                            className="position-absolute top-0 end-0 m-2 rounded-circle"
                                                            style={{ zIndex: 10, width: 32, height: 32 }}
                                                            // Solución: agregar e.stopPropagation() al botón de eliminar
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeImage(idx);
                                                            }}
                                                        >
                                                            ×
                                                        </Button>
                                                        <Card.Img
                                                            variant="top"
                                                            src={img.preview}
                                                            style={{ height: 160, objectFit: 'contain', background: '#f8f9fa' }}
                                                        />
                                                        <Card.Body className="pt-2 pb-3 small">
                                                            <div className="fw-bold text-truncate">{img.name}</div>
                                                            <div>{img.width} × {img.height}px</div>
                                                            <div>{img.size} • {img.format}</div>
                                                            {img.valida ?
                                                                <span className="text-success"><FontAwesomeIcon icon={faCheckCircle} /> Medida correcta</span> :
                                                                <span className="text-danger"><FontAwesomeIcon icon={faExclamationTriangle} /> Medida incorrecta</span>
                                                            }
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}

                                            {/* Espacio para subir la siguiente */}
                                            {formData.imagenes.length < cantidadEsperada && cantidadEsperada > 0 && (
                                                <Col xs={12} className="text-center">
                                                    <div className="border border-2 border-dashed border-primary rounded-3 p-5 text-primary">
                                                        <FontAwesomeIcon icon={faUpload} size="2x" />
                                                        <p className="mt-2 mb-0">Sube imagen {formData.imagenes.length + 1}</p>
                                                    </div>
                                                </Col>
                                            )}
                                        </Row>
                                    )}
                                </Card.Body>
                            </Card>
                            <input
                                id="fileInputMultiple"
                                type="file"
                                multiple={cantidadEsperada > 1}
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleFileChangeMultiple}
                            />
                        </Col>
                    </Row>
                    <Row>


                        {(formData.tipoPlataforma === 'Ambos' || formData.tipoPlataforma === 'Web') && (
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Keywords Web :</Form.Label>
                                    <ChipInput
                                        items={formData.keywordsWeb}
                                        setItems={(list) => {
                                            setFormData(prev => ({ ...prev, keywordsWeb: list }));
                                        }}
                                        placeholder="Ej: diabetes, hipertensión..."
                                        badgeColor="info"
                                    />
                                </Form.Group>
                            </Col>
                        )}
                        {(formData.tipoPlataforma === 'Ambos' || formData.tipoPlataforma === 'App') && (
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Keywords App :</Form.Label>
                                    <ChipInput
                                        items={formData.keywordsApp}
                                        setItems={(list) => {
                                            setFormData(prev => ({ ...prev, keywordsApp: list }));
                                        }}
                                        placeholder="Ej: diabetes, hipertensión..."
                                        badgeColor="info"
                                    />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>

                    {/* Contenido del mailing */}
                    {/* Especialidades y Comentarios - con ancho dinámico */}
                    <Container className="backgroundTres p-4 my-4 rounded">
                        <Row className="g-4">
                            {/* ESPECIALIDADES - solo aparece en App o Ambos */}
                            {(formData.tipoPlataforma === 'App' || formData.tipoPlataforma === 'Ambos') && (
                                <Col md={6}>
                                    <Form.Group>
                                        <Form.Label className="fw-bold text-primary">
                                            Especialidades (solo App)
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={4}
                                            name="especialidades"
                                            value={formData.especialidades}
                                            onChange={handleChange}
                                            placeholder="Ej: Cardiología, Pediatría, Neurología, Dermatología..."
                                            className="border-primary"
                                        />
                                    </Form.Group>
                                </Col>
                            )}

                            {/* COMENTARIOS ADICIONALES - ancho automático */}
                            <Col
                                md={
                                    formData.tipoPlataforma === 'Web'
                                        ? 12
                                        : 6
                                }
                            >
                                <Form.Group>
                                    <Form.Label className="fw-bold text-primary">
                                        Comentarios adicionales
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        name="comentarios"
                                        value={formData.comentarios}
                                        onChange={handleChange}
                                        placeholder="Escribe aquí cualquier comentario extra: enlaces, notas, especificaciones técnicas, etc."
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Container>

                    {/* Botones */}
                    <Row className="mt-4">
                        <Col className="d-flex justify-content-end gap-3">
                            <Button variant="outline-secondary" onClick={handleCancel} disabled={loading}>
                                Cancelar
                            </Button>
                            <Button
                                variant="outline-primary"
                                onClick={handleDownloadPDF}
                                disabled={loading || loadingPDF}
                            >
                                {loadingPDF ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Generando PDF...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faDownload} className="me-2" />
                                        Descargar PDF
                                    </>
                                )}
                            </Button>
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner size="sm" className="me-2" />
                                        Guardando...
                                    </>
                                ) : (
                                    'Guardar'
                                )}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Container >

            <Modal show={show} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Ubicación del Banner</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedBannerModal && (
                        <>
                            <p className="text-muted mb-3">{selectedBannerModal.ubicacion}</p>
                            <img
                                src={selectedBannerModal.imagen}
                                alt="Ubicación del banner"
                                style={{ width: '100%', height: 'auto' }}
                            />
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default FormatoBanner;