const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const ioClient = require('socket.io-client');
const cors = require('cors');

const gatewayApp = express();
gatewayApp.use(bodyParser.json());

const discoveryServerUrl = 'http://localhost:3000';



gatewayApp.use(cors({
    origin: 'http://localhost:5000' // Permitir apenas requisições do seu servidor frontend
  }));


gatewayApp.post('/createVoto', async (req, res) => {
    try {
        // Obtém a lista de nós do servidor de descoberta
        const response = await axios.get(`${discoveryServerUrl}/nodes`);
        const nodes = response.data.nodes;

        // Seleciona um nó aleatório
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];

        // Cria uma conexão socket.io com o nó P2P selecionado
        const p2pNodeSocket = ioClient(randomNode);

        // Aciona um evento no servidor P2P para processar o voto
        p2pNodeSocket.emit('newBlock', req.body);

        res.send({ message: 'Voto encaminhado para a blockchain.' });
    } catch (error) {
        res.status(500).send({ error: 'Erro ao processar o voto.' });
    }
});


gatewayApp.post('/createVotacao', async (req, res) => {
    try {
        // Obtém a lista de nós do servidor de descoberta
        const response = await axios.get(`${discoveryServerUrl}/nodes`);
        const nodes = response.data.nodes;

        // Seleciona um nó aleatório
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];

        // Cria uma conexão socket.io com o nó P2P selecionado
        const p2pNodeSocket = ioClient(randomNode);

        // Aciona um evento no servidor P2P para criar a votação
        p2pNodeSocket.emit('newBlock', req.body);

        res.send({ message: 'Votação criada e encaminhada para a blockchain.' });
    } catch (error) {
        res.status(500).send({ error: 'Erro ao criar a votação.' });
    }
});


gatewayApp.get('/getVotacoes', async (req, res) => {
    try {
        // Obtém a lista de nós do servidor de descoberta
        const response = await axios.get(`${discoveryServerUrl}/nodes`);
        const nodes = response.data.nodes;

        // Seleciona um nó aleatório
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)];

        // Cria uma conexão socket.io com o nó P2P selecionado
        const p2pNodeSocket = ioClient(randomNode);

        // Aciona um evento no servidor P2P para solicitar as votações existentes
        p2pNodeSocket.emit('requestVotingContractState');

        // Aguarde a resposta do nó P2P
        p2pNodeSocket.on('responseVotingContractState', (votingContractState) => {
            res.json(votingContractState);
        });
    } catch (error) {
        res.status(500).send({ error: 'Erro ao obter as votações.' });
    }
});
const gatewayPort = 8000;
gatewayApp.listen(gatewayPort, () => {
    console.log(`Gateway ouvindo na porta ${gatewayPort}`);
});