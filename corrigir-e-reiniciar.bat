@echo off
echo Parando servidor anterior (se estiver em execucao)...
taskkill /F /IM node.exe >nul 2>&1

echo Verificando banco de dados...
node verificar-banco.js

echo Iniciando servidor...
start "Lista de Tarefas" cmd /c "npm start"

echo Servidor iniciado! Abra o arquivo index.html no seu navegador. 