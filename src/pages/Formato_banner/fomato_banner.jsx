import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Card, Spinner, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheckCircle, faTimes, faDownload, faEye } from "@fortawesome/free-solid-svg-icons";
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
        miniatura: null
    });
    const [keywordsWeb, setKeywordsWeb] = useState([]);
    const [keywordsApp, setKeywordsApp] = useState([]);

    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // URL del webhook de Make (reemplaza con la tuya)
    const MAKE_WEBHOOK_URL = 'http://localhost:5678/webhook-test/banner-validation';

    const bannerInfo = {
        'Banner Home': {
            destinado: 'Pacientes y Médicos',
            dimensiones: '336 × 105 px',
            formato: 'JPG, PNG o GIF'
        },
        'Banner Buscador Semántico': {
            destinado: 'Pacientes y Médicos',
            dimensiones: '336 × 105 px',
            formato: 'JPG, PNG o GIF'
        },
        'Banner IPPA': {
            destinado: 'Pacientes y Médicos',
            dimensiones: ['526 × 269 px', '285 × 517 px'],
            formato: 'JPG, PNG o GIF'
        }
    };

    // Información del modal para cada tipo de banner
    const bannerModalInfo = {
        'Banner Home': {
            ubicacion: 'Banner Home',
            imagen: Banner_home, // Reemplaza con la URL real de tu imagen
        },
        'Banner Buscador Semántico': {
            ubicacion: 'Banner Buscador Semántico',
            imagen: Banner_semantico,
        },
        'Banner IPPA': {
            ubicacion: 'Banner IPPA',
            imagen: Banner_ipa // Reemplaza con la URL real de tu imagen
        }
    };
    const [show, setShow] = useState(false);

    const handleOpen = () => setShow(true);
    const handleClose = () => setShow(false);

    // Función para mapear el valor del select a la clave del bannerInfo
    const getBannerKey = (value) => {
        const mapping = {
            'Banner home': 'Banner Home',
            'Banner buscador smeantico': 'Banner Buscador Semántico',
            'Banner ippa': 'Banner IPPA'
        };
        return mapping[value] || null;
    };

    // Obtener información del banner seleccionado
    const selectedBannerInfo = formData.tipoBanner ? bannerInfo[getBannerKey(formData.tipoBanner)] : null;

    // Obtener información del modal para el banner seleccionado
    const selectedBannerModal = formData.tipoBanner ? bannerModalInfo[getBannerKey(formData.tipoBanner)] : null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    // Esto va arriba con los demás useState
const [plataformaSeleccionada, setPlataformaSeleccionada] = useState('');

