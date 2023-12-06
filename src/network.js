const { Server } = require("socket.io");
const ioClient = require('socket.io-client');
const http = require('http');
const axios = require('axios');
const express = require('express');
const { Blockchain, Block } = require('./blockchain');

const PORT_DISCOVERY = 3000;
const GATEWAY_SERVER = 'http://localhost:8000'; // URL do servidor do gateway


class P2PServer {
    constructor(blockchain, port = 0) {
        this.blockchain = blockchain;
        this.peers = [];
        this.peerAddress = ''
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
            this.peerAddress = `${socket.handshake.address}:${socket.handshake.port}`;
            socket.peerAddress = this.peerAddress; // Armazenando o endereço do peer
            this.peers[this.peerAddress] = socket; // Usando um objeto para mapear o endereço ao socket
            this.handleMessages(socket);

            socket.on('disconnect', () => {
                console.log(`Peer desconectado: ${this.peerAddress}`);
                delete this.peers[this.peerAddress]; // Removendo da lista local
                this.notifyPeersAboutDisconnect(this.peerAddress); // Notificando outros peers
                this.unregisterNode(this.peerAddress); // Desregistrar do servidor de descoberta
            });
        });
    }

    notifyPeersAboutDisconnect(disconnectedPeerAddress) {
        Object.values(this.peers).forEach(peerSocket => {
            if (peerSocket.peerAddress !== `http://localhost:${this.port}`) {
                peerSocket.emit('peerDisconnected', { address: disconnectedPeerAddress });
            }
        });
    }

    handleMessages(socket) {
        socket.on('newBlock', blockData => {

            this.blockchain.addBlock(blockData);
            const updatedBlockchain = this.blockchain; // Atualiza a variável com a blockchain atualizada


            Object.values(this.peers).forEach(peerSocket => {

                if (peerSocket.peerAddress !== `http://localhost:${this.port}`) {
                    console.log(`Enviando para ${peerSocket.peerAddress}`);
                    peerSocket.emit('blockchainUpdated', updatedBlockchain);
                }
            });
        });

        socket.on('blockchainUpdated', newBlockchain => {

            this.blockchain.chain = newBlockchain.chain;
            this.blockchain.lastIndex = newBlockchain.lastIndex;
            this.blockchain.votingContract.votacoes = newBlockchain.votingContract.votacoes;
            
            console.log(`receptor:${this.blockchain}`)

        });

        socket.on('requestBlockchain', () => {
            socket.emit('responseBlockchain', this.blockchain);
        });

        socket.on('responseBlockchain', receivedBlockchain => {
            if (receivedBlockchain.isChainValid() && receivedBlockchain.chain.length > this.blockchain.chain.length) {
                this.blockchain = receivedBlockchain;
            }
        });

        socket.on('requestVotingContractState', () => {
            socket.emit('responseVotingContractState', this.blockchain.votingContract.getVotacoes());
        });

        socket.on('responseVotingContractState', receivedState => {
            console.log(receivedState);
            this.blockchain.votingContract.updateState(receivedState);
        });

        socket.on('peerDisconnected', () => {
            delete this.peers[socket.peerAddress]; // Removendo da lista local
            this.unregisterNode(socket.peerAddress); // Desregistrar do servidor de descoberta
        });
    }


    async updatePeersList() {
        try {
            const response = await axios.get('http://localhost:3000/nodes');
            const currentPeers = response.data.nodes;
            console.log(currentPeers)
            currentPeers.forEach(peerAddress => {
                const peerPort = peerAddress.split(':').pop(); // Obtém a porta do peer da string do endereço
                if (peerPort != this.port && !this.peers.some(p => p.peerAddress === peerAddress)) {
                    console.log(peerAddress);
                    this.connectToPeer(peerAddress);
                }
            });
        } catch (error) {
            console.error('Erro ao atualizar a lista de peers:', error);
        }
    }

    connectToPeer(newPeer) {
        const socket = ioClient(newPeer);
        socket.peerAddress = newPeer; // Adiciona o endereço do peer ao socket para referência futura
        this.peers.push(socket);
        this.setupPeerEvents(socket);
    }

    setupPeerEvents(socket) {
        socket.on('connect', () => {
            console.log(`Conectado ao peer ${socket.peerAddress}`);
        });
    }


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

    async unregisterNode(port) {
        try {
            await axios.post('http://localhost:3000/unregister', {
                address: `http://localhost:${port}`
            });
            console.log('Nó desregistrado com sucesso.');
        } catch (error) {
            console.error('Erro ao desregistrar o nó:', error);
        }
    }

    async connectToDiscoveryServer(discoveryServerUrl) {
        try {
            const response = await axios.post(`${discoveryServerUrl}/register`, { address: `http://localhost:${this.port}` });
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

    requestLatestBlockchain() {
        this.peers.forEach(peer => {
            peer.emit('requestBlockchain');
        });
    }


    async start() {
        await this.ready;
        this.listen();
        await this.connectToDiscoveryServer(`http://localhost:${PORT_DISCOVERY}`);
        this.requestLatestBlockchain();
        setInterval(() => this.updatePeersList(), 10000); // Atualiza a lista de peers a cada 10 segundos
    }
}

module.exports = P2PServer;