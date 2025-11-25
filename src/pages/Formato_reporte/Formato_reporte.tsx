import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import './formato_reporte.css';
import { faUpload, faCheckCircle, faTimes, faDownload, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    BarController,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

function FormatoReporte() {
    const [formData, setFormData] = useState({
        detalleCampana: '',
        nombreCampana: '',
        periodo: '',
        ultimoEnvio: '',
        correosEnviados: '',
        subject: '',
        preheader: '',
        miniatura: null as string | null
    });

    // Métricas principales
    const [metricas, setMetricas] = useState({
        aperturas: '',
        porcentajeOpen: '',
        clic: '',
        ctr: '',
        ctor: ''
    });

    // Tabla de segmentos
    const [segmentos, setSegmentos] = useState([
        { id: 1, especialidad: '', usuarios: '', aperturas: '', porcentajeOpen: '', clics: '', ctr: '' }
    ]);

    // Segmentos enviados (texto libre)
    const [segmentosEnviados, setSegmentosEnviados] = useState('');

    const [dragActive, setDragActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    // Referencias para las gráficas
    const chartUsuariosRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstancesRef = useRef<{ usuarios?: ChartJS | null }>({});
    
    // Función para limpiar la gráfica anterior
    const limpiarGrafica = useCallback(() => {
        if (chartInstancesRef.current.usuarios) {
            try {
                chartInstancesRef.current.usuarios.destroy();
            } catch (error) {
                // Ignorar errores al destruir
            }
            chartInstancesRef.current.usuarios = null;
        }
    }, []);
    
    // Función para crear la gráfica
    const crearGrafica = useCallback((segmentosConDatos: typeof segmentos) => {
        if (!chartUsuariosRef.current) return;
        
        // Limpiar gráfica anterior SIEMPRE antes de crear una nueva
        limpiarGrafica();
        
        // Pequeño delay para asegurar que el canvas esté completamente liberado
        setTimeout(() => {
            if (!chartUsuariosRef.current) return;
            
            // Verificar que no haya una gráfica existente
            if (chartInstancesRef.current.usuarios) {
                limpiarGrafica();
            }
            
            // Preparar datos
            const labels = segmentosConDatos.map(s => s.especialidad);
            const usuarios = segmentosConDatos.map(s => parseInt(s.usuarios) || 0);
            const aperturas = segmentosConDatos.map(s => parseInt(s.aperturas) || 0); // ← NUEVO
            
            // Obtener contexto
            const ctx = chartUsuariosRef.current.getContext('2d');
            if (!ctx) return;
            
            // Crear gráfica
            try {
                chartInstancesRef.current.usuarios = new ChartJS(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: 'Usuarios',
                                data: usuarios,
                                backgroundColor: 'rgba(54, 162, 235, 0.8)', // Azul
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                            },
                            {
                                label: 'Aperturas',
                                data: aperturas,
                                backgroundColor: 'rgba(75, 192, 192, 0.8)', // Verde
                                borderColor: 'rgba(75, 192, 192, 1)',
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                display: true,
                                position: 'bottom'
                            },
                            title: { 
                                display: true, 
                                text: 'Segmentos enviados',
                                font: { size: 14 }
                            }
                        },
                        scales: {
                            x: { 
                                stacked: true,  // ← AGREGAR ESTO
                                beginAtZero: true,
                                grid: { display: true }
                            },
                            y: {
                                stacked: true,  // ← AGREGAR ESTO
                                grid: { display: false }
                            }
                        }
                    }
                });
            } catch (error) {
                console.error('Error al crear la gráfica:', error);
            }
        }, 10);
    }, [limpiarGrafica]);
    
    // Callback ref para cuando el canvas se monta (solo guarda la referencia)
    const canvasRefCallback = useCallback((canvas: HTMLCanvasElement | null) => {
        // Limpiar gráfica si el canvas se desmonta
        if (!canvas && chartInstancesRef.current.usuarios) {
            limpiarGrafica();
        }
        chartUsuariosRef.current = canvas;
    }, [limpiarGrafica]);

    // URL del webhook de Make (reemplaza con la tuya)
    const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/TU_WEBHOOK_AQUI_PARA_REPORTE';

    // Función para crear/actualizar gráfica automáticamente cuando cambian los segmentos
    useEffect(() => {
        // Filtrar segmentos que tengan al menos especialidad y usuarios
        const segmentosConDatos = segmentos.filter(s => 
            s.especialidad && s.especialidad.trim() !== '' && 
            s.usuarios && s.usuarios.trim() !== '' && 
            !isNaN(parseInt(s.usuarios))
        );

        // Si no hay datos, limpiar gráfica si existe
        if (segmentosConDatos.length === 0) {
            limpiarGrafica();
            return;
        }

        // Si hay datos y el canvas está disponible, crear/actualizar la gráfica
        // Esperar un momento para asegurar que el DOM esté actualizado
        const timeoutId = setTimeout(() => {
            if (chartUsuariosRef.current && segmentosConDatos.length > 0) {
                crearGrafica(segmentosConDatos);
            }
        }, 50);

        

        // Cleanup: destruir gráfica al desmontar o cuando cambien los datos
        return () => {
            clearTimeout(timeoutId);
            limpiarGrafica();
        };
    }, [segmentos, crearGrafica, limpiarGrafica]);

    // NUEVO useEffect para calcular %Open automáticamente
