# Laboratorio de aplicación inteligente adaptativa

## Identificación

- Integrantes: [Completar: máximo 3 nombres]
- Curso y sección: [Completar]
- URL del repositorio: https://github.com/JanHH16/webAvanzada3
- Fecha: 09-11-2026

## Objetivo y alcance

Complete un recomendador de recursos de aprendizaje que represente los intereses
de cada usuario y actualice su perfil al recibir la interacción **Me interesa**.
El núcleo se implementa en Python y se ejecuta por consola. Una interfaz Angular
puede incorporarse como extensión después de esta actividad.

El catálogo, los perfiles, las validaciones, la aplicación por consola y el registro
de evidencias se proporcionan. Complete únicamente los cuatro bloques señalados
en `motor.py` y documente su interpretación. No modifique los datos de las pruebas
ni la aplicación para obtener un resultado esperado.

La representación usa **solo la columna etiquetas**. Títulos y descripciones sirven
para presentar el catálogo. Todos los recursos continúan disponibles después de
una interacción; no se excluye el recurso valorado. Esto permite comparar el mismo
conjunto de 12 candidatos antes y después de la actualización del perfil.

## Preparación

Versión utilizada: **Python 3.14.0** (Windows 11). Se requiere Python 3.10 o posterior. Abra una terminal en esta carpeta.

```bash
python -m venv .venv
```

En Windows puede usar `py -m venv .venv`.

Activación en PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

Activación en CMD:

```bat
.venv\Scripts\activate.bat
```

Activación en macOS o Linux:

```bash
source .venv/bin/activate
```

Instalación y comprobación:

```bash
python -m pip install -r requirements.txt
python -c "import sys; print(sys.executable)"
python app.py --comprobar
```

La comprobación funciona con los cuatro bloques sin completar. Debe informar
12 recursos, 4 usuarios y una matriz TF-IDF de 12 filas. Comando de
activación utilizado: `.venv\Scripts\Activate.ps1` (PowerShell). Las versiones instaladas
quedaron registradas con:

```bash
python -m pip freeze > requirements.txt
```

## Funciones que debe completar

| Función | Entrada principal | Salida y requisito |
|---|---|---|
| `crear_perfil` | Texto de intereses y vectorizador ya ajustado | Vector NumPy de una dimensión obtenido con `transform`; no ajustar nuevamente el vocabulario. |
| `calcular_puntuaciones` | Vector del perfil y matriz de recursos | Un valor de similitud del coseno por recurso. |
| `recomendar` | Perfil y catálogo indexado | Hasta 3 resultados con puntuación positiva; orden descendente y desempate por `id` ascendente. |
| `actualizar_perfil` | Perfil anterior y vector del recurso valorado | Vector normalizado de la combinación `0.4 * perfil + 0.6 * recurso`. |

Use `construir_resultado` al construir cada recomendación. Esta función proporciona
`id`, `titulo`, `puntuacion` y una `explicacion` basada en términos compartidos.

Un perfil vacío o compuesto por palabras fuera del vocabulario produce un vector
nulo. En esos casos deben obtenerse puntuaciones cero y una lista de recomendaciones
vacía; la aplicación ya proporciona el mensaje informativo.

El parámetro 0.6 es una elección didáctica que da mayor peso a la interacción reciente.
No es un valor validado experimentalmente. Una similitud no es una probabilidad de
interés. El ejercicio no entrena un modelo supervisado ni demuestra comprensión
semántica de los recursos.

## Ejecución después de completar el motor

Modo interactivo:

```bash
python app.py
```

Seleccione un usuario. Puede consultar el catálogo, solicitar recomendaciones y
registrar **Me interesa** indicando el ID de cualquier recurso, aunque no aparezca
entre los tres primeros. Un ID desconocido muestra un aviso y no actualiza el perfil.
Los perfiles y sus historiales de interacciones se conservan por separado durante
la ejecución. La consola muestra el historial del usuario activo. Al reiniciar se
cargan nuevamente los intereses iniciales del JSON y los historiales quedan vacíos.

Demostración reproducible:

```bash
python app.py --demo
```

Este comando parte de los perfiles iniciales, ejecuta T1-T4 y genera:

- `evidencias/reporte_demo.json`: perfiles, historiales, recomendaciones y comprobaciones.
- `evidencias/puntuaciones_antes_despues.csv`: los mismos 12 recursos con sus
  puntuaciones anteriores, posteriores y diferencias, incluyendo ceros.

Que la aplicación muestre **Cumple** es una comprobación orientativa. Revise las
puntuaciones y explique qué evidencia respalda cada resultado.

## Pruebas funcionales y evidencias

