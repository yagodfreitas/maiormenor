// Conecta ao servidor Socket.IO
// A variável 'io' é disponibilizada pelo script /socket.io/socket.io.js
const socket = io();
let meuId = null;

// Armazena o ID do socket do cliente assim que ele se conecta
socket.on('connect', () => {
    meuId = socket.id;
    console.log('Conectado ao servidor com o ID:', meuId);
});

// --- LÓGICA DA PÁGINA DE LOGIN (index.html) ---
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const nomeJogador = document.getElementById('nome-jogador').value;
        if (nomeJogador) {
            // Salva o nome para usar no lobby e emite o evento para o servidor
            sessionStorage.setItem('nomeJogador', nomeJogador);
            socket.emit('entrar-no-jogo', nomeJogador);
            // Redireciona o jogador para a página de lobby
            window.location.href = 'lobby.html';
        }
    });
}

// --- LÓGICA DA PÁGINA DE LOBBY (lobby.html) ---
const listaJogadores = document.getElementById('lista-jogadores');
const btnIniciarJogo = document.getElementById('btn-iniciar-jogo');
const mensagemHost = document.getElementById('mensagem-host');

// Ouve o evento do servidor para atualizar o estado do jogo
socket.on('atualizar-estado-jogo', (gameState) => {
    console.log('Estado do jogo recebido:', gameState);
    
    // Verifica se estamos na página do lobby antes de tentar atualizar a UI
    if (listaJogadores) {
        // Limpa a lista de jogadores atual
        listaJogadores.innerHTML = '';

        // Preenche a lista com os jogadores do estado do jogo
        gameState.jogadores.forEach(jogador => {
            const li = document.createElement('li');
            li.textContent = jogador.nome;
            if (jogador.isHost) {
                li.classList.add('host');
            }
            listaJogadores.appendChild(li);
        });

        // Lógica para mostrar/esconder o botão "Iniciar Jogo"
        const euSouHost = gameState.jogadores.find(j => j.id === meuId)?.isHost;
        const numJogadores = gameState.jogadores.length;

        if (euSouHost) {
            mensagemHost.style.display = 'block';
            btnIniciarJogo.style.display = 'block';
            // Desabilita o botão se o número de jogadores não for o ideal
            if (numJogadores >= 5 && numJogadores <= 8) {
                btnIniciarJogo.disabled = false;
                btnIniciarJogo.textContent = 'Iniciar Jogo!';
            } else {
                btnIniciarJogo.disabled = true;
                btnIniciarJogo.textContent = `Faltam jogadores (${numJogadores}/5)`;
            }
        } else {
            mensagemHost.style.display = 'none';
            btnIniciarJogo.style.display = 'none';
        }
    }
});

// Adiciona o evento de clique ao botão "Iniciar Jogo"
if (btnIniciarJogo) {
    btnIniciarJogo.addEventListener('click', () => {
        socket.emit('iniciar-jogo');
    });
}

// Ouve o evento de início de jogo para redirecionar todos
socket.on('jogo-iniciado', () => {
    window.location.href = 'game.html';
});

// Ouve possíveis erros vindos do servidor
socket.on('erro', (mensagem) => {
    alert('Erro: ' + mensagem);
});

