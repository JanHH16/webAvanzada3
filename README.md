# Laboratorio de aplicación inteligente adaptativa

## Identificación

- Integrantes: Jan Houter y Camila Torres
- Curso y sección: OII436-1 Ingeniería Web Avanzada
- URL del repositorio: https://github.com/JanHH16/webAvanzada3
- Fecha: 09-11-2026

## Objetivo y alcance

Complete un recomendador de recursos de aprendizaje que represente los intereses
de cada usuario y actualice su perfil al recibir la interacción **Me interesa**.
El núcleo se implementa en Python y se ejecuta por consola. La interfaz Angular
opcional se describe en la sección "Extensión opcional con Angular".

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

## Catálogo y perfil inicial

### Campos del catálogo y su uso en el cálculo

`datos/recursos.csv` tiene 12 recursos (R01 a R12) y cuatro columnas: `id`, `titulo`, `descripcion` y `etiquetas`. Solo **`etiquetas`** interviene en el cálculo: `construir_indice` la usa para aprender el vocabulario (17 términos) y construir la matriz TF-IDF de 12 filas. `id` identifica y desempata el orden; `titulo` y `descripcion` solo se muestran al usuario.

### Valores vacíos e identificadores repetidos

`cargar_catalogo` valida el CSV antes de calcular y detiene la ejecución con un `ValueError` en estos casos, comprobados con archivos de prueba:

| Caso | Resultado observado |
|---|---|
| Columna `etiquetas` vacía en un recurso | "La columna etiquetas contiene valores vacíos." |
| Identificador repetido (`R01` dos veces) | "Los identificadores de recursos deben ser únicos." |
| Falta una columna obligatoria | "Faltan columnas: descripcion." |

Los espacios sobrantes se eliminan antes de validar. En `perfiles.json`, en cambio, un interés vacío **sí es válido**, porque se usa en la prueba T4.

### Perfiles iniciales

Cada usuario conserva tres cosas por separado: sus intereses iniciales (`perfiles.json`), su vector actual (`estado` en `app.py`, creado con `crear_perfil`) y su historial de interacciones (`historial`). La actualización posterior se hace sobre el vector actual, no sobre el texto inicial. Cada usuario tiene su propio vector, por eso lo que hace u1 no modifica a u2 (prueba T3).

| Usuario | Intereses iniciales | Vector inicial (términos con peso) |
|---|---|---|
| u1 | python datos pandas | pandas 0.753247, datos 0.465091, python 0.465091 |
| u2 | angular componentes interfaces | componentes 0.657512, interfaces 0.564679, angular 0.498813 |
| u3 | (vacío) | vector nulo (17 ceros) |
| u4 | zzxyz123 | vector nulo (17 ceros) |

u3 y u4 no tienen términos reconocidos: `transform` ignora las palabras fuera del vocabulario, por lo que sus puntuaciones son todas 0, `recomendar` devuelve la lista vacía y la aplicación muestra "No hay coincidencias positivas. Declare intereses presentes en el catálogo."

## Recomendación basada en contenido

### Índice y puntuación

El índice se construye una sola vez al iniciar la aplicación: `TfidfVectorizer.fit_transform` sobre la columna `etiquetas` produce una matriz de 12 filas por 17 términos, con cada fila normalizada (norma 1). Los intereses de cada usuario se representan con `transform` sobre ese mismo vectorizador, por lo que perfil y recursos comparten vocabulario y orden de columnas. `calcular_puntuaciones` usa la similitud del coseno entre el vector del perfil y cada fila de la matriz y devuelve 12 valores, en el mismo orden del catálogo. Se verificó contra un cálculo manual del coseno (`(matriz @ perfil) / (norma_recurso * norma_perfil)`) y coinciden.

### Construcción del ranking

`recomendar` ordena por puntuación descendente y, en caso de empate, por `id` ascendente. Solo incluye puntuaciones mayores que 0 y como máximo 3 resultados, sin completar con recursos de puntuación cero. Cada resultado incluye `id`, `titulo`, `puntuacion` y una explicación con los términos compartidos (función suministrada `construir_resultado`). Las puntuaciones se conservan sin redondear durante el cálculo y se muestran con 4 decimales.

Comprobaciones adicionales realizadas:

- Con `top_k=10`, u1 devuelve 7 recursos y u2 devuelve 3: no se agregan ceros.
- Perfil `sql`: R10 y R11 empatan en 0.5423 y salen en el orden R10, R11 (desempate por `id`).
- Perfil `variables`: solo R01 tiene puntuación positiva y la lista tiene un único resultado.

### Ranking inicial (resultados reales)

| Usuario | Puesto | Recurso | Similitud | Términos compartidos |
|---|---|---|---|---|
| u1 | 1 | R02, Análisis de datos con Pandas | 1.0000 | datos, pandas, python |
| u1 | 2 | R12, Conectar Python con datos SQL | 0.4965 | datos, python |
| u1 | 3 | R03, Gráficos con Python | 0.4326 | datos, python |
| u2 | 1 | R07, Componentes e interfaces en Angular | 1.0000 | angular, componentes, interfaces |
| u2 | 2 | R08, Formularios e interfaces en Angular | 0.5677 | angular, interfaces |
| u2 | 3 | R09, Consumir una API desde Angular | 0.3087 | angular |

