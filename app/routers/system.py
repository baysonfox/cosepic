from fastapi import APIRouter, BackgroundTasks, HTTPException
from app.services.scanner import ScannerService

router = APIRouter(prefix="/api", tags=["System"])

async def run_scan_task():
    scanner = ScannerService()
    await scanner.scan()

@router.post("/scan")
async def trigger_scan(background_tasks: BackgroundTasks):
    """
    Trigger a background scan of the gallery root directory.
    """
    background_tasks.add_task(run_scan_task)
    return {"status": "accepted", "message": "Scan started in background"}
