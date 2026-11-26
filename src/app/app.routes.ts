import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { CatalogoComponent } from './pages/catalogo/catalogo';
import { Registro } from './pages/registro/registro';
import { Historial } from './pages/historial/historial';
import { Detalle } from './pages/detalle/detalle';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'inicio', component: Inicio },
  { path: 'catalogo', component: CatalogoComponent },
  { path: 'registrar', component: Registro },
  { path: 'historial', component: Historial },
  { path: 'pedidos/:id', component: Detalle },
  {
    path: 'productos/:id',
    loadComponent: () =>
      import('./pages/producto-detalle/producto-detalle').then(m => m.ProductoDetalleComponent)
  },
  { path: '**', redirectTo: 'catalogo' }
];