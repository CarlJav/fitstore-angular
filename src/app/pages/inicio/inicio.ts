import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface LineaProducto {
  titulo: string;
  subtitulo: string;
  descripcion: string;
  ruta: string;
  categoriaFiltro?: string;
  textoBoton: string;
  imagen: string;
}

interface Beneficio {
  titulo: string;
  descripcion: string;
  imagen: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {
  lineas: LineaProducto[] = [
    {
      titulo: 'Fuerza',
      subtitulo: 'Potencia · Carga progresiva',
      descripcion:
        'Mancuernas hexagonales y equipamiento de alta resistencia diseñado para rutinas intensas en casa o gimnasio.',
      ruta: '/catalogo',
      categoriaFiltro: 'Fuerza',
      textoBoton: 'Ver equipos',
      imagen: '/img/pesa01.jpg'
    },
    {
      titulo: 'Cardio y Velocidad',
      subtitulo: 'Resistencia · Agilidad',
      descripcion:
        'Accesorios ligeros ideales para mejorar tu condición física, coordinación y quema calórica.',
      ruta: '/catalogo',
      categoriaFiltro: 'Cardio',
      textoBoton: 'Ver equipos',
      imagen: '/img/cardio1.jpg'
    },
    {
      titulo: 'Funcional y Accesorios',
      subtitulo: 'Movilidad · Protección',
      descripcion:
        'Bandas elásticas de resistencia y guantes de agarre reforzado para entrenar con seguridad y control en cada serie.',
      ruta: '/catalogo',
      categoriaFiltro: 'Funcional',
      textoBoton: 'Ver accesorios',
      imagen: '/img/bandas.jpg'
    }
  ];

  beneficios: Beneficio[] = [
    {
      titulo: 'Entrega Gratuita 24 Hrs',
      descripcion: 'Envíos directos y asegurados sin cargo adicional en todo el país.',
      imagen: '/img/entrega1.jpg' // Cambia por el nombre real de tu archivo en public/img/
    },
    {
      titulo: 'Garantía Oficial Escrita',
      descripcion: 'Productos 100% nuevos, sellados de fábrica y con factura legal.',
      imagen: '/img/garantia.png'
    },
  
    {
      titulo: 'Asesoría Técnica Experta',
      descripcion: 'Atención personalizada y compatibilidad de equipos por Whatsapp.',
      imagen: '/img/asesoria.jpg'
    }
  ];
}