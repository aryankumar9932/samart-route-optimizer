from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from model import predict_route

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "ML service running"}

@app.post("/predict")
def predict(data: dict):
    return predict_route(data)
