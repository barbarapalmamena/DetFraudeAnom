## regla de colores

Quiero que uses los siguientes colores en mi portafolio
Fondo
#16161A
Superficie
#2C2C2A
Acento
#7F77DD
Acento suave
#AFA9EC
Texto claro
#F0EFFF

## Identidad del proyecto

Este es un portafolio profesional de ingeniería en informática. El código debe ser limpio, bien documentado y representar buenas prácticas, ya que es una carta de presentación pública.

## Reglas de commits

Todos los commits **deben** seguir la especificación [Conventional Commits](https://www.conventionalcommits.org/).

### Formato

```
<tipo>(<alcance opcional>): <descripción corta>

[cuerpo opcional]

[footer opcional]
```

### Tipos permitidos

| Tipo       | Cuándo usarlo                                                      |
| ---------- | ------------------------------------------------------------------ |
| `feat`     | Nueva funcionalidad o sección del portafolio                       |
| `fix`      | Corrección de un bug o error visual                                |
| `style`    | Cambios de estilos, colores, tipografía (sin lógica)               |
| `refactor` | Reestructuración de código sin cambiar comportamiento              |
| `perf`     | Mejoras de rendimiento (lazy load, optimización de imágenes, etc.) |
| `docs`     | Cambios en documentación o comentarios                             |
| `chore`    | Tareas de mantenimiento, dependencias, configuración               |
| `ci`       | Cambios en pipelines de CI/CD o despliegue                         |
| `test`     | Añadir o corregir tests                                            |
| `revert`   | Revertir un commit anterior                                        |

### Alcances sugeridos

Usa el nombre de la sección o módulo afectado:

`hero` · `about` · `projects` · `skills` · `certifications` · `contact` · `navbar` · `footer` · `seo` · `animations` · `api` · `config`

### Ejemplos válidos

```
feat(projects): agregar tarjeta del proyecto de machine learning

fix(contact): corregir validación del formulario en móvil

style(hero): ajustar tamaño de tipografía en pantallas pequeñas

perf(projects): lazy load de imágenes en la grilla de proyectos

chore: actualizar dependencias de Next.js a v15

docs: agregar instrucciones de despliegue en el README
```

### Reglas adicionales

- La descripción va en **minúsculas** y **siempre en español**.
- Máximo **72 caracteres** en la primera línea.
- Usa el cuerpo del commit para explicar el _por qué_, no el _qué_.
- Los breaking changes se indican con `!` después del tipo: `feat!: cambiar estructura de rutas`.

---

## Estilo de código

- Usa nombres de variables y funciones en **inglés**.
- Comenta en **español** cuando la lógica no sea evidente.
- No dejes `console.log` ni código comentado en commits a `main`.

---

## Ramas

| Rama            | Propósito                             |
| --------------- | ------------------------------------- |
| `main`          | Producción — siempre desplegable      |
| `dev`           | Integración de features en desarrollo |
| `feat/<nombre>` | Nueva funcionalidad o sección         |
| `fix/<nombre>`  | Corrección puntual                    |

Nunca hagas commits directamente a `main`. Usa pull requests desde `dev`.

---

## Despliegue

- El despliegue es automático desde `main` (Vercel / Netlify / GitHub Pages).
- Antes de hacer merge a `main`, verifica que el build pase sin errores ni warnings críticos.

---

## Notas para el agente

- Si no estás seguro del tipo de commit correcto, usa `chore`.
- No modifiques `AGENTS.md` a menos que se te pida explícitamente.
- Si creas un componente nuevo, agrégalo también al alcance sugerido de este archivo.