useEffect(() => {
    if (formData.correosEnviados && metricas.aperturas) {
        const porcentaje = (metricas.aperturas / formData.correosEnviados * 100).toFixed(2);
        setMetricas(prev => ({
            ...prev,
            porcentajeOpen: porcentaje
        }));
    } else if (!formData.correosEnviados || !metricas.aperturas) {
        setMetricas(prev => ({
            ...prev,
            porcentajeOpen: ''
        }));
    }
}, [formData.correosEnviados, metricas.aperturas]);
// useEffect para calcular CTR automáticamente
// CTR = Clic / envíos * 100
useEffect(() => {
    if (formData.correosEnviados && metricas.clic) {
        const ctrCalculado = (metricas.clic / formData.correosEnviados * 100).toFixed(2);
        setMetricas(prev => ({
            ...prev,
            ctr: ctrCalculado
        }));
    } else if (!formData.correosEnviados || !metricas.clic) {
        setMetricas(prev => ({
            ...prev,
            ctr: ''
        }));
    }
}, [formData.correosEnviados, metricas.clic]);

// useEffect para calcular CTOR automáticamente
// CTOR = Clic / aperturas * 100
useEffect(() => {
    if (metricas.aperturas && metricas.clic) {
        const ctorCalculado = (metricas.clic / metricas.aperturas * 100).toFixed(2);
        setMetricas(prev => ({
            ...prev,
            ctor: ctorCalculado
        }));
    } else if (!metricas.aperturas || !metricas.clic) {
        setMetricas(prev => ({
            ...prev,
            ctor: ''
        }));
    }
}, [metricas.aperturas, metricas.clic]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleMetricasChange = (e) => {
        const { name, value } = e.target;
        setMetricas(prev => ({
            ...prev,
            [name]: value
        }));
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
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, width, height);
                    }
                    
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);
                    
                    setFormData(prev => ({
                        ...prev,
                        miniatura: compressedBase64
                    }));
                };
                if (reader.result && typeof reader.result === 'string') {
                    img.src = reader.result;
                }
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
                if (reader.result && typeof reader.result === 'string') {
                    setFormData(prev => ({
                        ...prev,
                        miniatura: reader.result as string
                    }));
                }
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

    // Funciones para manejar la tabla de segmentos
    const handleSegmentoChange = (id, campo, valor) => {
        setSegmentos(prevSegmentos => 
            prevSegmentos.map(segmento => {
                if (segmento.id === id) {
                    // Actualizar el campo que cambió
                    const segmentoActualizado = {
                        ...segmento,
                        [campo]: valor
                    };
    
                    // Si el campo modificado afecta los cálculos, recalcular
                    if (campo === 'usuarios' || campo === 'aperturas' || campo === 'clics') {
                        const { porcentajeOpen, ctr } = calcularPorcentajesSegmento(segmentoActualizado);
                        return {
                            ...segmentoActualizado,
                            porcentajeOpen,
                            ctr
                        };
                    }
    
                    return segmentoActualizado;
                }
                return segmento;
            })
        );
    };

    const agregarSegmento = () => {
        const nuevoId = Math.max(...segmentos.map(s => s.id), 0) + 1;
        setSegmentos([...segmentos, {
            id: nuevoId,
            especialidad: '',
            usuarios: '',
            aperturas: '',
            porcentajeOpen: '',
            clics: '',
            ctr: ''
        }]);
    };

    const eliminarSegmento = (id) => {
        if (segmentos.length > 1) {
            setSegmentos(prev => prev.filter(seg => seg.id !== id));
        }
    };
    const handleDownloadPDF = async () => {
        setLoadingPDF(true);
    
        try {
            const html2pdf = (await import('html2pdf.js')).default;
              // Usa la fecha real
              const fechaActual = new Date().toLocaleDateString('es-MX', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).replace(/\//g, '/');

    // Base64 de la plantilla
              const plantillaBase64 = "data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAr9P8CDACPkVzbavxSUgAAAABJRU5ErkJggg==";
            // --- 1. Capturar gráfica ---
            let chartImageBase64 = '';
            const segmentosConDatos = segmentos.filter(s => 
                s.especialidad && s.especialidad.trim() !== '' && 
                s.usuarios && s.usuarios.trim() !== '' && 
                !isNaN(parseInt(s.usuarios))
            );
            if (segmentosConDatos.length > 0 && chartUsuariosRef.current) {
                await new Promise((resolve) => setTimeout(resolve, 500)); // Más tiempo
                
                try {
                    if (chartUsuariosRef.current.width > 0 && chartUsuariosRef.current.height > 0) {
                        chartImageBase64 = chartUsuariosRef.current.toDataURL("image/png", 1.0);
                    }
                } catch (error) {
                    console.warn("Error capturando gráfica:", error);
                }
            }
    
            
    
            // --- 2. Generar filas tabla ---
            const segmentosTableRows = segmentos.map(seg => `
                <tr>
                    <td style="padding: 6px; border-buttom: 1px solid #ddd; font-size: 11px;">${seg.especialidad || '-'}</td>
                    <td style="padding: 6px; border-buttom: 1px solid #ddd; font-size: 11px; text-align: center;">${seg.usuarios || '-'}</td>
                    <td style="padding: 6px; border-buttom: 1px solid #ddd; font-size: 11px; text-align: center;">${seg.aperturas || '-'}</td>
                    <td style="padding: 6px; border-buttom: 1px solid #ddd; font-size: 11px; text-align: center;">${seg.porcentajeOpen || '-'}</td>
                    <td style="padding: 6px; border-buttom: 1px solid #ddd; font-size: 11px; text-align: center;">${seg.clics || '-'}</td>
                    <td style="padding: 6px; border-buttom: 1px solid #ddd; font-size: 11px; text-align: center;">${seg.ctr || '-'}</td>
                </tr>
            `).join('');
    
            // --- 3. Tu HTML completo (sin cambios, está perfecto) ---
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
      padding: 15mm 12mm;  /* ← márgenes seguros donde va el texto */
      box-sizing: border-box;
      z-index: 2;
      font-family: Arial, sans-serif;
    }
                    
        
        .header {
            border-bottom: 2px solid #0066cc;
            margin-bottom: 8px;
            padding-bottom:8px;
        }
        
        .header table {
            width: 100%;
            border-collapse: collapse;
        }
        
        
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            text-align: right;
        }
        
        .periodo {
            background-color: #f0f4ff;
            padding: 6px 12px;
            margin-bottom: 10px;
            font-size: 13px;
            border-left: 4px solid #0066cc;
            color: #003366;
        }
        
        .main-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .left-column {
            width: 240px;
            vertical-align: top;
            padding-right: 8px;
        }
        
        .right-column {
            vertical-align: top;
        }
        
        .metric-box {
            text-align: center;
            border: 1px solid #0066cc;
            width: 100%;
        }
         .metric-box_blue{
            border: 1px solid #0066cc;
            width: 100%;
            height: 125px;
            background-color: #D6E8F5;
            margin-bottom: 6px;
        }
        .metric-box_dos{
            text-align: center;
            border: 1px solid #0066cc;
            width: 100%;
            margin-bottom: 6px;
        }

        
        .metric-label {
            color: #0066cc;
            font-size: 14px;
            font-weight: bold;
            height: 50px;
            padding: 8px;
            background: #D6E8F5;
           border: 1px solid #0066cc;
            width:50%;
        }
        
        .metric-value {
            color: #0066cc;
            font-size: 16px;
            font-weight: bold;
            text-align:center;
             width:50%;
             
             
        }
               .metric-value_dos {
            color: #0066cc;
            font-size: 20px;
            font-weight: bold;
            text-align:center;
             width:100%;
        }
        
        .section-title {
            color: #0066cc;
            padding: 6px 10px;
            font-weight: bold;
            border-bottom: 1px solid #0066cc;;
            text-align: rigth;
            margin-bottom: 6px;
            font-size: 11px;
        }
        .section-title_blue{
           border: 1px solid #608BC9;
            color:#3367B8 ;
            padding: 6px 10px;
            font-weight: bold;
            font-size: 11px;
            text-align: center;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        
        .info-table td {
            padding: 6px;
            border-bottom: 1px solid #ddd;
            font-size: 10px;
        }
        
        .info-table td:first-child {
            width: 180px;
        }
        
        .segments-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        
        .segments-table th {
            padding: 5px;
            border-bottom: 1px solid #0066cc;
             border-top: 1px solid #0066cc;
            font-size: 10px;
            text-align: center;
        }
        
        .segments-table td {
            padding: 4px;
            border-buttom: 1px solid #ddd;
             border-top: 1px solid #ddd;
            font-size: 10px;
            text-align: center;
        }
        
        .segments-table td:first-child {
            text-align: left;
        }
        .subject-from{
            padding: 1rem;
            border: 1px solid #ddd;
            font-size: 12px;
            text-align: center;
        }
        
        .art-box {
            border: 1px solid #0066cc;
            padding: 6px;
            background: white;
            margin-bottom: 10px;
            display: flex; 
            align-items: center;
            justify-content: center;
        }
        
        .art-box img {
            max-width: 100%;
                    height: auto;
                    max-height: 120px;
        }
        
        .subject-box {
            background: #e3f2fd;
            padding: 6px;
            border: 1px solid #0066cc;
            margin-top: 10px;
        }
        
        .subject-title {
            color: #0066cc;
            font-weight: bold;
            margin-bottom: 6px;
            text-align: center;
            font-size: 11px;
        }
        
        .chart-container {
            margin-top: 10px;
            border: 1px solid #ddd;
            padding: 8px;
        }
        
        .chart-container img {
           width: 100%;
                    height: auto;
                    max-height: 150px;
                    object-fit: contain;
        }
            
                </style>
        <div class="pagina">
        <img src="${plantillaBase64}" class="fondo-plantilla" />
       <div class="contenido-real">
 <!-- Header -->
        <div class="header">
            <table>
                <tr>
                    <td class="title">DETALLE DE CAMPAÑAS DE: ${formData.detalleCampana || 'SIN DETALLE'}</td>
                </tr>
            </table>
        </div>
        
        <!-- Periodo -->
            <div class="periodo">Periodo: ${formData.periodo || 'Sin periodo'}</div>
        
        <!-- Main Layout Table -->
        <table class="main-table">
            <tr>
                <!-- Left Column -->
                <td class="left-column">
                    <!-- Correos enviados -->
                    <div class="section-title">Correos enviados</div>
                    <table class="metric-box_blue">
                        <tr>
                            <td>
                                <div class="metric-value_dos">${formData.correosEnviados || ''}</div>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Métricas Section -->
                    <div class="section-title">Métricas</div>
                    
                    
                    <table class="metric-box">
                        <tr>
                            <td class="metric-label">
                                Aperturas
                            </td>
                           <td class="metric-value" >
                               ${metricas.aperturas || ''}
                            </td>
                        </tr>
                    </table>
                    
                    <table class="metric-box_dos">
                        <tr>
                           <td class="metric-label">
                                %Open
                            </td>
                           <td class="metric-value" >
                             ${metricas.porcentajeOpen || ''}
                            </td>
                        </tr>
                    </table>
                     <table class="metric-box">
                        <tr>
                           <td class="metric-label">
                                Clic
                            </td>
                           <td class="metric-value" >
                            ${metricas.clic || ''}
                            </td>
                        </tr>
                    </table>
                    
                    <table class="metric-box">
                        <tr>
                            <td class="metric-label">
                                CTR
                            </td>
                           <td class="metric-value" >
                           ${metricas.ctr || ''}
                            </td>
                        </tr>
                    </table>

                    <table class="metric-box">
                        <tr>
                            <td class="metric-label">
                              CTOR
                            </td>
                           <td class="metric-value" >
                           ${metricas.ctor || ''}
                            </td>
                        </tr>
                    </table>
                </div>

                                    <!-- Subject -->
<div>
                        <div class="subject-box">
                        <div class="subject-title">Subject</div>
                    </div>
                     <div class="subject-from"  style="text-align: center;">${formData.subject || ''}</div>

</div>
                    
                </td>
                 
                
                <!-- Right Column -->
                <td class="right-column">
                    <!-- Nombre Campaña y Último envío -->
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 60%; vertical-align: top;">
                                <table class="info-table">
                                    <tr>
                                        <td>
                                          <div class="section-title">Nombre Campaña</div>
                                             <div>${formData.nombreCampana || ''}</div>
                                        </td>
                                        
                                    </tr>
                                </table>
                                
                                <table class="info-table">
                                    <tr>
                                       <td> 
                                          <div class="section-title">Último envío</div>
                                             <div>${formData.ultimoEnvio || ''}</div>
                                        </td>
                                    </tr>
                                </table>
                                <table class="info-table">
                                  <tr>
                                   <td> 
                                    ${formData.preheader ? `
                    <!-- Preheader -->
                            <div class="section-title">Preheader</div>
                        <div style="text-align: center;">${formData.preheader}</div>
          
                    ` : ''}  
                                   </td>
                                  </tr>
                                </table>


                            </td>
                            <td style="width: 40%; vertical-align: top; padding-left: 8px;">
                                <!-- Arte -->
                                <div class="section-title">Arte</div>
                                <div class="art-box">
                                    ${formData.miniatura ? `<img src="${formData.miniatura}" alt="Arte de campaña">` : '<div style="height: 200px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999;">Sin imagen</div>'}
                                </div>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Segmentos Table -->
                    <div class="section-title">Segmentos</div>
                    <table class="segments-table">
                        <thead>
                            <tr>
                                <th style="text-align: left;">Especialidad</th>
                                <th>#Usuarios</th>
                                <th>#Aperturas</th>
                                <th>%Open</th>
                                <th>Clics</th>
                                <th>CTR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${segmentosTableRows}
                        </tbody>
                    </table>
                    
                    <!-- Gráfica de Segmentos enviados -->
                    ${chartImageBase64 ? `
                        <div class="chart-container">
                            <div class="section-title">Gráfica de segmentos enviados</div>
                            <img src="${chartImageBase64}" alt="Gráfica de segmentos">
                        </div>
                    
                    ` : ''}      
                    
                    
                </td>
            </tr>
        </table>
            </div>
            </div>
           `; // (el que ya tienes, no lo toques)
    
           
    
    
           
           const opt = {
            margin: 0,
            filename: `reporte_emailing_${fechaActual.replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: false,
                windowWidth: 1122, // 297mm * 3.78 (px por mm)
                windowHeight: 794   // 210mm * 3.78
            },
            jsPDF: {
                unit: 'mm',
                format: [297, 210] as [number, number],
                orientation: 'landscape' as const
            }
        };

    
          // --- 5. Generar PDF directamente ---
          await html2pdf().set(opt).from(contenidoHTML).save();

    
            setMensaje({ tipo: 'success', texto: 'PDF generado perfectamente' });
        } catch (error) {
            console.error('Error generando PDF:', error);
            setMensaje({
                tipo: 'danger',
                texto: 'Error al generar PDF: ' + (error instanceof Error ? error.message : 'desconocido')
            });
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
                ...formData,
                metricas,
                segmentos,
                segmentosEnviados
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
                    texto: '✅ Reporte guardado exitosamente en Google Sheets' 
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
            detalleCampana: '',
            periodo: '',
            nombreCampana: '',
            ultimoEnvio: '',
            correosEnviados: '',
            subject: '',
            preheader: '',
            miniatura: null as string | null
        });
        setMetricas({
            aperturas: '',
            porcentajeOpen: '',
            clic: '',
            ctr: '',
            ctor: ''
        });
        setSegmentos([
            { id: 1, especialidad: '', usuarios: '', aperturas: '', porcentajeOpen: '', clics: '', ctr: '' }
        ]);
        setSegmentosEnviados('');
        setMensaje({ tipo: '', texto: '' });
    };

    const getCurrentDate = () => {
        const today = new Date();
        return today.toLocaleDateString('es-MX');
    };

    const calcularPorcentajesSegmento = (segmento) => {
        const usuarios = parseFloat(segmento.usuarios) || 0;
        const aperturas = parseFloat(segmento.aperturas) || 0;
        const clics = parseFloat(segmento.clics) || 0;
    
        let porcentajeOpen = '';
        let ctr = '';
    
        // Calcular %Open = aperturas / usuarios * 100
        if (usuarios > 0 && aperturas > 0) {
            porcentajeOpen = ((aperturas / usuarios) * 100).toFixed(2);
        }
    
        // Calcular CTR = clics / usuarios * 100
        if (usuarios > 0 && clics > 0) {
            ctr = ((clics / usuarios) * 100).toFixed(2);
        }
    
        return { porcentajeOpen, ctr };
    };

    return (
        <Container className="mt-4 mb-5">

            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="mb-0">Formato para reporte de emailing</h3>
                        <div>
                            <span className="fw-bold me-2">Fecha:</span>
                            <span>{getCurrentDate()}</span>
                        </div>
                    </div>
                </Col>
            </Row>
            <Row className="mt-4">
                    <Col>
                        <h5 className="titulo_formato_reporte text-primary mb-3">Inicio</h5>
                    </Col>
                </Row>
            <Row className="mb-4" >
                            <Col sm={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Periodo</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="periodo"
                                        value={formData.periodo}
                                        onChange={handleChange}
                                        placeholder="Periodo de la campaña"
                                    />
                                </Form.Group>
                            </Col>
        </Row>

            {mensaje.texto && (
                <Alert variant={mensaje.tipo} onClose={() => setMensaje({ tipo: '', texto: '' })} dismissible>
                    {mensaje.texto}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                {/* Sección: Inicio */}
                

                <Row>
                    <Col md={6}>
                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Detalle de campañas</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="detalleCampana"
                                        value={formData.detalleCampana}
                                        onChange={handleChange}
                                        placeholder="Detalle de la campaña"
                                    />
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Nombre de la campaña:</Form.Label>
                                    <Form.Control 
                                        type="text"
                                        name="nombreCampana"
                                        value={formData.nombreCampana}
                                        onChange={handleChange}
                                        placeholder="Nombre de la campaña"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Último Envío</Form.Label>
                                    <Form.Control 
                                        type="date"
                                        name="ultimoEnvio"
                                        value={formData.ultimoEnvio}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Correos enviados</Form.Label>
                                    <Form.Control 
                                        type="number"
                                        name="correosEnviados"
                                        value={formData.correosEnviados}
                                        onChange={handleChange}
                                        placeholder="Cantidad de correos"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Subject</Form.Label>
                                    <Form.Control 
                                        as="textarea"
                                        rows={3}
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Asunto del correo enviado"
                                    />
                                </Form.Group>
                            </Col>
                            <Col sm={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Preheader</Form.Label>
                                    <Form.Control 
                                        as="textarea"
                                        rows={3}
                                        name="preheader"
                                        value={formData.preheader}
                                        onChange={handleChange}
                                        placeholder="Preheader del correo enviado"
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
                                    document.getElementById('fileInput')?.click();
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
                                    </div>
                                ) : (
                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 py-4">
                                        <FontAwesomeIcon 
                                            icon={faUpload} 
                                            className="text-primary mb-3"
                                            style={{ width: '60px', height: '60px' }}
                                        />
                                        <p className="text-dark fw-semibold mb-1">
                                            Arrastra y suelta aquí el archivo
                                        </p>
                                        <p className="text-secondary mb-2">
                                            del mailing o haz clic para subirlo
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

                {/* Sección: Métricas */}
                <div className="mt-5 mb-4 backgroundTres p-3 ">
                    <h5 className=" titulo_formato_reporte text-primary mb-3">Métricas</h5>
                    <Row className="justify-content-between" >
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Aperturas</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="aperturas"
                                    value={metricas.aperturas}
                                    onChange={handleMetricasChange}
                                    placeholder="Número"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={2}>
                            <Form.Group className="mb-3">
                                <Form.Label>Click</Form.Label>
                                <Form.Control
                                   type="number"
                                    name="clic"
                                    value={metricas.clic}
                                    onChange={handleMetricasChange}
                                    placeholder="Valor"
                                />
                            </Form.Group>
                        </Col>


                        <Col md={2}>
    <Form.Group className="mb-3">
        <Form.Label>%Open</Form.Label>
        <div style={{ position: 'relative' }}>
            <Form.Control
                type="text"
                name="porcentajeOpen"
                value={metricas.porcentajeOpen}
                readOnly
                placeholder="0.00"
                style={{ 
                    backgroundColor: '#e9ecef',
                    paddingRight: '30px'
                }}
            />
            <span style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#6c757d'
            }}>
                %
            </span>
        </div>
    </Form.Group>
</Col>
                      
<Col md={2}>
    <Form.Group className="mb-3">
        <Form.Label>CTR</Form.Label>
        <div style={{ position: 'relative' }}>
            <Form.Control
                type="text"
                name="ctr"
                value={metricas.ctr}
                readOnly
                placeholder="0.00"
                style={{ 
                    backgroundColor: '#e9ecef',
                    paddingRight: '30px'
                }}
            />
            <span style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#6c757d'
            }}>
                %
            </span>
        </div>
    </Form.Group>
</Col>
<Col md={2}>
    <Form.Group className="mb-3">
        <Form.Label>CTOR entre aperturas</Form.Label>
        <div style={{ position: 'relative' }}>
            <Form.Control
                type="text"
                name="ctor"
                value={metricas.ctor}
                readOnly
                placeholder="0.00"
                style={{ 
                    backgroundColor: '#e9ecef',
                    paddingRight: '30px'
                }}
            />
            <span style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#6c757d'
            }}>
                %
            </span>
        </div>
    </Form.Group>
