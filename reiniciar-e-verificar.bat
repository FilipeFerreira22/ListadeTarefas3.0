@echo off
echo Parando servidor anterior (se estiver em execucao)...
taskkill /F /IM node.exe >nul 2>&1

echo Verificando banco de dados...
node verificar-banco.js

echo Iniciando servidor...
start "Lista de Tarefas" cmd /c "npm start"

echo Aguardando servidor iniciar...
timeout /t 5 /nobreak

echo Verificando status do servidor...
node verificar-servidor.js

echo.
echo Se o servidor estiver funcionando, abra o arquivo index.html no seu navegador.
echo Se houver algum erro, verifique as mensagens acima. 