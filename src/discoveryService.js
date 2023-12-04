const express = require('express');
const app = express();
const port = 3000;

let nodeList = [];

app.use(express.json());

app.post('/register', (req, res) => {
    const nodeAddress = req.body.address;
    if (nodeList.indexOf(nodeAddress) === -1) {
        nodeList.push(nodeAddress);
    }
    console.log(`Um nó de endereço ${nodeAddress} se conectou!`)
    res.send({ nodes: nodeList });
});


app.get('/nodes', (req, res) => {
    res.send({ nodes: nodeList });
});


app.post('/unregister', (req, res) => {
    const nodeAddress = req.body.address;
    const index = nodeList.indexOf(nodeAddress);
    if (index > -1) {
        nodeList.splice(index, 1);
    }
    res.send({ status: 'removed', address: nodeAddress });
});


app.listen(port, () => {
    console.log(`Servidor de descoberta rodando na porta ${port}`);
});