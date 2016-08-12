/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('NotificacoesCtrl', function ($scope, $state, JogosService, UserService, Enum) {
    var vm = this;
    vm.notificacoes = UserService.notificacoes;
    vm.tiposNotificacoes = Enum.TipoNotificacao;
    vm.acaoClickImagem = acaoClickImagem;
    vm.acaoClickItem = acaoClickItem;
    vm.aprovarSolicitacaoPresenca = aprovarSolicitacaoPresenca;
    vm.solicitacaoPendente = solicitacaoPendente;

    $scope.$on('$ionicView.enter', function () {
      _.forEach(vm.notificacoes, function (val) {
        val.lida = true;
        vm.notificacoes.$save(val);
      });
    })

    activate();

    function activate() {
    }

    function acaoClickImagem(notificacao) {
      if (notificacao.tipo == Enum.TipoNotificacao.solicitacaoAmizade ||
        notificacao.tipo == Enum.TipoNotificacao.convitePartida ||
        Enum.TipoNotificacao.solicitacaoPresenca) {
        UserService.getUserProfile(notificacao.userId).$loaded().then(function (jogador) {
          UserService.openPerfilJogador(jogador);
        });
      }
    }

    function acaoClickItem(notificacao) {
      if (notificacao.tipo == Enum.TipoNotificacao.convitePartida ||
        notificacao.tipo == Enum.TipoNotificacao.solicitacaoPresenca ||
        notificacao.tipo == Enum.TipoNotificacao.aprovacaoSolicitacaoPresenca) {
        var jogo = _.find(UserService.jogos, { id: notificacao.jogoId });
        if (jogo) {
          JogosService.jogoSelecionado = jogo;
          $state.go('main.meus-jogos-detail-notificacoes', { id: notificacao.jogoId });
        }
        else {
          JogosService.getJogo(notificacao.jogoId).then(function (val) {
            JogosService.jogoSelecionado = val;
            $state.go('main.meus-jogos-detail-notificacoes', { id: notificacao.jogoId });
          });
        }
      }
    }

    function aprovarSolicitacaoPresenca(notificacao) {
      JogosService.aprovarSolicitacaoPresenca(notificacao.userId, notificacao.jogoId);
    }

    function solicitacaoPendente(notificacao) {
      var jogo = _.find(UserService.jogos, { id: notificacao.jogoId });
      if (jogo) {
        var jogador = _.find(jogo.jogadores, { $id: notificacao.userId });
        if (jogador) {
          return jogador.aguardandoConfirmacao;
        } 
      }
    }

  });