// Esto reemplaza tu handleChange actual del select de plataforma
const handlePlataformaChange = (e) => {
    const valor = e.target.value;
    setPlataformaSeleccionada(valor);
    setFormData(prev => ({
        ...prev,
        tipoPlataforma: valor
    }));

    // Si elige solo Web o solo App, limpiamos el otro campo
    if (valor === 'Web') {
        setKeywordsApp([]);
        setFormData(prev => ({ ...prev, keywordsApp: [] }));
    } else if (valor === 'App') {
        setKeywordsWeb([]);
        setFormData(prev => ({ ...prev, keywordsWeb: [] }));
    }
};

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 200;

                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);

                    setFormData(prev => ({
                        ...prev,
                        miniatura: compressedBase64
                    }));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
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

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    miniatura: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setFormData(prev => ({
            ...prev,
            miniatura: null
        }));
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
                        ${formData.miniatura
                    ? `<img src="${formData.miniatura}" alt="Banner">`
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
                empresaOrganizacion: formData.empresaOrganizacion,
                keywordsWeb: formData.keywordsWeb,
                keywordsApp: formData.keywordsApp,
                especialidades: formData.especialidades,
                duracionCampana: formData.duracionCampana,
                comentarios: formData.comentarios,
                miniatura: formData.miniatura
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
            miniatura: null
        });
        setKeywordsWeb([]);     // <-- importante
        setKeywordsApp([]);     // <-- importante
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
    <option value="Ambos">Ambos (Web y App</option>
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
                                        >
                                            <option value="">Selecciona una opción</option>
                                            <option value="Banner home">Banner Home</option>
                                            <option value="Banner buscador smeantico">Banner Buscador Semántico</option>
                                            <option value="Banner ippa">Banner IPPA</option>
                                        </Form.Select>
                                    </Form.Group>

                                    {/* Información del banner seleccionado */}
                                    {selectedBannerInfo && (
                                        <div className="banner-info-container">
                                            <div className="banner-info-content">
                                                <div className="banner-info-left">
                                                    <p className="banner-info-text">
                                                        <strong>Destinado a:</strong> {selectedBannerInfo.destinado}
                                                    </p>
                                                    <div className="banner-info-row">
                                                        <p className="banner-info-text">
                                                            <strong>Dimensiones:</strong>
                                                            {Array.isArray(selectedBannerInfo.dimensiones) ? (
                                                                selectedBannerInfo.dimensiones.map((dim, index) => (
                                                                    <span key={index} className="dimension-badge">{dim}</span>
                                                                ))
                                                            ) : (
                                                                <span className="dimension-badge">{selectedBannerInfo.dimensiones}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <p className="banner-info-text">
                                                        <strong>Formato:</strong> {selectedBannerInfo.formato}
                                                    </p>
                                                </div>
                                                <div className="banner-info-right">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="view-location-btn"
                                                        onClick={handleOpen}
                                                    >
                                                        <FontAwesomeIcon icon={faEye} className="me-2" />
                                                        Ver ubicación
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
                                        <Form.Label>Nombre de la campaña</Form.Label>
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
                            <Form.Label className="mb-2">Miniatura de imagen</Form.Label>
                            <Card
                                className={`text-center p-4 ${dragActive ? 'border-primary bg-light' : ''}`}
                                style={{
                                    cursor: formData.miniatura ? 'default' : 'pointer',
                                    border: dragActive ? '2px dashed #0d6efd' : '2px dashed #dee2e6',
                                    minHeight: '300px',
                                    transition: 'all 0.3s ease'
                                }}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => {
                                    if (!formData.miniatura) {
                                        document.getElementById('fileInput').click();
                                    }
                                }}
                            >
                                <Card.Body className="d-flex flex-column justify-content-center align-items-center h-100">
                                    {formData.miniatura ? (
                                        <div className="position-relative w-100 h-100 d-flex flex-column align-items-center justify-content-center">
                                            <div className="position-relative">
                                                <img
                                                    src={formData.miniatura}
                                                    alt="Preview"
                                                    className="img-fluid"
                                                    style={{
                                                        maxWidth: '100%',
                                                        maxHeight: '240px',
                                                        objectFit: 'contain',
                                                        borderRadius: '8px'
                                                    }}
                                                />
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    className="position-absolute rounded-circle"
                                                    style={{
                                                        top: '-8px',
                                                        right: '-8px',
                                                        width: '32px',
                                                        height: '32px',
                                                        padding: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    onClick={handleRemoveImage}
                                                >
                                                    <FontAwesomeIcon icon={faTimes} size="sm" />
                                                </Button>
                                            </div>
                                            <div className="mt-4 d-flex align-items-center gap-2 text-success fw-semibold">
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                <span>Imagen cargada correctamente</span>
                                            </div>
                                            <p className="text-muted small mt-2 mb-0">
                                                Haz clic en la X para cambiar la imagen
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4">
                                            <FontAwesomeIcon
                                                icon={faUpload}
                                                className="text-primary mb-3"
                                                style={{ width: '60px', height: '60px' }}
                                            />
                                            <p className="text-dark fw-semibold mb-1">
                                                Arrastra y suelta aquí el archivo <br />
                                                del banner o haz clic para subirlo
                                            </p>

                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                            <input
                                id="fileInput"
                                type="file"
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*"
                            />
                        </Col>
                    </Row>
                    <Row>


{(plataformaSeleccionada === 'Ambos' || plataformaSeleccionada === 'Web') && (
    <Col md={6}>
        <Form.Group className="mb-3">
            <Form.Label>Keywords Web :</Form.Label>
            <ChipInput 
                items={keywordsWeb}
                setItems={(list) => {
                    setKeywordsWeb(list);
                    setFormData(prev => ({ ...prev, keywordsWeb: list }));
                }}
                placeholder="Ej: diabetes, hipertensión..."
                badgeColor="info"
            />
        </Form.Group>
    </Col>
)}
                      {(plataformaSeleccionada === 'Ambos' || plataformaSeleccionada === 'App') && (
    <Col md={6}>
        <Form.Group className="mb-3">
            <Form.Label>Keywords App :</Form.Label>
            <ChipInput 
                items={keywordsApp}
                setItems={(list) => {
                    setKeywordsApp(list);
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
            </Container>

            {/* Modal */}
            <Modal show={show} onHide={handleClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>
                        <strong>Ubicación:</strong> {selectedBannerModal ? selectedBannerModal.ubicacion : 'No seleccionado'}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    {selectedBannerModal ? (
                        <>
                            <p className="mb-3">
                                Esta es una representación de dónde se ubicará el banner en la plataforma
                            </p>
                            <div className="text-center mb-3">
                                <img
                                    src={selectedBannerModal.imagen}
                                    alt="Ubicación del banner"
                                    className="img-fluid"
                                    style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px'
                                    }}
                                />
                            </div>
                            <p className="text-muted small mb-0">
                                <strong>Nota:</strong> Esta es una representación visual. Las dimensiones exactas deben coincidir con las especificadas.
                            </p>
                        </>
                    ) : (
                        <p>Por favor, selecciona un tipo de banner para ver su ubicación.</p>
                    )}

                    <div className="banner_plantillas" >
                        <p>Descarga plantillas</p>
                        <Button variant="primary">Descargar Plantilla Illustrator</Button>
                        <Button variant="outline-secondary" className="ms-2">Descargar Plantilla Photoshop</Button>
                    </div>

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
