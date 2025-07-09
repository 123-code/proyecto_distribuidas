from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

class ContenidoRequest(BaseModel):
    tema: str

@app.post("/generar-contenido")
async def generar_contenido(request: ContenidoRequest):
    generator = pipeline('text-generation', model='gpt2')
    texto = generator(f"Crear un ejercicio sobre {request.tema}", max_length=100)[0]['generated_text']
    return {"contenido": texto} 