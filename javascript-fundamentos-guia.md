# Guia de Fundamentos de JavaScript 

## Roteiro de Aprendizagem com o Projeto Lista de Tarefas

Este guia explica os fundamentos de JavaScript utilizando o projeto prático de Lista de Tarefas como exemplo. Cada conceito é explicado e depois mostrado como é aplicado no projeto.

## 1. Variáveis e Tipos de Dados

### Conceito
JavaScript possui diferentes tipos de variáveis:
- `var`: escopo de função (menos usado atualmente)
- `let`: variáveis que podem ser reatribuídas
- `const`: variáveis que não podem ser reatribuídas

Tipos de dados básicos:
- Strings: texto (`"Olá"`, `'Mundo'`)
- Números: inteiros e decimais (`10`, `3.14`)
- Booleanos: `true` ou `false`
- Arrays: coleções ordenadas (`[1, 2, 3]`)
- Objetos: coleções de propriedades (`{nome: "João", idade: 25}`)

### Aplicação no Projeto
```javascript
// Variáveis usando const (não mudam de referência)
const tarefaInput = document.getElementById('tarefa');
const adicionarBtn = document.getElementById('adicionar');

// Variáveis usando let (podem mudar de valor)
let tarefas = [];
let filtroAtual = 'todas';

// Objeto representando uma tarefa
const tarefa = {
    id: Date.now(),
    texto: texto,
    completa: false,
    dataCriacao: new Date()
};

// Array de tarefas
tarefas.push(tarefa);
```

## 2. Seleção de Elementos DOM

### Conceito
O DOM (Document Object Model) é a representação em memória da estrutura HTML. JavaScript permite selecionar e manipular esses elementos.

Métodos comuns:
- `document.getElementById()`: seleciona pelo atributo id
- `document.querySelector()`: seleciona pelo seletor CSS
- `document.querySelectorAll()`: seleciona todos os elementos que correspondem ao seletor

### Aplicação no Projeto
```javascript
// Selecionar elementos por ID
const tarefaInput = document.getElementById('tarefa');
const adicionarBtn = document.getElementById('adicionar');
const listaTarefas = document.getElementById('lista-tarefas');

// Selecionar elementos dentro de outro elemento
const completarBtn = li.querySelector('.completar');
const removerBtn = li.querySelector('.remover');
```

## 3. Funções

### Conceito
Funções são blocos de código reutilizáveis que executam tarefas específicas. Podem receber parâmetros e retornar valores.

Sintaxes:
- Função tradicional: `function nome(parametros) { }`
- Arrow function: `const nome = (parametros) => { }`

### Aplicação no Projeto
```javascript
// Função tradicional
function adicionarTarefa() {
    const texto = tarefaInput.value.trim();
    
    if (texto === '') {
        alert('Por favor, digite uma tarefa!');
        return;
    }
    
    // Resto do código...
}

// Função com parâmetro
function completarTarefa(id) {
    // Encontrar a tarefa no array
    const tarefa = tarefas.find(item => item.id === id);
    
    if (tarefa) {
        tarefa.completa = !tarefa.completa;
        atualizarLista();
        salvarTarefas();
    }
}

// Arrow function em um event listener
completarBtn.addEventListener('click', () => completarTarefa(tarefa.id));
```

## 4. Manipulação do DOM

### Conceito
JavaScript pode criar, modificar e remover elementos HTML dinamicamente.

Métodos comuns:
- `createElement()`: cria um novo elemento
- `appendChild()`: adiciona um elemento como filho de outro
- `innerHTML`: define ou obtém o conteúdo HTML de um elemento
- `classList`: manipula as classes CSS de um elemento

### Aplicação no Projeto
```javascript
// Criar um novo elemento
const li = document.createElement('li');

// Adicionar uma classe CSS
if (tarefa.completa) {
    li.classList.add('completa');
}

// Definir o conteúdo HTML
li.innerHTML = `
    <span>${tarefa.texto}</span>
    <div class="acoes">
        <button class="completar">${tarefa.completa ? 'Reativar' : 'Completar'}</button>
        <button class="remover">Remover</button>
    </div>
`;

// Adicionar o elemento à lista
listaTarefas.appendChild(li);

// Limpar o conteúdo de um elemento
listaTarefas.innerHTML = '';
```

## 5. Event Listeners

### Conceito
Event listeners permitem que o JavaScript responda a ações do usuário, como cliques, digitação e movimentos do mouse.

Sintaxe: `elemento.addEventListener(evento, função)`

### Aplicação no Projeto
```javascript
// Event listener para clique em botão
adicionarBtn.addEventListener('click', adicionarTarefa);

// Event listener para tecla pressionada
tarefaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        adicionarTarefa();
    }
});

// Event listeners nos botões de cada tarefa
completarBtn.addEventListener('click', () => completarTarefa(tarefa.id));
removerBtn.addEventListener('click', () => removerTarefa(tarefa.id));
```

## 6. Arrays e Métodos de Array

