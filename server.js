const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();

// Configuração do CORS
app.use(cors());
app.use(express.json());

// Configuração de segurança básica
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '.')));

// Conexão com o banco de dados
const db = new sqlite3.Database('tarefas.db', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        process.exit(1);
    } else {
        console.log('Conectado ao banco de dados SQLite');
        criarTabelas();
    }
});

// Criar tabelas
function criarTabelas() {
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
            console.log('Tabela tarefas criada ou já existente');
        }
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS subtarefas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tarefaId INTEGER,
            texto TEXT NOT NULL,
            completa BOOLEAN DEFAULT 0,
            FOREIGN KEY (tarefaId) REFERENCES tarefas (id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar tabela subtarefas:', err);
        } else {
            console.log('Tabela subtarefas criada ou já existente');
        }
    });
}

// Middleware para verificar se o banco de dados está conectado
const verificarBanco = (req, res, next) => {
    if (!db) {
        return res.status(500).json({ error: 'Banco de dados não está disponível' });
    }
    next();
};

// Rotas para tarefas
app.get('/api/tarefas', verificarBanco, (req, res) => {
    console.log('Buscando todas as tarefas');
    db.all('SELECT * FROM tarefas', [], (err, tarefas) => {
        if (err) {
            console.error('Erro ao buscar tarefas:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        
        console.log(`Encontradas ${tarefas.length} tarefas`);
        
        // Buscar subtarefas para cada tarefa
        const tarefasComSubtarefas = tarefas.map(tarefa => {
            return new Promise((resolve) => {
                db.all('SELECT * FROM subtarefas WHERE tarefaId = ?', [tarefa.id], (err, subtarefas) => {
                    if (err) {
                        console.error(`Erro ao buscar subtarefas para tarefa ${tarefa.id}:`, err);
                        resolve({ ...tarefa, subtarefas: [] });
                        return;
                    }
                    console.log(`Encontradas ${subtarefas.length} subtarefas para tarefa ${tarefa.id}`);
                    resolve({ ...tarefa, subtarefas });
                });
            });
        });

        Promise.all(tarefasComSubtarefas).then(resultado => {
            res.json(resultado);
        });
    });
});

app.post('/api/tarefas', verificarBanco, (req, res) => {
    const { texto, dataVencimento, categoria } = req.body;
    console.log('Adicionando nova tarefa:', { texto, dataVencimento, categoria });
    
    if (!texto) {
        console.error('Erro: texto da tarefa não fornecido');
        return res.status(400).json({ error: 'O texto da tarefa é obrigatório' });
    }
    
    // Sanitização de entrada
    const textoSanitizado = texto.trim().substring(0, 500); // Limitar tamanho
    
    db.run(
        'INSERT INTO tarefas (texto, dataVencimento, categoria) VALUES (?, ?, ?)',
        [textoSanitizado, dataVencimento, categoria],
        function(err) {
            if (err) {
                console.error('Erro ao adicionar tarefa:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            
            console.log(`Tarefa adicionada com ID: ${this.lastID}`);
            
            const novaTarefa = {
                id: this.lastID,
                texto: textoSanitizado,
                completa: false,
                dataCriacao: new Date(),
                dataVencimento,
                categoria,
                subtarefas: []
            };
            
            res.status(201).json(novaTarefa);
        }
    );
});

app.put('/api/tarefas/:id', verificarBanco, (req, res) => {
    const { id } = req.params;
    const { completa, texto, dataVencimento, categoria } = req.body;
    
    // Verificar se a tarefa existe
    db.get('SELECT * FROM tarefas WHERE id = ?', [id], (err, tarefa) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!tarefa) {
            res.status(404).json({ error: 'Tarefa não encontrada' });
            return;
        }
        
        // Atualizar a tarefa
        const camposAtualizados = [];
        const valores = [];
        
        if (completa !== undefined) {
            camposAtualizados.push('completa = ?');
            valores.push(completa ? 1 : 0);
        }
        
        if (texto !== undefined) {
            camposAtualizados.push('texto = ?');
            valores.push(texto.trim().substring(0, 500));
        }
        
        if (dataVencimento !== undefined) {
            camposAtualizados.push('dataVencimento = ?');
            valores.push(dataVencimento);
        }
        
        if (categoria !== undefined) {
            camposAtualizados.push('categoria = ?');
            valores.push(categoria);
        }
        
        if (camposAtualizados.length === 0) {
            res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido' });
            return;
        }
        
        valores.push(id);
        
        db.run(
            `UPDATE tarefas SET ${camposAtualizados.join(', ')} WHERE id = ?`,
            valores,
            (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ message: 'Tarefa atualizada com sucesso' });
            }
        );
    });
});

app.delete('/api/tarefas/:id', verificarBanco, (req, res) => {
    const { id } = req.params;
    
    // Verificar se a tarefa existe
    db.get('SELECT * FROM tarefas WHERE id = ?', [id], (err, tarefa) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!tarefa) {
            res.status(404).json({ error: 'Tarefa não encontrada' });
            return;
        }
        
        // Excluir a tarefa (as subtarefas serão excluídas automaticamente devido à chave estrangeira com ON DELETE CASCADE)
        db.run('DELETE FROM tarefas WHERE id = ?', [id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Tarefa removida com sucesso' });
        });
    });
});

