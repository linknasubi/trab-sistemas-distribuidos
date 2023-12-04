const axios = require('axios');

const { Blockchain } = require('./src/blockchain');
const P2PServer = require('./src/network');


const blockchain = new Blockchain();
const p2pServer = new P2PServer(blockchain);


function initNode() {
    p2pServer.listen();
    p2pServer.initHttpServer(); // Inicializa o servidor HTTP com uma porta dinâmica

}

initNode();


async function desregistrarNo() {
    try {
        await axios.post('http://localhost:3000/unregister', {
            address: `http://localhost:${p2pServer.port}`
        });
        console.log('Nó desregistrado com sucesso.');
    } catch (error) {
        console.error('Erro ao desregistrar o nó:', error);
    }
}

process.on('SIGINT', () => {

    desregistrarNo().then(() => {
        process.exit(0);
    });

    console.log('Nó encerrando...');

});