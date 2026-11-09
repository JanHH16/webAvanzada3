"""API HTTP de la extensión opcional con Angular (sección 6 del enunciado).

Toda la lógica (similitudes, actualización del perfil, historial) sigue en
motor.py y app.py; esta capa solo valida identificadores y traduce a JSON.
El estado vive en memoria: al reiniciar la API se recuperan los perfiles iniciales.

    python api.py          # http://127.0.0.1:5000
"""

from __future__ import annotations

from flask import Flask, jsonify, request

import app as consola
import motor

recursos, usuarios, vectorizador, matriz = consola.cargar_datos()
estado = consola.crear_estado(usuarios, vectorizador)
historial = consola.crear_historial(usuarios)

api = Flask(__name__)
api.json.ensure_ascii = False
api.json.sort_keys = False


def error(mensaje: str, codigo: int):
    return jsonify({"error": mensaje}), codigo


def existe_usuario(usuario_id: str) -> bool:
    return usuario_id in usuarios


def respuesta_usuario(usuario_id: str, **extra):
    """Perfil, historial y hasta tres recomendaciones del usuario indicado."""
    return jsonify({
        "usuario": usuario_id,
        "nombre": usuarios[usuario_id]["nombre"],
        "perfil": motor.describir_perfil(estado[usuario_id], vectorizador),
        "historial": historial[usuario_id],
        "recomendaciones": motor.recomendar(
            estado[usuario_id], recursos, matriz, vectorizador
        ),
        "mensaje": None if estado[usuario_id].any() else consola.SIN_COINCIDENCIAS,
        **extra,
    })


@api.get("/usuarios")
def listar_usuarios():
    return jsonify([
        {"id": usuario_id, "nombre": datos["nombre"]}
        for usuario_id, datos in usuarios.items()
    ])


@api.get("/recursos")
def listar_recursos():
    return jsonify(recursos[["id", "titulo", "descripcion", "etiquetas"]].to_dict("records"))


@api.get("/usuarios/<usuario_id>/recomendaciones")
def recomendaciones(usuario_id: str):
    if not existe_usuario(usuario_id):
        return error(f"No existe el usuario {usuario_id}.", 404)
    return respuesta_usuario(usuario_id)


@api.post("/usuarios/<usuario_id>/interacciones")
def interaccion(usuario_id: str):
    if not existe_usuario(usuario_id):
        return error(f"No existe el usuario {usuario_id}.", 404)
    cuerpo = request.get_json(silent=True)
    recurso_id = cuerpo.get("recurso_id") if isinstance(cuerpo, dict) else None
    if not isinstance(recurso_id, str) or not recurso_id.strip():
        return error('El cuerpo debe ser {"recurso_id": "R04"}.', 400)
    try:
        anterior, nuevo = consola.registrar_interes(
            estado, usuario_id, recurso_id.strip().upper(), recursos, matriz, historial
        )
    except ValueError as fallo:
        return error(str(fallo), 404)
    antes = motor.calcular_puntuaciones(anterior, matriz)
    despues = motor.calcular_puntuaciones(estado[usuario_id], matriz)
    # Los mismos 12 candidatos antes y después, para mostrar el efecto de la interacción.
    cambios = [
        {
            "id": str(recurso.id),
            "titulo": str(recurso.titulo),
            "antes": float(antes[i]),
            "despues": float(despues[i]),
        }
        for i, recurso in enumerate(recursos.itertuples(index=False))
    ]
    return respuesta_usuario(
        usuario_id,
        perfil_anterior=motor.describir_perfil(anterior, vectorizador),
        recurso_valorado=recurso_id.strip().upper(),
        cambios=cambios,
    )


if __name__ == "__main__":
    api.run(host="127.0.0.1", port=5000)