Las puntuaciones no son probabilidades: R02 obtiene 1.0000 porque sus etiquetas coinciden exactamente con los intereses de u1, no porque exista una certeza de que le interese. u2 solo tiene 3 recursos con puntuación positiva (los 9 restantes tienen 0), por eso no aparece ningún otro.

## Retroalimentación y adaptación

### Regla de actualización

`actualizar_perfil` calcula `mezcla = 0.4 * vector_actual + 0.6 * vector_recurso` y la normaliza a norma L2 unitaria con `normalize`. Se verificó contra el cálculo manual y la norma resultante es 1.0, también después de una segunda actualización sucesiva. Los pesos 0.4 y 0.6 son parámetros didácticos, no valores óptimos obtenidos de un experimento.

### Secuencia con u1

1. Consulta inicial de u1: R02 (1.0000), R12 (0.4965), R03 (0.4326).
2. u1 indica **Me interesa** sobre R04 (`API web con Python`), que no estaba entre sus tres recomendaciones iniciales.
3. `registrar_interes` guarda el evento solo en el historial de u1 y actualiza solo su vector.
4. Nueva consulta: R04 (0.8752), R02 (0.6880), R09 (0.4958).

### Puntuaciones de los 12 candidatos antes y después

Se conservan los mismos 12 recursos. Los valores completos están en `evidencias/puntuaciones_antes_despues.csv`. Recursos distintos de R04:

| Recurso | Antes | Después | Cambio |
|---|---|---|---|
| R05 (web api http) | 0.0000 | 0.4378 | +0.4378 |
| R06 (web api validacion) | 0.0000 | 0.4378 | +0.4378 |
| R09 (angular web api) | 0.0000 | 0.4958 | +0.4958 |
| R02 (python datos pandas) | 1.0000 | 0.6880 | -0.3120 |
| R10 y R11 (sql datos ...) | 0.2053 | 0.1026 | -0.1027 |

El perfil incorporó `web` y `api` (0.446269 cada uno) y reforzó `python` (0.637116), características de R04. Por eso suben los recursos que comparten `web` y `api` (R05, R06, R09) aunque el usuario no los valoró, y bajan los que dependían de `datos`. Es evidencia de adaptación porque se relaciona el evento con un vector de perfil modificado y con puntuaciones recalculadas.

### Comprobaciones adicionales

- Un identificador desconocido (`R99`) muestra "No existe el recurso R99." y deja perfil e historial sin cambios.
- El evento queda solo en el historial de u1; u2, u3 y u4 permanecen sin cambios (prueba T3).
- Un perfil vacío (u3) pasa a tener términos tras valorar R05 (`http 0.7203, api 0.4905, web 0.4905`) y empieza a recibir recomendaciones.

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

### Historial y perfiles de u1 (evento Me interesa sobre R04)

- Historial de u1 antes: sin interacciones.
- Historial de u1 después: `[{"numero": 1, "accion": "Me interesa", "recurso": "R04"}]`
- Perfil anterior: `{pandas: 0.753247, datos: 0.465091, python: 0.465091}`
- Perfil actualizado: `{python: 0.637116, api: 0.446269, web: 0.446269, pandas: 0.376477, datos: 0.232455}`
- Historiales de u2, u3 y u4: vacíos al terminar la demo.

### Puntuaciones de los 12 recursos antes y después (u1, valorando R04)

| id | Título | Puntuación antes | Puntuación después | Diferencia |
|---|---|---|---|---|
| R01 | Fundamentos de Python | 0.1861 | 0.2549 | +0.0688 |
| R02 | Análisis de datos con Pandas | 1.0000 | 0.6880 | -0.3120 |
| R03 | Gráficos con Python | 0.4326 | 0.4044 | -0.0282 |
| R04 | API web con Python (valorado) | 0.2510 | 0.8752 | +0.6241 |
| R05 | Principios de una API HTTP | 0.0000 | 0.4378 | +0.4378 |
| R06 | Validación de datos en una API | 0.0000 | 0.4378 | +0.4378 |
| R07 | Componentes e interfaces en Angular | 0.0000 | 0.0000 | +0.0000 |
| R08 | Formularios e interfaces en Angular | 0.0000 | 0.0000 | +0.0000 |
| R09 | Consumir una API desde Angular | 0.0000 | 0.4958 | +0.4958 |
| R10 | Consultas SQL sobre datos | 0.2053 | 0.1026 | -0.1027 |
| R11 | Tablas de datos en SQL | 0.2053 | 0.1026 | -0.1027 |
| R12 | Conectar Python con datos SQL | 0.4965 | 0.4642 | -0.0324 |

Recurso destacado no valorado: **R05** (0.0000 → 0.4378). Comparte con R04 los términos `web` y `api`, que el perfil de u1 incorporó tras la interacción. Los recursos sin ninguno de esos términos o de los de u1 (R07, R08) permanecen en 0.

