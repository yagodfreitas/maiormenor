// 1. Configuração do Servidor
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Define a pasta 'public' como o local dos arquivos estáticos (HTML, CSS, JS do cliente)
app.use(express.static('public'));

// 2. Estado do Jogo (Game State)
// Este objeto vai armazenar todas as informações da partida em tempo real.
const gameState = {
  jogadores: [],
  fase: 'aguardando', // 'aguardando', 'em-jogo'
  // Outras propriedades do jogo serão adicionadas aqui depois
};

// Rota principal para servir a página de login
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// 3. Lógica de Conexão em Tempo Real com Socket.IO
io.on('connection', (socket) => {
  console.log(`Novo jogador conectado: ${socket.id}`);

  // Evento para quando um jogador envia seu nome e entra no jogo
  socket.on('entrar-no-jogo', (nome) => {
    // Cria um objeto para o novo jogador
    const novoJogador = {
      id: socket.id,
      nome: nome,
      fichas: 30,
      mao: [],
      emJogo: true,
      isHost: gameState.jogadores.length === 0 // O primeiro a entrar é o host
    };

    // Adiciona o jogador ao estado do jogo
    gameState.jogadores.push(novoJogador);
    console.log(`${nome} entrou no jogo.`);

    // Envia o estado atualizado do jogo para TODOS os jogadores conectados
    io.emit('atualizar-estado-jogo', gameState);
  });

  // Evento para quando o host inicia a partida
  socket.on('iniciar-jogo', () => {
    const host = gameState.jogadores.find(j => j.id === socket.id);
    if (host && host.isHost) {
        // Validação para garantir o número correto de jogadores
        if (gameState.jogadores.length >= 5 && gameState.jogadores.length <= 8) {
            console.log('O jogo está começando!');
            gameState.fase = 'em-jogo';
            // Envia um evento para todos os clientes redirecionarem para a tela de jogo
            io.emit('jogo-iniciado');
        } else {
            // (Opcional) Enviar um erro de volta para o host se o número de jogadores for inválido
            socket.emit('erro', 'Número de jogadores inválido. Precisa ser entre 5 e 8.');
        }
    }
  });

  // Evento para quando um jogador se desconecta
  socket.on('disconnect', () => {
    console.log(`Jogador desconectado: ${socket.id}`);
    
    // Remove o jogador do array de jogadores
    gameState.jogadores = gameState.jogadores.filter(jogador => jogador.id !== socket.id);

    // Se o host se desconectar, designa um novo host
    if (gameState.jogadores.length > 0 && !gameState.jogadores.some(j => j.isHost)) {
        gameState.jogadores[0].isHost = true;
    }

    // Envia o estado atualizado para os jogadores restantes
    io.emit('atualizar-estado-jogo', gameState);
  });
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

