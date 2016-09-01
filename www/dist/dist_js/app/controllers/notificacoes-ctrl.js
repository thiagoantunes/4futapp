(function () {
  'use strict';
  angular.module('main')
  .controller('NotificacoesCtrl', NotificacoesCtrl);

  NotificacoesCtrl.$inject = ['$scope', '$state', 'JogosService', 'UserService', 'Enum'];

  function NotificacoesCtrl($scope, $state, JogosService, UserService, Enum) {
    var vm = this;
    vm.notificacoes = UserService.notificacoes;
    vm.meusAmigos = UserService.amigos;
    vm.tiposNotificacoes = Enum.TipoNotificacao;
    vm.acaoClickImagem = acaoClickImagem;
    vm.acaoClickItem = acaoClickItem;
    vm.aprovarSolicitacaoPresenca = aprovarSolicitacaoPresenca;
    vm.solicitacaoPendente = solicitacaoPendente;
    vm.checkAmizade = checkAmizade;
    vm.seguirJogador = seguirJogador;
    vm.deixarDeSeguir = deixarDeSeguir;

    $scope.$on('$ionicView.enter', function () {
      _.forEach(vm.notificacoes, function (val) {
        val.lida = true;
        vm.notificacoes.$save(val);
      });
    });

    activate();

    function activate() {
    }

    function acaoClickImagem(notificacao) {
      if (notificacao.tipo == Enum.TipoNotificacao.solicitacaoAmizade ||
        notificacao.tipo == Enum.TipoNotificacao.convitePartida ||
        Enum.TipoNotificacao.solicitacaoPresenca) {
        UserService.getUserProfile(notificacao.userId).$loaded().then(function (jogador) {
          UserService.jogadorSelecionado = jogador;
        $state.go('app.detalhes-jogador', {id : jogador.$id});
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
          $state.go('app.detalhes-jogador', { id: notificacao.jogoId });
        }
        else {
          JogosService.getJogo(notificacao.jogoId).then(function (val) {
            JogosService.jogoSelecionado = val;
            $state.go('app.detalhes-jogador', { id: notificacao.jogoId });
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

    function checkAmizade(notificacao) {
      return _.some(vm.meusAmigos, function (val) {
        return val.$id == notificacao.userId;
      });
    }

    function seguirJogador(notificacao) {
      UserService.adicionarAmigo(notificacao.userId);
    }

    function deixarDeSeguir(notificacao) {
      var options = {
        'addDestructiveButtonWithLabel' : 'Deixar de seguir',
        'addCancelButtonWithLabel': 'Cancelar'
      };
      window.plugins.actionsheet.show(options, function (_btnIndex) {
        UserService.removerAmigo(notificacao.userId);
      });
    }

  }
} ());