### Conceito
Arrays são coleções ordenadas de dados. JavaScript oferece diversos métodos para manipulá-los.

Métodos comuns:
- `push()`: adiciona um item ao final
- `filter()`: cria um novo array com os elementos que passam no teste
- `find()`: retorna o primeiro elemento que passa no teste
- `forEach()`: executa uma função para cada elemento

### Aplicação no Projeto
```javascript
// Adicionar item ao array
tarefas.push(tarefa);

// Filtrar array (usado para remover uma tarefa)
tarefas = tarefas.filter(item => item.id !== id);

// Encontrar um item no array
const tarefa = tarefas.find(item => item.id === id);

// Filtrar por uma condição
let tarefasFiltradas = tarefas.filter(tarefa => !tarefa.completa);

// Percorrer todos os itens do array
tarefasFiltradas.forEach(tarefa => {
    // Criar elemento para cada tarefa
});

// Contar itens que atendem a uma condição
const completas = tarefas.filter(tarefa => tarefa.completa).length;
```

## 7. Condicionais

### Conceito
Condicionais permitem executar diferentes blocos de código com base em condições.

Tipos:
- `if/else`: executa um bloco se a condição for verdadeira, outro se for falsa
- Operador ternário: `condição ? valorSeVerdadeiro : valorSeFalso`

### Aplicação no Projeto
```javascript
// Condicional if simples
if (texto === '') {
    alert('Por favor, digite uma tarefa!');
    return;
}

// Condicional if/else
if (tarefa) {
    // Código se a tarefa existir
} else {
    // Código se a tarefa não existir
}

// Condicional com múltiplas opções
if (filtroAtual === 'ativas') {
    tarefasFiltradas = tarefas.filter(tarefa => !tarefa.completa);
} else if (filtroAtual === 'completas') {
    tarefasFiltradas = tarefas.filter(tarefa => tarefa.completa);
}

// Operador ternário
<button class="completar">${tarefa.completa ? 'Reativar' : 'Completar'}</button>
```

## 8. Armazenamento Local (localStorage)

### Conceito
O localStorage permite salvar dados no navegador do usuário, persistindo entre sessões.

Métodos:
- `localStorage.setItem(chave, valor)`: salva um valor
- `localStorage.getItem(chave)`: recupera um valor
- `JSON.stringify()`: converte objeto para string
- `JSON.parse()`: converte string para objeto

### Aplicação no Projeto
```javascript
// Salvar dados no localStorage
function salvarTarefas() {
    localStorage.setItem('tarefas', JSON.stringify(tarefas));
}

// Carregar dados do localStorage
function carregarTarefas() {
    const tarefasSalvas = localStorage.getItem('tarefas');
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
        atualizarLista();
    }
}
```

## 9. Template Literals

### Conceito
Template literals permitem criar strings com interpolação de variáveis e expressões.

Sintaxe: \`texto ${expressão} mais texto\`

### Aplicação no Projeto
```javascript
// Uso de template literals para criar o HTML de cada tarefa
li.innerHTML = `
    <span>${tarefa.texto}</span>
    <div class="acoes">
        <button class="completar">${tarefa.completa ? 'Reativar' : 'Completar'}</button>
        <button class="remover">Remover</button>
    </div>
`;

// Template literal com expressões
sumarioEl.textContent = `Total de tarefas: ${total} | Completas: ${completas} | Pendentes: ${pendentes}`;
```

## 10. Objetos Date

### Conceito
O objeto Date permite trabalhar com datas e horas em JavaScript.

Métodos comuns:
- `new Date()`: cria uma nova data com o momento atual
- `Date.now()`: retorna o timestamp atual em milissegundos

### Aplicação no Projeto
```javascript
// Usar timestamp como identificador único
const tarefa = {
    id: Date.now(), // Timestamp atual
    dataCriacao: new Date() // Objeto Date completo
};
```

## Exercícios para Praticar

1. **Adicionar uma data de vencimento às tarefas**
   - Modifique o objeto tarefa para incluir uma data de vencimento
   - Adicione um campo de data no formulário
   - Destaque tarefas vencidas com uma cor diferente

2. **Implementar categorias para as tarefas**
   - Adicione um campo de categoria ao criar tarefas
   - Crie filtros para mostrar tarefas por categoria
   - Use cores diferentes para cada categoria

3. **Criar funcionalidade de ordenação**
   - Adicione botões para ordenar por data de criação, texto ou status
   - Implemente a lógica de ordenação usando o método `sort()` de arrays

4. **Adicionar estatísticas**
   - Crie um gráfico simples mostrando a proporção entre tarefas completas e pendentes
   - Mostre estatísticas de produtividade (tarefas concluídas por dia)

5. **Implementar subtarefas**
   - Permita que cada tarefa tenha subtarefas
   - Atualize a interface para mostrar/esconder subtarefas
   - Uma tarefa só é considerada completa quando todas as subtarefas estiverem completas

Cada um desses exercícios ajudará a reforçar diferentes conceitos fundamentais de JavaScript enquanto expande a funcionalidade do aplicativo!
