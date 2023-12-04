class VotingContract {
    constructor() {
        this.votacoes = {}; // Armazena os dados de cada votação
    }

    getVotacoes() {
        return this.votacoes; // Retorna um objeto com todas as votações
    }


    // Verifica se uma votação existe
    votacaoExiste(votacaoId) {
        return this.votacoes.hasOwnProperty(votacaoId);
    }

    updateState(newState) {
        // Atualize o estado do contrato com os dados recebidos
        this.votacoes = newState;
    }

    // Verifica se uma categoria é válida para uma dada votação
    categoriaValida(votacaoId, categoria) {
        if (this.votacaoExiste(votacaoId)) {
            return this.votacoes[votacaoId].categorias.includes(categoria);
        }
        return false;
    }

    // Cria uma nova votação com categorias específicas
    createVotacao(votacaoId, titulo, categorias) {
        if (!this.votacoes[votacaoId]) {
            this.votacoes[votacaoId] = {
                titulo: titulo,
                categorias: categorias,
                votos: {}
            };

            // Inicializa a contagem de votos para cada categoria
            categorias.forEach(categoria => {
                this.votacoes[votacaoId].votos[categoria] = 0;
            });
        }
    }

    // Registra um voto em uma categoria específica de uma votação
    registrarVoto(votacaoId, categoria) {
        if (this.votacoes[votacaoId] && this.votacoes[votacaoId].votos.hasOwnProperty(categoria)) {
            this.votacoes[votacaoId].votos[categoria]++;
        }
    }

    // Obtém a contagem de votos para uma categoria específica em uma votação
    getContagemVotos(votacaoId, categoria) {
        if (this.votacoes[votacaoId] && this.votacoes[votacaoId].votos.hasOwnProperty(categoria)) {
            return this.votacoes[votacaoId].votos[categoria];
        }
        return 0;
    }

    // Obtém informações sobre uma votação específica
    getInformacoesVotacao(votacaoId) {
        return this.votacoes[votacaoId] ? this.votacoes[votacaoId] : null;
    }
}

module.exports = VotingContract;