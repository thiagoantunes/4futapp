(function () {
    'use strict';
    angular
        .module('main')
        .constant('Enum', {
            TipoNotificacao: {
                solicitacaoAmizade: 1,
                convitePartida: 2,
                solicitacaoPresenca: 3,
                aprovacaoSolicitacaoPresenca: 4,
                cancelamentoPartida: 5,
            },
            Modalidade: {
                society: 1,
                salão: 2,
                grama: 3,
                areia: 4
            },
            VisualizacaoJogo: {
                convidados: 1,
                amigos: 2,
                amigosDeAmigos: 3,
                publico: 4
            }
        });
} ());