// Rotas para subtarefas
app.post('/api/tarefas/:tarefaId/subtarefas', verificarBanco, (req, res) => {
    const { tarefaId } = req.params;
    const { texto } = req.body;
    
    // Verificar se a tarefa existe
    db.get('SELECT * FROM tarefas WHERE id = ?', [tarefaId], (err, tarefa) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!tarefa) {
            res.status(404).json({ error: 'Tarefa não encontrada' });
            return;
        }
        
        if (!texto) {
            res.status(400).json({ error: 'O texto da subtarefa é obrigatório' });
            return;
        }
        
        // Sanitização de entrada
        const textoSanitizado = texto.trim().substring(0, 300); // Limitar tamanho
        
        db.run(
            'INSERT INTO subtarefas (tarefaId, texto) VALUES (?, ?)',
            [tarefaId, textoSanitizado],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                const novaSubtarefa = {
                    id: this.lastID,
                    tarefaId,
                    texto: textoSanitizado,
                    completa: false
                };
                
                res.status(201).json(novaSubtarefa);
            }
        );
    });
});

app.put('/api/subtarefas/:id', verificarBanco, (req, res) => {
    const { id } = req.params;
    const { completa, texto } = req.body;
    
    // Primeiro, obter a subtarefa para saber a qual tarefa ela pertence
    db.get('SELECT * FROM subtarefas WHERE id = ?', [id], (err, subtarefa) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!subtarefa) {
            res.status(404).json({ error: 'Subtarefa não encontrada' });
            return;
        }
        
        const tarefaId = subtarefa.tarefaId;
        
        // Atualizar o status da subtarefa
        const camposAtualizados = [];
        const valores = [];
        
        if (completa !== undefined) {
            camposAtualizados.push('completa = ?');
            valores.push(completa ? 1 : 0);
        }
        
        if (texto !== undefined) {
            camposAtualizados.push('texto = ?');
            valores.push(texto.trim().substring(0, 300));
        }
        
        if (camposAtualizados.length === 0) {
            res.status(400).json({ error: 'Nenhum campo para atualizar foi fornecido' });
            return;
        }
        
        valores.push(id);
        
        db.run(
            `UPDATE subtarefas SET ${camposAtualizados.join(', ')} WHERE id = ?`,
            valores,
            (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // Verificar se todas as subtarefas da tarefa principal estão completas
                db.all('SELECT completa FROM subtarefas WHERE tarefaId = ?', [tarefaId], (err, subtarefas) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    
                    // Se não houver subtarefas, não precisa atualizar a tarefa principal
                    if (subtarefas.length === 0) {
                        res.json({ message: 'Subtarefa atualizada com sucesso' });
                        return;
                    }
                    
                    // Verificar se todas as subtarefas estão completas
                    const todasCompletas = subtarefas.every(st => st.completa === 1);
                    
                    // Atualizar o status da tarefa principal
                    db.run(
                        'UPDATE tarefas SET completa = ? WHERE id = ?',
                        [todasCompletas ? 1 : 0, tarefaId],
                        (err) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            res.json({ message: 'Subtarefa atualizada com sucesso' });
                        }
                    );
                });
            }
        );
    });
});

app.delete('/api/subtarefas/:id', verificarBanco, (req, res) => {
    const { id } = req.params;
    
    // Verificar se a subtarefa existe
    db.get('SELECT * FROM subtarefas WHERE id = ?', [id], (err, subtarefa) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (!subtarefa) {
            res.status(404).json({ error: 'Subtarefa não encontrada' });
            return;
        }
        
        const tarefaId = subtarefa.tarefaId;
        
        db.run('DELETE FROM subtarefas WHERE id = ?', [id], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            // Verificar se todas as subtarefas da tarefa principal estão completas
            db.all('SELECT completa FROM subtarefas WHERE tarefaId = ?', [tarefaId], (err, subtarefas) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                // Se não houver subtarefas, marcar a tarefa como não completa
                if (subtarefas.length === 0) {
                    db.run(
                        'UPDATE tarefas SET completa = 0 WHERE id = ?',
                        [tarefaId],
                        (err) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }
                            res.json({ message: 'Subtarefa removida com sucesso' });
                        }
                    );
                    return;
                }
                
                // Verificar se todas as subtarefas estão completas
                const todasCompletas = subtarefas.every(st => st.completa === 1);
                
                // Atualizar o status da tarefa principal
                db.run(
                    'UPDATE tarefas SET completa = ? WHERE id = ?',
                    [todasCompletas ? 1 : 0, tarefaId],
                    (err) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }
                        res.json({ message: 'Subtarefa removida com sucesso' });
                    }
                );
            });
        });
    });
});

// Rota para verificar o status do servidor
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota para lidar com caminhos não encontrados
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 