</Col>
                    </Row>
                </div>

                {/* Sección: Segmentos (Tabla) */}

                <div className="mt-5 mb-4">
                <h5 className="titulo_formato_reporte text-primary mb-0">Segmentos</h5>

                    <div className="d-flex justify-content-end align-items-center m-3">
                       
                        <Button 
                            variant="success" 
                            size="sm"
                            onClick={agregarSegmento}
                        >
                            <FontAwesomeIcon icon={faPlus} className="me-2" />
                            Agregar segmento
                        </Button>
                    </div>

                    <div className="table-responsive">
                        <Table bordered hover>
                            <thead className="table-primary">
                                <tr>
                                    <th>Especialidad</th>
                                    <th>#Usuarios</th>
                                    <th>#Aperturas</th>
                                    <th>Clics</th>
                                    <th>%Open</th>
                                    <th>CTR</th>
                                    <th style={{ width: '80px' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {segmentos.map((segmento) => (
                                    <tr key={segmento.id}>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="text"
                                                value={segmento.especialidad}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'especialidad', e.target.value)}
                                                placeholder="Especialidad"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                value={segmento.usuarios}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'usuarios', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                value={segmento.aperturas}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'aperturas', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                size="sm"
                                                type="number"
                                                value={segmento.clics}
                                                onChange={(e) => handleSegmentoChange(segmento.id, 'clics', e.target.value)}
                                                placeholder="0"
                                            />
                                        </td>
                                        <td>
    <div style={{ position: 'relative' }}>
        <Form.Control
            size="sm"
            type="text"
            value={segmento.porcentajeOpen}
            readOnly
            placeholder="0.00"
            style={{ 
                backgroundColor: '#e9ecef',
                paddingRight: '30px'
            }}
        />
        <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6c757d',
            fontSize: '0.875rem'
        }}>
            %
        </span>
    </div>
</td>
                                        
<td>
    <div style={{ position: 'relative' }}>
        <Form.Control
            size="sm"
            type="text"
            value={segmento.ctr}
            readOnly
            placeholder="0.00"
            style={{ 
                backgroundColor: '#e9ecef',
                paddingRight: '30px'
            }}
        />
        <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: '#6c757d',
            fontSize: '0.875rem'
        }}>
            %
        </span>
    </div>
</td>
                                        <td className="text-center">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => eliminarSegmento(segmento.id)}
                                                disabled={segmentos.length === 1}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>

                    {/* Gráfica automática - se muestra si hay datos válidos */}
                    {segmentos.some(s => 
                        s.especialidad && s.especialidad.trim() !== '' && 
                        s.usuarios && s.usuarios.trim() !== '' && 
                        !isNaN(parseInt(s.usuarios))
                    ) && (
                        <Card className="mt-4">
                            <Card.Header className="bg-light">
                                <h6 className="mb-0">Segmentos enviados</h6>
                            </Card.Header>
                            <Card.Body>
                                <div style={{ height: '300px', position: 'relative' }}>
                                    <canvas ref={canvasRefCallback}></canvas>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </div>

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
    );
}

export default FormatoReporte;