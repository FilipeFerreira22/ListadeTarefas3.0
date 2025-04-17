const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

// Verificar se o arquivo do banco de dados existe
if (fs.existsSync('tarefas.db')) {
    console.log('Arquivo do banco de dados encontrado.');
} else {
    console.log('Arquivo do banco de dados não encontrado. Será criado um novo banco.');
}

// Conectar ao banco de dados
const db = new sqlite3.Database('tarefas.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        verificarTabelas();
    }
});

// Verificar e criar tabelas se necessário
function verificarTabelas() {
    // Verificar tabela de tarefas
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='tarefas'", (err, row) => {
        if (err) {
            console.error('Erro ao verificar tabela tarefas:', err);
            return;
        }
        
        if (!row) {
            console.log('Tabela tarefas não encontrada. Criando...');
            criarTabelaTarefas();
        } else {
            console.log('Tabela tarefas encontrada.');
            verificarColunasTarefas();
        }
    });
    
    // Verificar tabela de subtarefas
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='subtarefas'", (err, row) => {
        if (err) {
            console.error('Erro ao verificar tabela subtarefas:', err);
            return;
        }
        
        if (!row) {
            console.log('Tabela subtarefas não encontrada. Criando...');
            criarTabelaSubtarefas();
        } else {
            console.log('Tabela subtarefas encontrada.');
            verificarColunasSubtarefas();
        }
    });
}

// Criar tabela de tarefas
function criarTabelaTarefas() {
    db.run(`
        CREATE TABLE IF NOT EXISTS tarefas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT NOT NULL,
            completa BOOLEAN DEFAULT 0,
            dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            dataVencimento DATETIME,
            categoria TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela tarefas:', err);
        } else {
            console.log('Tabela tarefas criada com sucesso.');
        }
    });
}

// Criar tabela de subtarefas
function criarTabelaSubtarefas() {
    db.run(`
        CREATE TABLE IF NOT EXISTS subtarefas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tarefaId INTEGER,
            texto TEXT NOT NULL,
            completa BOOLEAN DEFAULT 0,
            FOREIGN KEY (tarefaId) REFERENCES tarefas (id)
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela subtarefas:', err);
        } else {
            console.log('Tabela subtarefas criada com sucesso.');
        }
    });
}

// Verificar colunas da tabela de tarefas
function verificarColunasTarefas() {
    db.all("PRAGMA table_info(tarefas)", (err, rows) => {
        if (err) {
            console.error('Erro ao verificar colunas da tabela tarefas:', err);
            return;
        }
        
        console.log('Colunas da tabela tarefas:');
        rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });
    });
}

// Verificar colunas da tabela de subtarefas
function verificarColunasSubtarefas() {
    db.all("PRAGMA table_info(subtarefas)", (err, rows) => {
        if (err) {
            console.error('Erro ao verificar colunas da tabela subtarefas:', err);
            return;
        }
        
        console.log('Colunas da tabela subtarefas:');
        rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });
    });
}

// Verificar integridade do banco de dados
db.get("PRAGMA integrity_check", (err, row) => {
    if (err) {
        console.error('Erro ao verificar integridade do banco de dados:', err);
    } else {
        console.log('Verificação de integridade:', row.integrity_check);
    }
    
    // Fechar a conexão com o banco de dados
    db.close((err) => {
        if (err) {
            console.error('Erro ao fechar conexão com o banco de dados:', err);
        } else {
            console.log('Conexão com o banco de dados fechada.');
        }
    });
}); 