### u2 antes y después de la interacción de u1

| | Antes | Después |
|---|---|---|
| Perfil | componentes 0.657512, interfaces 0.564679, angular 0.498813 | idéntico |
| Historial | vacío | vacío |
| Ranking | R07 (1.0000), R08 (0.5677), R09 (0.3087) | R07 (1.0000), R08 (0.5677), R09 (0.3087) |

### u3 y u4 (sin términos reconocidos)

- u3 (intereses vacíos): vector nulo, puntuaciones todas 0, lista vacía.
- u4 (`zzxyz123`): vector nulo, puntuaciones todas 0, lista vacía.
- Mensaje mostrado para ambos: "No hay coincidencias positivas. Declare intereses presentes en el catálogo."
- La aplicación no falló ni atribuyó relevancia a recursos con puntuación cero.

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

## Extensión opcional con Angular

La extensión no es necesaria para el núcleo de 60 puntos. Una API Flask (`api.py`) expone el motor y una pantalla Angular (`frontend/`) consume esa API. La API no duplica lógica: reutiliza `cargar_datos`, `crear_estado`, `crear_historial` y `registrar_interes` de `app.py` y `recomendar` y `describir_perfil` de `motor.py`. El estado vive en memoria, igual que en la consola: al reiniciar la API se recuperan los perfiles iniciales.

### Contrato de la API

| Método y ruta | Función |
|---|---|
| `GET /usuarios` | Lista los usuarios de demostración (`id`, `nombre`). |
| `GET /recursos` | Lista los 12 recursos (`id`, `titulo`, `descripcion`, `etiquetas`). |
| `GET /usuarios/{id}/recomendaciones` | Devuelve `perfil`, `historial`, hasta tres `recomendaciones` y `mensaje` (solo si el perfil no tiene términos). |
| `POST /usuarios/{id}/interacciones` | Cuerpo `{"recurso_id": "R04"}`. Aplica **Me interesa**, devuelve lo mismo que la ruta anterior más `perfil_anterior`, `recurso_valorado` y `cambios` (puntuación antes y después de los 12 recursos). |

Errores: `404` con `{"error": "No existe el usuario u9."}` o `{"error": "No existe el recurso R99."}` (el estado no cambia) y `400` si el cuerpo no tiene un `recurso_id` de texto.

### Ejecución

La API necesita Flask, que no forma parte del núcleo (`requirements-api.txt` incluye `requirements.txt` más Flask). En una terminal, con el entorno virtual activado:

```bash
python -m pip install -r requirements-api.txt
python api.py
```

En otra terminal (requiere Node.js y npm):

```bash
cd frontend
npm install
npm start
```

Abra `http://localhost:4200`. El servidor de desarrollo de Angular reenvía `/api/*` a `http://127.0.0.1:5000` (`frontend/proxy.conf.json`), por lo que no se necesita CORS.

### Interfaz y verificación

Una sola pantalla titulada "Recomendador de recursos de aprendizaje", con tres pasos: (1) selector de usuario y su perfil actual; (2) las tres recomendaciones con su similitud y los términos compartidos; (3) selector del catálogo completo con la descripción del recurso elegido y el botón **Me interesa**. Tras valorar, la vista se desplaza a un bloque "Efecto de la valoración" con el perfil antes y después, la tabla de puntuaciones de los mismos 12 recursos (antes, después y cambio, con el recurso valorado resaltado) y el historial del usuario. Se probó de extremo a extremo con la API y Angular en ejecución:

- u1 muestra R02, R12 y R03. Al valorar R04 desde el catálogo completo, el perfil pasa a `python 0.637116, api 0.446269, web 0.446269, pandas 0.376477, datos 0.232455` y las recomendaciones a R04 (0.8752), R02 (0.6880) y R09 (0.4958), los mismos valores de la demo de consola.
- u2 conserva su perfil y ranking tras la interacción de u1.
- u3 muestra "Vector nulo: sin términos reconocidos" y el mensaje "No hay coincidencias positivas. Declare intereses presentes en el catálogo."
- Un identificador desconocido en la API devuelve 404 y no modifica ni el perfil ni el historial.

## Archivos de la entrega

Entregue `app.py`, `motor.py`, `datos/recursos.csv`, `datos/perfiles.json`,
`requirements.txt`, `.gitignore`, este README completado y los dos archivos de
`evidencias/`. No incluya `.venv`, `__pycache__` ni dependencias instaladas.
La extensión opcional añade `api.py`, `requirements-api.txt` y la carpeta `frontend/`
(sin `node_modules` ni `dist`).

### Reproducción desde una copia nueva

Compruebe que otra persona puede crear el entorno, instalar las dependencias y
ejecutar los comandos anteriores utilizando únicamente los archivos entregados.
No se requirieron instrucciones adicionales: con los comandos de la sección Preparación
(`python -m venv .venv`, activación, `python -m pip install -r requirements.txt`) y luego
`python app.py --comprobar` y `python app.py --demo` se reproducen los resultados.
Las evidencias de `evidencias/` se regeneran con `--demo`.
