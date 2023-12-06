const axios = require('axios');
const { Blockchain } = require('./src/blockchain');
const P2PServer = require('./src/network');

const blockchain = new Blockchain();
const p2pServer = new P2PServer(blockchain);

async function initNode() {
    await p2pServer.start(); // Inicia o servidor P2P
}

initNode().catch(error => {
    console.error('Erro ao iniciar o nó:', error);
});


