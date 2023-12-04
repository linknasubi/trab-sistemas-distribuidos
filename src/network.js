const { Server } = require("socket.io");
const ioClient = require('socket.io-client');
const http = require('http');
const axios = require('axios');
const express = require('express');
const { Blockchain, Block } = require('./blockchain');
const PORT_DISCOVERY = 6001;

class P2PServer {
    constructor(blockchain, port=0) {
        this.blockchain = blockchain;
        this.peers = [];
        const server = http.createServer();
        this.io = new Server(server);
        this.ready = new Promise((resolve, reject) => {
            server.listen(port, () => {
                this.port = server.address().port;
                console.log(`Servidor P2P ouvindo na porta ${this.port}`);
                resolve();
            }).on('error', reject);
        });
    }
    

    listen() {
        this.io.on('connection', socket => {
            console.log('Novo peer conectado');
            this.peers.push(socket);
            this.handleMessages(socket);
            this.registerNode(this.port);
            // Você pode adicionar aqui mais lógica para quando um novo peer se conecta
        });
    }


    

    handleMessages(socket) {
        socket.on('newBlock', blockData => {
            const receivedBlock = new Block(blockData.index, blockData.timestamp, blockData.data, blockData.previousHash);
            const latestBlock = this.blockchain.getLatestBlock();

            if (receivedBlock.previousHash === latestBlock.hash && receivedBlock.hash === receivedBlock.calculateHash()) {
                this.blockchain.addBlock(receivedBlock);
                this.broadcastNewBlock(receivedBlock);
            } else if (receivedBlock.index > latestBlock.index) {
                // Lógica para solicitar a cadeia completa ou resolver conflitos
            }
        });

        socket.on('votingContractState', newState => {
            console.log(newState);
            this.blockchain.votingContract.updateState(newState);
        });

        // Outros manipuladores de eventos, como createVote, castVote, etc.
    }

    connectToPeer(newPeer) {
        const socket = ioClient(newPeer); // Cria uma conexão de cliente para o novo peer
        this.peers.push(socket);
        this.handleMessages(socket); // Configura os manipuladores de mensagens para o novo peer
    }


    initHttpServer() {
        const app = express();
        app.use(express.json());

        app.post('/createVotacao', (req, res) => {
            const { votacaoId, titulo, categorias } = req.body;
            this.blockchain.votingContract.createVotacao(votacaoId, titulo, categorias);
        
            // Cria um bloco para registrar a criação da votação
            const newBlockData = { type: 'createVotacao', votacaoId };

            const newBlock = new Block( 
                this.blockchain.getLatestBlock().index + 1,
                Date.now().toString(),
                [newBlockData],
                this.blockchain.getLatestBlock().hash
            );

            this.blockchain.addBlock(newBlock);
            this.broadcastNewBlock(newBlock);
            this.broadcastVotingContractState();
        
            res.json({ message: 'Votação criada.' });
        });

        app.post('/vote', (req, res) => {
            const { votacaoId, categoria } = req.body;
        
            const newBlockData = {
                type: 'vote',
                details: { votacaoId, categoria }
            };
        
            const newBlock = new Block(
                this.blockchain.getLatestBlock().index + 1,
                Date.now().toString(),
                [newBlockData],
                this.blockchain.getLatestBlock().hash
            );
        
            this.blockchain.addBlock(newBlock);
            this.broadcastNewBlock(newBlock); // Propaga o novo bloco para a rede
        
            res.json({ message: 'Voto registrado e bloco adicionado à blockchain.' });
        });

        app.get('/votacoes', (req, res) => {
            const votacoes = this.blockchain.votingContract.getVotacoes();
            res.json(votacoes);
        });


        app.get('/getContagemVotos/:votacaoId/:categoria', (req, res) => {
            const votacaoId = req.params.votacaoId;
            const categoria = req.params.categoria;
            const votos = this.blockchain.votingContract.getContagemVotos(votacaoId, categoria);
            res.json({ votacaoId, categoria, votos });
        });

        app.get('/getVotacao/:votacaoId', (req, res) => {
            const votacaoId = req.params.votacaoId;
            const votacao = this.blockchain.votingContract.getInformacoesVotacao(votacaoId);
            res.json(votacao);
        });


        // Outros endpoints conforme necessário

        const server = app.listen(0, () => {
            const port = server.address().port;
            console.log(`Servidor HTTP ouvindo na porta ${port}`);
            this.registerNode(port); // Registre este nó no servidor de descoberta
        });
    }

    // Método para registrar o nó no servidor de descoberta
    async registerNode(port) {
        try {
            await axios.post('http://localhost:3000/register', {
                address: `http://localhost:${port}`
            });
            console.log('Nó registrado com sucesso no servidor de descoberta');
        } catch (error) {
            console.error('Erro ao registrar no servidor de descoberta:', error);
        }
    }


    broadcastNewBlock(block) {
        this.peers.forEach(peer => {
            peer.emit('newBlock', block);
        });
    }

    broadcastVotingContractState() {
        const state = this.blockchain.votingContract.getVotacoes();
        console.log(state);
        this.peers.forEach(peer => {
            peer.emit('votingContractState', state);
        });
    }


    async connectToDiscoveryServer(discoveryServerUrl) {
        try {
            const response = await axios.post(`${discoveryServerUrl}/register`, { address: `http://localhost:${PORT_DISCOVERY}` });
            const nodes = response.data.nodes;
            nodes.forEach(node => {
                if (node !== `http://localhost:${PORT_DISCOVERY}`) {
                    this.connectToPeer(node);
                }
            });
        } catch (error) {
            console.error('Erro ao se conectar ao servidor de descoberta:', error);
        }
    }



    
}

module.exports = P2PServer;