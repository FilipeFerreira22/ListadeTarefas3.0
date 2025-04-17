document.addEventListener('DOMContentLoaded', () => {
    // Seleção de elementos do DOM
    const tarefaInput = document.getElementById('tarefa');
    const adicionarBtn = document.getElementById('adicionar');
    const listaTarefas = document.getElementById('lista-tarefas');
    const sumarioEl = document.getElementById('sumario');
    const todasBtn = document.getElementById('todas');
    const ativasBtn = document.getElementById('ativas');
    const completasBtn = document.getElementById('completas');
    const pessoalBtn = document.getElementById('pessoal');
    const trabalhoBtn = document.getElementById('trabalho');
    const estudosBtn = document.getElementById('estudos');
    const ordenarDataBtn = document.getElementById('ordenar-data');
    const ordenarTextoBtn = document.getElementById('ordenar-texto');
    const ordenarStatusBtn = document.getElementById('ordenar-status');
    
    // Array para armazenar as tarefas
    let tarefas = [];
    let filtroAtual = 'todas';
    let servidorOnline = false;
    let tentativasReconexao = 0;
    const MAX_TENTATIVAS = 3;
    
    // Verificar se o servidor está online
    async function verificarServidor() {
        try {
            const response = await fetch('http://localhost:3000/api/status');
            if (response.ok) {
                servidorOnline = true;
                console.log('Servidor está online');
                return true;
            } else {
                servidorOnline = false;
                console.error('Servidor retornou erro:', response.status);
                return false;
            }
        } catch (error) {
            servidorOnline = false;
            console.error('Erro ao verificar servidor:', error);
            return false;
        }
    }
    
    // Função para tentar reconectar ao servidor
    async function tentarReconectar() {
        if (tentativasReconexao >= MAX_TENTATIVAS) {
            console.error('Número máximo de tentativas de reconexão atingido');
            return false;
        }
        
        tentativasReconexao++;
        console.log(`Tentativa de reconexão ${tentativasReconexao} de ${MAX_TENTATIVAS}`);
        
        const servidorDisponivel = await verificarServidor();
        if (servidorDisponivel) {
            tentativasReconexao = 0;
            return true;
        }
        
        // Esperar 2 segundos antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
        return tentarReconectar();
    }
    
    // Funções de gerenciamento de tarefas
    async function carregarTarefas() {
        if (!servidorOnline) {
            const servidorDisponivel = await tentarReconectar();
            if (!servidorDisponivel) {
                alert('Não foi possível conectar ao servidor. Verifique se o servidor está em execução.');
                return;
            }
        }
        
        try {
            console.log('Carregando tarefas...');
            const response = await fetch('http://localhost:3000/api/tarefas');
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar tarefas: ${response.status}`);
            }
            
            tarefas = await response.json();
            console.log(`Carregadas ${tarefas.length} tarefas`);
            atualizarLista();
        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            alert('Erro ao carregar tarefas. Por favor, tente novamente.');
        }
    }
    
    async function adicionarTarefa() {
        const texto = tarefaInput.value.trim();
        
        if (texto === '') {
            alert('Por favor, digite uma tarefa!');
            return;
        }
        
        if (!servidorOnline) {
            const servidorDisponivel = await tentarReconectar();
            if (!servidorDisponivel) {
                alert('Não foi possível conectar ao servidor. Verifique se o servidor está em execução.');
                return;
            }
        }
        
        const novaTarefa = {
            texto: texto,
            dataVencimento: document.getElementById('data-vencimento').value,
            categoria: document.getElementById('categoria').value
        };
        
        console.log('Adicionando tarefa:', novaTarefa);
        
        try {
            const response = await fetch('http://localhost:3000/api/tarefas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novaTarefa)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erro ao adicionar tarefa: ${errorData.error || response.status}`);
            }
            
            const tarefaAdicionada = await response.json();
            console.log('Tarefa adicionada com sucesso:', tarefaAdicionada);
            tarefas.push(tarefaAdicionada);
            
            tarefaInput.value = '';
            document.getElementById('data-vencimento').value = '';
            document.getElementById('categoria').value = 'pessoal';
            
            atualizarLista();
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error);
            alert(`Erro ao adicionar tarefa: ${error.message}`);
        }
    }
    
    async function completarTarefa(id) {
        const tarefa = tarefas.find(item => item.id === id);
        
        if (tarefa) {
            try {
                const response = await fetch(`http://localhost:3000/api/tarefas/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ completa: !tarefa.completa })
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao atualizar tarefa');
                }
                
                tarefa.completa = !tarefa.completa;
                atualizarLista();
            } catch (error) {
                console.error('Erro ao completar tarefa:', error);
                alert('Erro ao completar tarefa. Por favor, tente novamente.');
            }
        }
    }
    
    async function removerTarefa(id) {
        if (!confirm('Tem certeza que deseja remover esta tarefa?')) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/tarefas/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao remover tarefa');
            }
            
            tarefas = tarefas.filter(item => item.id !== id);
            atualizarLista();
        } catch (error) {
            console.error('Erro ao remover tarefa:', error);
            alert('Erro ao remover tarefa. Por favor, tente novamente.');
        }
    }
    
    async function editarTarefa(id) {
        const tarefa = tarefas.find(item => item.id === id);
        
        if (tarefa) {
            const novoTexto = prompt('Editar tarefa:', tarefa.texto);
            
            if (novoTexto === null) {
                return; // Usuário cancelou
            }
            
            if (novoTexto.trim() === '') {
                alert('O texto da tarefa não pode estar vazio!');
                return;
            }
            
            try {
                const response = await fetch(`http://localhost:3000/api/tarefas/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ texto: novoTexto.trim() })
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao atualizar tarefa');
                }
                
                tarefa.texto = novoTexto.trim();
                atualizarLista();
            } catch (error) {
                console.error('Erro ao editar tarefa:', error);
                alert('Erro ao editar tarefa. Por favor, tente novamente.');
            }
        }
    }
    
    // Funções de subtarefas
    async function adicionarSubtarefa(tarefaId) {
        const subtarefaInput = document.createElement('div');
        subtarefaInput.className = 'subtarefa-input';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nova subtarefa...';
        
        const botao = document.createElement('button');
        botao.textContent = 'Adicionar';
        botao.onclick = async () => {
            const texto = input.value.trim();
            if (texto) {
                try {
                    const response = await fetch(`http://localhost:3000/api/tarefas/${tarefaId}/subtarefas`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ texto })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Erro ao adicionar subtarefa');
                    }
                    
                    const novaSubtarefa = await response.json();
                    const tarefa = tarefas.find(t => t.id === tarefaId);
                    if (!tarefa.subtarefas) {
                        tarefa.subtarefas = [];
                    }
                    tarefa.subtarefas.push(novaSubtarefa);
                    
                    atualizarLista();
                } catch (error) {
                    console.error('Erro ao adicionar subtarefa:', error);
                    alert('Erro ao adicionar subtarefa. Por favor, tente novamente.');
                }
            }
        };
        
        subtarefaInput.appendChild(input);
        subtarefaInput.appendChild(botao);
        return subtarefaInput;
    }
    
    async function completarSubtarefa(tarefaId, subtarefaId) {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (tarefa && tarefa.subtarefas) {
            const subtarefa = tarefa.subtarefas.find(st => st.id === subtarefaId);
            if (subtarefa) {
                try {
                    const response = await fetch(`http://localhost:3000/api/subtarefas/${subtarefaId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ completa: !subtarefa.completa })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Erro ao atualizar subtarefa');
                    }
                    
                    subtarefa.completa = !subtarefa.completa;
                    
                    // Verificar se todas as subtarefas estão completas
                    tarefa.completa = tarefa.subtarefas.every(st => st.completa);
                    
                    atualizarLista();
                } catch (error) {
                    console.error('Erro ao completar subtarefa:', error);
                    alert('Erro ao completar subtarefa. Por favor, tente novamente.');
                }
            }
        }
    }
    
    async function removerSubtarefa(tarefaId, subtarefaId) {
        if (!confirm('Tem certeza que deseja remover esta subtarefa?')) {
            return;
        }
        
        try {
            const response = await fetch(`http://localhost:3000/api/subtarefas/${subtarefaId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Erro ao remover subtarefa');
            }
            
            const tarefa = tarefas.find(t => t.id === tarefaId);
            if (tarefa && tarefa.subtarefas) {
                tarefa.subtarefas = tarefa.subtarefas.filter(st => st.id !== subtarefaId);
                atualizarLista();
            }
        } catch (error) {
            console.error('Erro ao remover subtarefa:', error);
            alert('Erro ao remover subtarefa. Por favor, tente novamente.');
        }
    }
    
    async function editarSubtarefa(tarefaId, subtarefaId) {
        const tarefa = tarefas.find(t => t.id === tarefaId);
        if (tarefa && tarefa.subtarefas) {
            const subtarefa = tarefa.subtarefas.find(st => st.id === subtarefaId);
            if (subtarefa) {
                const novoTexto = prompt('Editar subtarefa:', subtarefa.texto);
                
                if (novoTexto === null) {
                    return; // Usuário cancelou
                }
                
                if (novoTexto.trim() === '') {
                    alert('O texto da subtarefa não pode estar vazio!');
                    return;
                }
                
                try {
                    const response = await fetch(`http://localhost:3000/api/subtarefas/${subtarefaId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ texto: novoTexto.trim() })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Erro ao atualizar subtarefa');
                    }
                    
                    subtarefa.texto = novoTexto.trim();
                    atualizarLista();
                } catch (error) {
                    console.error('Erro ao editar subtarefa:', error);
                    alert('Erro ao editar subtarefa. Por favor, tente novamente.');
                }
            }
        }
    }
    
    // Funções de ordenação e filtragem
    function mudarFiltro(filtro) {
        filtroAtual = filtro;
        
        // Atualizar classes dos botões
        todasBtn.classList.remove('ativo');
        ativasBtn.classList.remove('ativo');
        completasBtn.classList.remove('ativo');
        pessoalBtn.classList.remove('ativo');
        trabalhoBtn.classList.remove('ativo');
        estudosBtn.classList.remove('ativo');
        
        if (filtro === 'todas') {
            todasBtn.classList.add('ativo');
        } else if (filtro === 'ativas') {
            ativasBtn.classList.add('ativo');
        } else if (filtro === 'completas') {
            completasBtn.classList.add('ativo');
        } else if (filtro === 'pessoal') {
            pessoalBtn.classList.add('ativo');
        } else if (filtro === 'trabalho') {
            trabalhoBtn.classList.add('ativo');
        } else if (filtro === 'estudos') {
            estudosBtn.classList.add('ativo');
        }
        
        atualizarLista();
    }
    
    // Função principal de atualização da lista
    function atualizarLista() {
        listaTarefas.innerHTML = '';
        
        let tarefasFiltradas = tarefas;
        
        if (filtroAtual === 'ativas') {
            tarefasFiltradas = tarefas.filter(tarefa => !tarefa.completa);
        } else if (filtroAtual === 'completas') {
            tarefasFiltradas = tarefas.filter(tarefa => tarefa.completa);
        } else if (filtroAtual === 'pessoal') {
            tarefasFiltradas = tarefas.filter(tarefa => tarefa.categoria === 'pessoal');
        } else if (filtroAtual === 'trabalho') {
            tarefasFiltradas = tarefas.filter(tarefa => tarefa.categoria === 'trabalho');
        } else if (filtroAtual === 'estudos') {
            tarefasFiltradas = tarefas.filter(tarefa => tarefa.categoria === 'estudos');
        }
        
        // Ordenar tarefas
        if (ordenarDataBtn.classList.contains('ativo')) {
            tarefasFiltradas.sort((a, b) => {
                // Tarefas sem data de vencimento vão para o final
                if (!a.dataVencimento) return 1;
                if (!b.dataVencimento) return -1;
                return new Date(a.dataVencimento) - new Date(b.dataVencimento);
            });
        } else if (ordenarTextoBtn.classList.contains('ativo')) {
            tarefasFiltradas.sort((a, b) => a.texto.localeCompare(b.texto));
        } else if (ordenarStatusBtn.classList.contains('ativo')) {
            tarefasFiltradas.sort((a, b) => a.completa - b.completa);
        }
        
        // Criar elementos da lista
        tarefasFiltradas.forEach(tarefa => {
            const li = document.createElement('li');
            if (tarefa.completa) {
                li.classList.add('completa');
            }
            
            li.classList.add(`categoria-${tarefa.categoria}`);
            
            if (tarefa.dataVencimento && new Date(tarefa.dataVencimento) < new Date()) {
                li.classList.add('tarefa-vencida');
            }
            
            // Garantir que a propriedade subtarefas exista
            if (!tarefa.subtarefas) {
                tarefa.subtarefas = [];
            }
            
            li.innerHTML = `
                <div class="tarefa-principal">
                    <span>${tarefa.texto}</span>
                    ${tarefa.dataVencimento ? `<span class="data-vencimento">Vencimento: ${new Date(tarefa.dataVencimento).toLocaleDateString()}</span>` : ''}
                    ${ordenarDataBtn.classList.contains('ativo') ? `<span class="data-criacao">Criada em: ${new Date(tarefa.dataCriacao).toLocaleDateString()}</span>` : ''}
                    <div class="acoes">
                        <button class="editar">Editar</button>
                        <button class="completar">${tarefa.completa ? 'Reativar' : 'Completar'}</button>
                        <button class="remover">Remover</button>
                    </div>
                </div>
            `;
            
            const completarBtn = li.querySelector('.completar');
            const removerBtn = li.querySelector('.remover');
            const editarBtn = li.querySelector('.editar');
            
            completarBtn.addEventListener('click', () => completarTarefa(tarefa.id));
            removerBtn.addEventListener('click', () => removerTarefa(tarefa.id));
            editarBtn.addEventListener('click', () => editarTarefa(tarefa.id));
            
            // Adicionar botão para mostrar/esconder subtarefas
            const toggleSubtarefasBtn = document.createElement('button');
            toggleSubtarefasBtn.textContent = tarefa.subtarefas.length > 0 ? 'Mostrar Subtarefas' : 'Adicionar Subtarefa';
            toggleSubtarefasBtn.className = 'toggle-subtarefas-btn';
            
            // Criar div para subtarefas (inicialmente oculta)
            const subtarefasContainer = document.createElement('div');
            subtarefasContainer.className = 'subtarefas-container';
            subtarefasContainer.style.display = 'none';
            
            // Adicionar subtarefas existentes
            if (tarefa.subtarefas && tarefa.subtarefas.length > 0) {
                const subtarefasDiv = document.createElement('div');
                subtarefasDiv.className = 'subtarefas';
                
                tarefa.subtarefas.forEach(subtarefa => {
                    const subtarefaDiv = document.createElement('div');
                    subtarefaDiv.className = `subtarefa ${subtarefa.completa ? 'completa' : ''}`;
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = subtarefa.completa;
                    checkbox.onchange = () => completarSubtarefa(tarefa.id, subtarefa.id);
                    
                    const span = document.createElement('span');
                    span.textContent = subtarefa.texto;
                    
                    const acoesDiv = document.createElement('div');
                    acoesDiv.className = 'acoes';
                    
                    const editarBtn = document.createElement('button');
                    editarBtn.textContent = 'Editar';
                    editarBtn.className = 'editar';
                    editarBtn.onclick = () => editarSubtarefa(tarefa.id, subtarefa.id);
                    
                    const removerBtn = document.createElement('button');
                    removerBtn.textContent = 'Remover';
                    removerBtn.className = 'remover';
                    removerBtn.onclick = () => removerSubtarefa(tarefa.id, subtarefa.id);
                    
                    acoesDiv.appendChild(editarBtn);
                    acoesDiv.appendChild(removerBtn);
                    
                    subtarefaDiv.appendChild(checkbox);
                    subtarefaDiv.appendChild(span);
                    subtarefaDiv.appendChild(acoesDiv);
                    subtarefasDiv.appendChild(subtarefaDiv);
                });
                
                subtarefasContainer.appendChild(subtarefasDiv);
            }
            
            // Adicionar input para nova subtarefa
            const subtarefaInput = document.createElement('div');
            subtarefaInput.className = 'subtarefa-input';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Nova subtarefa...';
            
            const botao = document.createElement('button');
            botao.textContent = 'Adicionar';
            botao.onclick = async () => {
                const texto = input.value.trim();
                if (texto) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/tarefas/${tarefa.id}/subtarefas`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ texto })
                        });
                        
                        if (!response.ok) {
                            throw new Error('Erro ao adicionar subtarefa');
                        }
                        
                        const novaSubtarefa = await response.json();
                        if (!tarefa.subtarefas) {
                            tarefa.subtarefas = [];
                        }
                        tarefa.subtarefas.push(novaSubtarefa);
                        
                        atualizarLista();
                    } catch (error) {
                        console.error('Erro ao adicionar subtarefa:', error);
                        alert('Erro ao adicionar subtarefa. Por favor, tente novamente.');
                    }
                }
            };
            
            subtarefaInput.appendChild(input);
            subtarefaInput.appendChild(botao);
            subtarefasContainer.appendChild(subtarefaInput);
            
            // Configurar o botão de toggle
            toggleSubtarefasBtn.onclick = () => {
                if (subtarefasContainer.style.display === 'none') {
                    subtarefasContainer.style.display = 'block';
                    toggleSubtarefasBtn.textContent = 'Ocultar Subtarefas';
                } else {
                    subtarefasContainer.style.display = 'none';
                    toggleSubtarefasBtn.textContent = tarefa.subtarefas.length > 0 ? 'Mostrar Subtarefas' : 'Adicionar Subtarefa';
                }
            };
            
            li.appendChild(toggleSubtarefasBtn);
            li.appendChild(subtarefasContainer);
            listaTarefas.appendChild(li);
        });
        
        // Atualizar estatísticas
        const total = tarefas.length;
        const completas = tarefas.filter(t => t.completa).length;
        const pendentes = total - completas;
        
        sumarioEl.textContent = `Total de tarefas: ${total} | Completas: ${completas} | Pendentes: ${pendentes}`;
        atualizarGrafico();
    }
    
    // Função de atualização do gráfico
    function atualizarGrafico() {
        const grafico = document.getElementById('grafico');
        grafico.innerHTML = '';
        
        const total = tarefas.length;
        if (total === 0) {
            grafico.innerHTML = '<div class="sem-dados">Nenhuma tarefa cadastrada</div>';
            return;
        }
        
        const completas = tarefas.filter(t => t.completa).length;
        const pendentes = total - completas;
        
        const barraCompletas = document.createElement('div');
        barraCompletas.className = 'barra';
        barraCompletas.style.height = `${(completas / total) * 100}%`;
        barraCompletas.style.backgroundColor = '#4caf50';
        barraCompletas.title = `Completas: ${completas}`;
        
        const barraPendentes = document.createElement('div');
        barraPendentes.className = 'barra';
        barraPendentes.style.height = `${(pendentes / total) * 100}%`;
        barraPendentes.style.backgroundColor = '#f44336';
        barraPendentes.title = `Pendentes: ${pendentes}`;
        
        grafico.appendChild(barraCompletas);
        grafico.appendChild(barraPendentes);
    }
    
    // Event Listeners
    adicionarBtn.addEventListener('click', adicionarTarefa);
    
    tarefaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            adicionarTarefa();
        }
    });
    
    todasBtn.addEventListener('click', () => mudarFiltro('todas'));
    ativasBtn.addEventListener('click', () => mudarFiltro('ativas'));
    completasBtn.addEventListener('click', () => mudarFiltro('completas'));
    pessoalBtn.addEventListener('click', () => mudarFiltro('pessoal'));
    trabalhoBtn.addEventListener('click', () => mudarFiltro('trabalho'));
    estudosBtn.addEventListener('click', () => mudarFiltro('estudos'));
    
    ordenarDataBtn.addEventListener('click', () => {
        ordenarDataBtn.classList.add('ativo');
        ordenarTextoBtn.classList.remove('ativo');
        ordenarStatusBtn.classList.remove('ativo');
        atualizarLista();
    });
    
    ordenarTextoBtn.addEventListener('click', () => {
        ordenarTextoBtn.classList.add('ativo');
        ordenarDataBtn.classList.remove('ativo');
        ordenarStatusBtn.classList.remove('ativo');
        atualizarLista();
    });
    
    ordenarStatusBtn.addEventListener('click', () => {
        ordenarStatusBtn.classList.add('ativo');
        ordenarDataBtn.classList.remove('ativo');
        ordenarTextoBtn.classList.remove('ativo');
        atualizarLista();
    });
    
    // Verificar conexão com o servidor periodicamente
    setInterval(async () => {
        if (!servidorOnline) {
            await verificarServidor();
        }
    }, 30000); // Verificar a cada 30 segundos
    
    // Inicializar a aplicação
    verificarServidor().then(() => {
        carregarTarefas();
    });
}); 