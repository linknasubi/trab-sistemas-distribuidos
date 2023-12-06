const express = require('express');
const app = express();
const port = 3000;

let nodeList = [];

app.use(express.json());

app.post('/register', (req, res) => {
    const nodeAddress = req.body.address;
    if (!nodeList.includes(nodeAddress)) {
        nodeList.push(nodeAddress);
        console.log(`Nó registrado: ${nodeAddress}`);
    } else {
        console.log(`Nó já registrado: ${nodeAddress}`);
    }
    res.send({ nodes: nodeList });
});

app.get('/nodes', (req, res) => {
    console.log('Lista de nós solicitada');
    res.send({ nodes: nodeList });
});

app.post('/unregister', (req, res) => {
    const nodeAddress = req.body.address;
    const index = nodeList.indexOf(nodeAddress);
    if (index > -1) {
        nodeList.splice(index, 1);
        console.log(`Nó removido: ${nodeAddress}`);
    } else {
        console.log(`Nó não encontrado: ${nodeAddress}`);
    }
    res.send({ status: 'removed', address: nodeAddress });
});

app.listen(port, () => {
    console.log(`Servidor de descoberta rodando na porta ${port}`);
});