| Caso | Entrada o acción | Resultado esperado | Resultado observado y evidencia | Estado |
|---|---|---|---|---|
| T1 | Recomendar para u1 y u2 sin interacciones | R02 primero para u1; R07 primero para u2; orden descendente, máximo 3 y puntuaciones positivas. | u1: R02 (1.0000), R12 (0.4965), R03 (0.4326). u2: R07 (1.0000), R08 (0.5677), R09 (0.3087). Listas válidas (orden, máximo 3, puntuaciones > 0). Evidencia: `evidencias/reporte_demo.json`, caso T1. | Cumple |
| T2 | u1 indica Me interesa sobre R04 y se recalcula | Cambia el perfil; R04 pasa al primer lugar; aumenta la puntuación de R05; se conservan los 12 candidatos. | El perfil cambió. Nuevo top 3: R04 (0.8752), R02 (0.6880), R09 (0.4958). R05 pasó de 0.0000 a 0.4378. El CSV conserva los 12 recursos y el historial registra el evento `Me interesa` sobre R04. Evidencia: `evidencias/puntuaciones_antes_despues.csv`. | Cumple |
| T3 | Consultar u2 después de la interacción de u1 | El perfil, el historial y las puntuaciones de u2 se mantienen. | Perfil, puntuaciones, recomendaciones e historial de u2 idénticos antes y después (historial vacío). Cada usuario tiene su propio vector en el estado. | Cumple |
| T4 | Recomendar para u3 y u4 | Cero puntuaciones positivas, lista vacía y mensaje informativo para ambos. | u3 (intereses vacíos) y u4 (`zzxyz123`) producen vector nulo, puntuaciones todas 0, lista vacía y el mensaje "No hay coincidencias positivas. Declare intereses presentes en el catálogo." | Cumple |

La salida de `python app.py --demo` indicó **Cumple** en T1 a T4 (código de salida 0). Como la propia aplicación advierte, es una comprobación orientativa; la evidencia numérica está en los archivos de `evidencias/`.

### Comparación de la adaptación

- Perfil de u1 antes de valorar R04: `{pandas: 0.753247, datos: 0.465091, python: 0.465091}`
- Perfil de u1 después de valorar R04: `{python: 0.637116, api: 0.446269, web: 0.446269, pandas: 0.376477, datos: 0.232455}`
- Recomendaciones de u1 antes: R02 (1.0000), R12 (0.4965), R03 (0.4326). Después: R04 (0.8752), R02 (0.6880), R09 (0.4958).
- Puntuación de R05 antes y después: 0.0000 → 0.4378 (R05 no fue el recurso valorado).
- Por qué ese cambio es evidencia de adaptación: R05 (`web api http`) no compartía ningún término con el perfil inicial de u1 (`python datos pandas`), por eso su puntuación era 0. Al valorar R04 (`python web api`), el perfil incorporó los términos `web` y `api` (0.446269 cada uno) y R05 comparte justamente esos dos términos, por lo que su puntuación subió sin que el usuario la hubiera valorado. Lo mismo ocurre con R06 (0.0000 → 0.4378) y R09 (0.0000 → 0.4958). En sentido contrario, bajaron los recursos que dependían de `datos`: R02 (1.0000 → 0.6880), R10 y R11 (0.2053 → 0.1026), porque la normalización reparte el peso entre más términos. R07 y R08 se mantienen en 0 porque ninguno de sus términos entró al perfil. Esto demuestra que el estado del perfil se modificó automáticamente por el evento y que el efecto se propaga a todos los candidatos, que son los mismos 12 antes y después.
- Observación sobre empates: R05 y R06 quedan con la misma puntuación (0.4378); el desempate por `id` ascendente los ordena de forma determinista. Ambos quedan fuera del top 3 por R09 (0.4958).
- Problemas detectados y acciones realizadas: no se detectaron fallos; las cuatro pruebas cumplen. Dos observaciones: (1) el vocabulario se aprende solo con etiquetas, por lo que un término como `zzxyz123` se ignora y el perfil queda nulo, comportamiento que T4 verifica y que obliga a devolver `[]` (se filtran las puntuaciones `<= 0`). (2) Al abrir el CSV de evidencias con PowerShell 5.1 las tildes aparecen mal; el archivo está en UTF-8 y se ve correcto en un editor o con `encoding="utf-8"`.

## Preguntas evaluadas

1. ¿Qué información describe el contenido de los recursos y qué información constituye el perfil del usuario? Identifique ambas en los archivos del proyecto.
   Respuesta: El contenido de los recursos está en `datos/recursos.csv`. De sus columnas, solo `etiquetas` se vectoriza con TF-IDF (`construir_indice` en `motor.py`); `titulo` y `descripcion` solo se usan para presentar. El perfil del usuario está en `datos/perfiles.json` (campo `intereses`, texto inicial) y, durante la ejecución, en el vector que devuelve `crear_perfil` y que `actualizar_perfil` modifica (diccionario `estado` en `app.py`).
