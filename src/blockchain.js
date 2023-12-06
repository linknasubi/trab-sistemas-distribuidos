const SHA256 = require('crypto-js/sha256');
const VotingContract = require('./votingContract');

class Block {
    constructor(index, timestamp, data, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.data = data; // Data contém as transações ou informações de votação
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data)).toString();
    }
}

class Blockchain {
    constructor(votingContract) {
        this.chain = [this.createGenesisBlock()];
        this.votingContract = new VotingContract();
        this.lastIndex = 0;
    }

    createGenesisBlock() {
        return new Block(0, "01/01/2020", "Genesis Block", "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addBlock(newBlockData) {
        
        const newIndex = this.generateNextIndex(); // Gere o próximo índice
        const newTimestamp = this.getCurrentTimestamp(); // Obtenha o timestamp atual
        const newBlock = new Block(newIndex, newTimestamp, newBlockData, this.getLatestBlock().hash);
        newBlock.hash = newBlock.calculateHash();
        this.chain.push(newBlock);

        // Processa as transações/votações do bloco
        if (newBlockData.transactionType === "createVotacao") {
            this.votingContract.createVotacao(newBlockData.votacaoId, newBlockData.titulo, newBlockData.categorias);
        } else if (newBlockData.transactionType === "registerVote") {
            this.votingContract.registrarVoto(newBlockData.votacaoId, newBlockData.categoria);
        }
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }


    generateNextIndex() {
        // Incremente o último índice usado para obter o próximo índice
        this.lastIndex++;
        return this.lastIndex;
    }

    getCurrentTimestamp() {
        const currentTimestamp = new Date().getTime();
        return new Date(currentTimestamp).toLocaleString();
    }

}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;