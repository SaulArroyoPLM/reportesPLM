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
            const plantillaBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA0oAAAJTCAYAAAA2dOYKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAADKRJREFUeNrs3T9vE2ccB/AnhQ7dMnWtK3UnTB0YcIaOqMnQOc4rgOxIJBK74RXgzAwE8QIwlTJ0wuyVGlakqmmXDhVNnx95XA5zvjh/zsTo85FOjn13z3PO3eCvfnfPkxIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADUW5pXR7fu73fyS6f62bO7N4anbKNbeXuY9x9V1r0s7V/Pnx9Ma+Prn3Z7+WVjhu6i7Vd52XvzeOOwpp1+flmp2W8rbz9qajjvG/v1p6w+zPuvn/H4R3nfLZc1AACcz9U5BKTt8sO+U7MuXgZ52ZkWbvI2yyVU9GrWHZR9B5XQEv0cNBxSrO/OcOjjbfo5nOzkAPJgYv3KlHaWZ2h7uekYcn/d3N+0EHmv7n8JAABcnC9aDkkvZ/hhHwHoZd52pWb/+Oy3upBUDQ4/bP9crc5sRDira++MlktYejTH83J7WoASkgAAYIGDUqkkzRpWIow8mdg/AsHz1FyhiVviOkdH6c5E8Ipw1r/gr9TLQWVtTudlLfdVF4g2XLIAALDAQSn7cUqwGab6W+M6E88g9dNst7ENv/ryyvDfnJb+/udtent0NCp97Lbwne7N8dz0qm9KcOq5ZAEAYLGDUl01afXZ3RuxfFvCTK1y21xd9WYv2sjLeglb/z8n9MXSUsqBKV1ZWtoqfQxOebyD0vZWmv6M00oOLMtzOjcbTcEJAABYzKD0UdiojlKXjkeVmzUkhGHefz1GysvLXglLY9XwcnjG430dAyiUQRtWTxkA29ApI9w1/U8AAIAWtDnq3TBNVEFu3d+PARGiYtNNH1dIDivhKYbl3qmufPP7X6McHLZzkNkeh67c3mZ6P7hBtHs4EcbOJPdxkPu6DOcnwtGgPBvVcbkCAMDiB6UILivpwwpML02/hSxumTssISjCQQzQcDPmFCqVlRgJ7mmZvyiCVP+XV79GKNosbcbADw9Sc6VqJqXvy6Bbnk267VIFAID5ae3WuxJ64va4WW6F26p5pijCwUqZnDXCQjcv35TgFZWp1RKKbpdlkM5XddnIfT3PSwxp3jQZ7HDO56ifZpv3CQAAuOxBqUwUG0N+zzL4QT9v3xu/KVWUcegZP5tzkD6sRsX7P8vf4/BynuG7x2Gs6RmkvU9wjtZcpgAA8JkEpRKSJkNH0/Dgj8rcSeNwMEjHzymN29hN76tT8fkf6biSNP48QtSoxe8TfWy1fD6GpzgWAACgJa08o1SG9+7W/LhfHQ+2kLd5kj6ulsQ8RZvfX/subrHrpPdVpZsRjvK+25Vtt8uktv0PQsa1/d4ZhgY/SQS79TePN9oOKC8mvvc08f3uuHwBAGCBglKqf6ZmNDEi3cOaoNQ5oY1hJYzFtlFRmry17yKrPhGQomL1YA4hqfp/6Z9wTE8FJQAAWLygVPdc0kpUmiphqWleoN2aINAtVaiHpf1+TT8H5xgefFD6feccgzbEoBDdKeuGM7Q7OCEo7bpsAQBgMYPSaEp4epnDTgSFTmq4vazMkRTbTQaOtdQ8uMHOOY759QWNaNc7YX1jH1G5ykFrr+F7DpI5lQAAoFVtDeYQYWDarWrdhh/61WrJZjrdoAXDFp5N+lSmVY32YjJcly0AACxgUCpzKJ026AyqQSf/HYFgdcY2ooK1/rmclByGoqJUF4ieumQBAGBBg1IJOnsl6Jw091AEgs28/WZNGxGArqfj283qRIiK0fCul3D2OZmsKsVktwOXLAAAtO9qm42XoPOu0nPr/n63fByvoxJyDkrlqKmNd0Eq7x+j2cWw452y72FeNzzDYQ1P+XlTkHlxxr7jO+2ccAyToWg0ES53poROAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC6n/wQYAAzyo53Fraa/AAAAAElFTkSuQmCC";
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
        
        .title {
            font-size: 14px;
            font-weight: bold;
            color: #333;
            text-align: right;
        }
        
        .periodo {
            background-color: #E8F4FD;
            padding: 8px 12px;
            margin-bottom: 15px;
            font-size: 12px;
            border-left: 4px solid #4A90E2;
            color: #333;
        }
        
        /* Sección superior - Datos de la campaña */
        .seccion-titulo {
            background-color: #E8F4FD;
            color: #4A90E2;
            font-weight: bold;
            font-size: 12px;
            padding: 8px;
            text-align: center;
            margin-bottom: 8px;
        }
        
        .tabla-datos {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        
        .correos-enviados-box {
            width: 200px;
            vertical-align: top;
            padding-right: 10px;
        }
        
        .correos-box {
            background-color: #D6E8F5;
            border: 1px solid #4A90E2;
            text-align: center;
            padding: 20px;
            height: 180px;
            display: flex;
            align-items: center;
            flex-direction: column;
            justify-content: center;

        }
        
        .correos-label {
            color: #4A90E2;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .correos-valor {
            color: #4A90E2;
            font-size: 32px;
            font-weight: bold;
        }
        
        .datos-campana-col {
            vertical-align: top;
        }
        
        .dato-row {
            margin-bottom: 16px;
            height: 90px;
        }
        
        .dato-label {
            color: #4A90E2;
            font-size: 11px;
            font-weight: bold;
            padding: 5px 8px;
            border-bottom: 1px solid #4A90E2;
            margin-bottom: 5px;
        }
        
        .dato-valor {
            font-size: 14px;
            padding: 5px 8px;
            border-bottom: 1px solid #ddd;
            border-top: none;
            height: 75px;
        }
        
        .arte-box {
            width: 200px;
            vertical-align: top;
            padding-left: 10px;
        }
        
        .arte-container {
            border: 1px solid #4A90E2;
            padding: 8px;
            text-align: center;
            height: 200px;
             width: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .arte-container img {
            max-width: 100%;
            max-height: 160px;
        }
        
        /* Objetivos de la campaña - Métricas horizontales */
        .metricas-tabla {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        
        .metrica-cell {
            width: 20%;
            text-align: center;
            vertical-align: top;
        }
        
        .metrica-box {
            background-color: #E8F4FD;
            margin: 0 4px;
        }
        
        .metrica-header {
            color: #4A90E2;
            font-size: 12px;
            font-weight: bold;
            padding: 8px;
            background-color: #E8F4FD;
            border-bottom: 1px solid #4A90E2;
        }
        
        .metrica-valor {
            color: #4A90E2;
            font-size: 18px;
            font-weight: bold;
            padding: 12px;
            background-color: white;
        }
        
        /* Sección de segmentos */
        .tabla-segmentos-completa {
            width: 100%;
            border-collapse: collapse;
        }
        
        .segmentos-izq {
            width: 50%;
            vertical-align: top;
            padding-right: 10px;
        }
        
        .segmentos-der {
            width: 50%;
            vertical-align: top;
            padding-left: 10px;
        }
        
        .tabla-segmentos {
            width: 100%;
            border-collapse: collapse;
        }
        
        .tabla-segmentos th {
            background-color: #E8F4FD;
            color: #4A90E2;
            font-size: 10px;
            font-weight: bold;
            padding: 6px 4px;
            border: 1px solid #4A90E2;
            text-align: center;
        }
        
        .tabla-segmentos td {
            font-size: 10px;
            padding: 6px 4px;
            border: 1px solid #ddd;
            text-align: center;
        }
        
        .tabla-segmentos td:first-child {
            text-align: left;
            padding-left: 8px;
        }
        
        .grafica-container {
            padding: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .grafica-container img {
            max-width: 100%;
            max-height: 100%;
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

        <!-- Datos de la campaña -->
        <div class="seccion-titulo">Datos de la campaña</div>
        <table class="tabla-datos">
        <tr>
        <!-- Correos enviados -->
                    <td class="correos-enviados-box">
                    	  <div class="dato-label" style="margin-bottom: 5px;">Correos enviados</div>
                        <div class="correos-box">
                            <div class="correos-valor">${formData.correosEnviados || ''}</div>
                        </div>
                    </td>
                    <!-- Datos principales en 2 columnas -->

 <td class="datos-campana-col">
 <table style="width: 100%; border-collapse: collapse;">
 <tr>
    <!-- Columna izquierda -->
    <td style="width: 50%; vertical-align: top; padding-right: 5px;">
                                    <div class="dato-row">
                                        <div class="dato-label">Nombre Campaña</div>
                                        <div class="dato-valor">${formData.nombreCampana || ''}</div>
                                    </div>
                                    
                                    <div class="dato-row">
                                        <div class="dato-label">Último envío</div>
                                        <div class="dato-valor">${formData.ultimoEnvio || ''}</div>
                                    </div>
                                </td>

    <!-- Columna derecha -->
      <td style="width: 50%; vertical-align: top; padding-left: 5px;">
      <div class="dato-row">
        <div class="dato-label">Preheader</div>
        <div class="dato-valor">${formData.preheader || ''}</div>
    </div>
     <div class="dato-row">
        <div class="dato-label">Subject</div>
        <div class="dato-valor">${formData.subject || ''}</div>
    </div>
      
      </td>     
      <!-- Arte -->
                    <td class="arte-box">
                        <div class="dato-label" style="margin-bottom: 5px;">Arte</div>
                        <div class="arte-container">
                              ${formData.miniatura ? `<img src="${formData.miniatura}" alt="Arte de campaña">` : '<div style="height: 200px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #999;">Sin imagen</div>'}
                        </div>
                    </td>
      
 </tr>
 </table>
 
 </td>
        </tr>
        </table>
        <div class="seccion-titulo">Objetivos de la campaña</div>
        <table class="metricas-tabla">
                <tr>
                    <td class="metrica-cell">
                        <div class="metrica-box">
                            <div class="metrica-header">Aperturas</div>
                            <div class="metrica-valor">${metricas.aperturas || ''}</div>
                        </div>
                    </td>
                    <td class="metrica-cell">
                        <div class="metrica-box">
                            <div class="metrica-header">%Open</div>
                            <div class="metrica-valor">${metricas.porcentajeOpen || ''}</div>
                        </div>
                    </td>
                    <td class="metrica-cell">
                        <div class="metrica-box">
                            <div class="metrica-header">Clic</div>
                            <div class="metrica-valor">${metricas.clic || ''}</div>
                        </div>
                    </td>
                    <td class="metrica-cell">
                        <div class="metrica-box">
                            <div class="metrica-header">CTR</div>
                            <div class="metrica-valor"> ${metricas.ctr || ''}</div>
                        </div>
                    </td>
                    <td class="metrica-cell">
                        <div class="metrica-box">
                            <div class="metrica-header">CTOR</div>
                            <div class="metrica-valor">${metricas.ctor || ''}</div>
                        </div>
                    </td>
                </tr>
            </table>
<div class="seccion-titulo">Selección de segmentos</div>
<table class="tabla-segmentos-completa">
                <tr>
                    <!-- Tabla de segmentos -->
                    <td class="segmentos-izq">
                        <div class="dato-label" style="margin-bottom: 5px;">Segmentos</div>
                        <table class="tabla-segmentos">
                            <thead>
                                <tr>
                                    <th>Especialidad</th>
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
                    </td>
                    
                    <!-- Gráfica -->
                    <td class="segmentos-der">
                        <div class="dato-label" style="margin-bottom: 5px;">Gráfica de segmentos enviados</div>
                        <div class="grafica-container">
                           ${chartImageBase64 ? `
                    <div class="grafica-container">
                        <img src="${chartImageBase64}" alt="Gráfica de segmentos">
                    </div>
                    ` : '<div class="grafica-container" style="color: #999;">Sin gráfica</div>'}
                        </div>
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
                    <h5 className="titulo_formato_reporte  mb-3">Datos de la campaña</h5>
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
                    <h5 className=" titulo_formato_reporte mb-3">Objetivos de la campaña</h5>
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
                    <h5 className="titulo_formato_reporte mb-0">Selección de segmentos</h5>

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