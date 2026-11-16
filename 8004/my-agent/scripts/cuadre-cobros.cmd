@echo off
rem Cuadre diario de cobros de entropiav2: cadena contra lineas COBRO.
rem Lo lanza la tarea programada "Cuadre cobros entropia" a las 10:00.
setlocal
cd /d "C:\Users\petra\videodanza-nft\8004\my-agent"
"C:\Program Files\nodejs\node.exe" scripts\cuadre-cobros.mjs --dias 2 --append >> "C:\Users\petra\agentex\documentos\entropia\cuadre-salida.log" 2>&1
endlocal
