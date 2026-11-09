import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { forkJoin } from 'rxjs';

interface Usuario {
  id: string;
  nombre: string;
}

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  etiquetas: string;
}

interface Recomendacion {
  id: string;
  titulo: string;
  puntuacion: number;
  explicacion: string;
}

interface Evento {
  numero: number;
  accion: string;
  recurso: string;
}

interface Cambio {
  id: string;
  titulo: string;
  antes: number;
  despues: number;
}

type Perfil = Record<string, number>;

interface EstadoUsuario {
  usuario: string;
  nombre: string;
  perfil: Perfil;
  historial: Evento[];
  recomendaciones: Recomendacion[];
  mensaje: string | null;
  perfil_anterior?: Perfil;
  recurso_valorado?: string;
  cambios?: Cambio[];
}

// Toda la lógica de similitud y actualización vive en la API Python (motor.py);
// este componente solo recoge las elecciones y presenta los resultados.
@Component({
  selector: 'app-root',
  imports: [DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly resultado = viewChild<ElementRef<HTMLElement>>('resultado');

  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly recursos = signal<Recurso[]>([]);
  protected readonly usuarioId = signal('');
  protected readonly recursoId = signal('');
  protected readonly estado = signal<EstadoUsuario | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly terminos = computed(() => Object.entries(this.estado()?.perfil ?? {}));
  protected readonly terminosAnteriores = computed(() =>
    Object.entries(this.estado()?.perfil_anterior ?? {}),
  );

  protected readonly recursoElegido = computed(() =>
    this.recursos().find((r) => r.id === this.recursoId()),
  );

  protected readonly recursoValorado = computed(() =>
    this.recursos().find((r) => r.id === this.estado()?.recurso_valorado),
  );

  // Solo los recursos cuya puntuación cambió, de mayor a menor variación.
  protected readonly recursosCambiados = computed(() =>
    (this.estado()?.cambios ?? [])
      .filter((c) => Math.abs(c.despues - c.antes) > 1e-9)
      .sort((a, b) => Math.abs(b.despues - b.antes) - Math.abs(a.despues - a.antes)),
  );

  protected readonly recursosSinCambio = computed(
    () => (this.estado()?.cambios?.length ?? 0) - this.recursosCambiados().length,
  );

  ngOnInit(): void {
    forkJoin({
      usuarios: this.http.get<Usuario[]>('/api/usuarios'),
      recursos: this.http.get<Recurso[]>('/api/recursos'),
    }).subscribe({
      next: ({ usuarios, recursos }) => {
        this.usuarios.set(usuarios);
        this.recursos.set(recursos);
        if (usuarios.length > 0) this.seleccionarUsuario(usuarios[0].id);
      },
      error: (e) => this.mostrarError(e),
    });
  }

  protected seleccionarUsuario(id: string): void {
    this.usuarioId.set(id);
    this.recursoId.set('');
    this.http.get<EstadoUsuario>(`/api/usuarios/${id}/recomendaciones`).subscribe({
      next: (estado) => this.aplicar(estado),
      error: (e) => this.mostrarError(e),
    });
  }

  protected meInteresa(): void {
    const recursoId = this.recursoId();
    if (!recursoId) return;
    this.http
      .post<EstadoUsuario>(`/api/usuarios/${this.usuarioId()}/interacciones`, {
        recurso_id: recursoId,
      })
      .subscribe({
        next: (estado) => {
          this.aplicar(estado);
          this.mostrarResultado();
        },
        error: (e) => this.mostrarError(e),
      });
  }

  // El efecto queda bajo el pliegue: se desplaza la vista para que se vea tras valorar.
  private mostrarResultado(): void {
    afterNextRender(
      () => {
        const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.resultado()?.nativeElement.scrollIntoView({
          behavior: reducir ? 'auto' : 'smooth',
          block: 'start',
        });
      },
      { injector: this.injector },
    );
  }

  private aplicar(estado: EstadoUsuario): void {
    this.error.set(null);
    this.estado.set(estado);
  }

  private mostrarError(e: HttpErrorResponse): void {
    this.error.set(e.error?.error ?? 'No se pudo conectar con la API. ¿Está en ejecución?');
  }
}