2. ¿Por qué se utiliza fit_transform sobre el catálogo y transform sobre los intereses del usuario? ¿Qué problema causaría ajustar un vectorizador diferente para cada perfil?
   Respuesta: `fit_transform` sobre el catálogo aprende una sola vez el vocabulario y los pesos IDF, y devuelve la matriz de recursos. Los intereses se pasan por `transform`, que reutiliza ese mismo vocabulario y ese mismo orden de columnas, de modo que perfil y recursos viven en el mismo espacio y pueden compararse con el coseno. Si cada perfil ajustara su propio vectorizador, cada uno tendría un vocabulario y un IDF distintos: los vectores tendrían dimensiones y significados incompatibles con la matriz del catálogo (la comparación fallaría o sería incorrecta), y los pesos del perfil no serían comparables entre usuarios.
3. ¿Por qué el mismo catálogo puede producir recomendaciones distintas para u1 y u2? ¿Una similitud de 0,80 significa que existe un 80 % de probabilidad de que el recurso guste? Justifique.
   Respuesta: Porque los perfiles son distintos: u1 (`python datos pandas`) y u2 (`angular componentes interfaces`) comparten el catálogo pero sus vectores apuntan a términos diferentes, así que el coseno ordena distinto (u1 obtiene R02, R12, R03; u2 obtiene R07, R08, R09). No: una similitud de 0,80 no es una probabilidad. Es el coseno del ángulo entre dos vectores TF-IDF, una medida de parecido de términos, no está calibrada contra datos de preferencias reales ni demuestra que el usuario vaya a valorar el recurso. Por ejemplo, R02 tiene similitud 1.0000 con u1 solo porque sus etiquetas coinciden exactamente con los intereses.
4. ¿En qué se diferencia modificar manualmente los intereses iniciales de la adaptación implementada? Identifique el evento que provoca el cambio, el estado modificado y su efecto observable.
   Respuesta: Editar a mano `perfiles.json` es un cambio externo y estático: requiere que una persona modifique el archivo y reiniciar para verlo. La adaptación implementada ocurre en ejecución y sin edición manual. El evento que la provoca es la interacción **Me interesa** sobre un recurso (`registrar_interes` en `app.py`). El estado modificado es el vector del perfil del usuario, que pasa a `normalize(0.4 * perfil + 0.6 * recurso)`, además de su historial. El efecto observable es el cambio de puntuaciones y de ranking: en la demo, u1 pasó de R02 primero a R04 primero y R05 subió de 0.0000 a 0.4378.
5. Relacione su implementación con las etapas del ciclo MAPE-K estudiado en clase: Monitorizar, Analizar, Planificar, Ejecutar y Conocimiento. Indique una función, operación o dato de su programa para cada etapa.
   Respuesta:
   - **Monitorizar:** captura del evento **Me interesa** con el ID del recurso (opción `m` en `interactivo`, validada por `obtener_indice`).
   - **Analizar:** `calcular_puntuaciones` mide la similitud coseno entre el perfil y cada recurso, y `explicar_coincidencias` identifica los términos compartidos.
   - **Planificar:** la regla de adaptación `0.4 * perfil + 0.6 * recurso` normalizada y el criterio de ordenamiento de `recomendar` (descendente, desempate por `id`, solo puntuaciones > 0).
   - **Ejecutar:** `actualizar_perfil` y `registrar_interes` aplican el nuevo vector al estado del usuario, y `recomendar` entrega la nueva lista.
   - **Conocimiento:** el vocabulario TF-IDF y la matriz de recursos (`construir_indice`), el vector de perfil de cada usuario (`estado`) y el historial de interacciones (`historial`).
6. Indique una limitación del mecanismo implementado y proponga una mejora concreta. Explique qué dato adicional o qué cambio del algoritmo exigiría esa mejora.
   Respuesta: Limitación: el perfil solo crece con intereses positivos y se basa en coincidencia exacta de etiquetas, sin semántica ni olvido. Un solo clic mueve el perfil con peso fijo de 0.6, y el sistema no puede expresar rechazo ni distinguir sinónimos (por ejemplo `grafico` y `graficos` son términos distintos). Mejora concreta: incorporar una interacción **No me interesa** que reste peso a los términos del recurso (por ejemplo `perfil - 0.3 * recurso`, con los valores negativos recortados a 0 antes de normalizar), y un factor de olvido para que los intereses antiguos pierdan peso con el tiempo. Eso exige registrar en el historial el tipo de acción (positiva o negativa) y su fecha, además de decidir y validar los coeficientes con valoraciones reales de usuarios, ya que 0.6 es un valor didáctico.

## Archivos de la entrega

Entregue `app.py`, `motor.py`, `datos/recursos.csv`, `datos/perfiles.json`,
`requirements.txt`, `.gitignore`, este README completado y los dos archivos de
`evidencias/`. No incluya `.venv`, `__pycache__` ni dependencias instaladas.

### Reproducción desde una copia nueva

Compruebe que otra persona puede crear el entorno, instalar las dependencias y
ejecutar los comandos anteriores utilizando únicamente los archivos entregados.
No se requirieron instrucciones adicionales: con los comandos de la sección Preparación
(`python -m venv .venv`, activación, `python -m pip install -r requirements.txt`) y luego
`python app.py --comprobar` y `python app.py --demo` se reproducen los resultados.
Las evidencias de `evidencias/` se regeneran con `--demo`.
