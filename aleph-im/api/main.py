from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api import router

app = FastAPI()
app.include_router(router, prefix="/api")


@app.get("/")
async def index():
    return FileResponse("/opt/code/static/index.html")


@app.exception_handler(404)
async def exception_404_handler():
    return FileResponse("/opt/code/static/404.html")


app.mount("/", StaticFiles(directory="/opt/code/static", html=True))
