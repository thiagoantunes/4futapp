/*global firebase moment*/
'use strict';
angular.module('main')
  .controller('JogosCtrl', function ($scope, GeoService, JogosService, $ionicModal) {
    var vm = this;
    vm.jogosRegiao = JogosService.jogosRegiao;
    vm.jogosService = JogosService;
    vm.orderByConfirmacao = orderByConfirmacao;
    activate();

    function activate() {
      setMap();
    }

    function setMap() {
      vm.map = {
        center: {
          latitude: GeoService.position[0],
          longitude: GeoService.position[1]
        },
        zoom: 14,
        options: {
          disableDefaultUI: true,
        },
        clusterOptions: {
          nearbyDistance: 2,
        },
        mapEvents: {
          click: function () {
            $scope.$apply(function () {
              vm.showDetails = false;
            });
          }
        },

        markersEvents: {
          click: selecionaJogoMapa
        }
      };
    }

    function selecionaJogoMapa(marker, eventName, model) {
      if (model.visivel) {
        vm.jogosService.jogoSelecionado = _.find(vm.jogosRegiao, { $id: model.$id });
        vm.map.center = {
          latitude: vm.jogosService.jogoSelecionado.latitude,
          longitude: vm.jogosService.jogoSelecionado.longitude
        };
        vm.showDetails = true;
      }
    }

    function orderByConfirmacao(jogador) {
      if (jogador.confirmado == true) {
        return 1;
      }
      else if (jogador.confirmado == undefined) {
        return 2;
      }
      else if (jogador.confirmado == false) {
        return 3;
      }
    }

  })

  .controller('MeusJogosCtrl', function (JogosService, UserService, ReservasService, ArenasService, $ionicModal) {
    var vm = this;
    vm.jogosService = JogosService;
    vm.minhasReservas = UserService.reservas;
    vm.jogos = UserService.jogos;
    vm.verPartidas = true;

    vm.orderByConfirmacao = orderByConfirmacao;
    vm.isAndroid = isAndroid;
    vm.openReservamodal = openReservamodal;

    vm.jogoHoje = jogoHoje;
    vm.jogoAlgumasHoras = jogoAlgumasHoras;
    vm.proximosJogos = proximosJogos;
    vm.jogosAnteriores = jogosAnteriores;
    vm.numeroPartidasPassadas = numeroPartidasPassadas;
    vm.jogoEmAndamento = jogoEmAndamento;

    activate();

    function activate() {
    }

    function openReservamodal(reserva) {
      var arena = _.find(ArenasService.arenas, { '$id': reserva.arenaId });
      ReservasService.openReservaModal(reserva, arena);
    }

    function orderByConfirmacao(jogador) {
      if (jogador.confirmado == true) {
        return 1;
      }
      else if (jogador.confirmado == undefined) {
        return 2;
      }
      else if (jogador.confirmado == false) {
        return 3;
      }
    }

    function isAndroid() {
      return ionic.Platform.isAndroid();
    }

    function jogoHoje(inicio) {
      var date = moment(inicio);
      var REFERENCE = moment();
      var TODAY = REFERENCE.clone().startOf('day');
      return date.isSame(TODAY, 'd');
    }

    function jogoAlgumasHoras(inicio) {
      var date = moment(inicio);
      var duration = moment.duration(date.diff(moment()));
      return duration.asHours() < 5 && duration.asHours() > 0;
    }

    function jogoEmAndamento(inicio) {
      var date = moment(inicio);
      var duration = moment.duration(date.diff(moment()));
      return duration.asHours() < 0 && duration.asHours() >= -1;
    }

    function proximosJogos(jogo) {
      var date = moment(jogo.inicio);
      var duration = moment.duration(date.diff(moment()));
      return duration.asHours() >= -1;
    }

    function jogosAnteriores(jogo) {
      var date = moment(jogo.inicio);
      var duration = moment.duration(date.diff(moment()));
      return duration.asHours() < -1;
    }

    function numeroPartidasPassadas() {
      return _.filter(vm.jogos, jogosAnteriores).length;
    }

  })

  .controller('ReservaCtrl', function ($scope, $state, JogosService, UserService, ReservasService, ArenasService, GeoService, Enum, $ionicModal, $ionicPopup) {
    var vm = this;
    vm.reservaSelecionada = ReservasService.reservaSelecionada.data;

    vm.cancelarReserva = cancelarReserva;
    vm.getStatusReserva = getStatusReserva;
    vm.isAndroid = isAndroid;
    vm.closeModal = closeModal;
    vm.criaPartida = criaPartida;
    vm.idParaPartida = idParaPartida;

    activate();

    function activate() {
      setMap();
    }

    function cancelarReserva() {
      var popup = $ionicPopup.confirm({
        template: 'Confirma o cancelamento da reserva?',
        buttons: [{
          text: 'Não',
          type: 'button-default',
          onTap: function (e) {
            e.preventDefault();
            popup.close();
          }
        }, {
            text: 'Sim',
            type: 'button-assertive',
            onTap: function (e) {
              ReservasService.cancelarReserva(vm.reservaSelecionada.arenaId, vm.reservaSelecionada.$id);
              vm.modal.hide();
            }
          }]
      });
    }

    function criaPartida() {
      JogosService.novaPartida = {
        data: {
          reserva: vm.reservaSelecionada.$id,
          dia: moment(vm.reservaSelecionada.start).format('DD/MM/YYYY'),
          hora: moment(vm.reservaSelecionada.start).format('HH:mm'),
        },
        arenaReserva: vm.reservaSelecionada.arenaId,
        localSelecionado: {
          nome: vm.reservaSelecionada.arena.nome,
          endereco: vm.reservaSelecionada.arena.endereco,
          latitude: vm.reservaSelecionada.arena.latitude,
          longitude: vm.reservaSelecionada.arena.longitude
        }
      };

      $state.go('main.criar-partida-reserva');
      closeModal();
    }

    function idParaPartida() {
      closeModal();
      var partida = _.find(UserService.jogos, { '$id': vm.reservaSelecionada.partida });
      JogosService.jogoSelecionado = partida;
      $state.go('main.meus-jogos-detail', { '$id': partida.$id });
    }

    function isAndroid() {
      return ionic.Platform.isAndroid();
    }

    function closeModal() {
      ReservasService.reservaSelecionada.modal.hide();
    }

    function setMap() {
      vm.showDetails = false;
      vm.map = {
        center: {
          latitude: vm.reservaSelecionada.arena.latitude,
          longitude: vm.reservaSelecionada.arena.longitude
        },
        zoom: 14,
        options: {
          disableDefaultUI: true,

        }
      };
    }

    function getStatusReserva(status) {
      if (status == 'cancelado') {
        return 'Reserva cancelada';
      }
      else if (status == 'agendado') {
        return 'Agendamento confirmado';
      }
      else if (status == 'aguardando-confirmacao') {
        return 'Aguardando confirmação';
      }

    }

  })

  .controller('NovaPartidaCtrl', function ($scope, $state, $ionicHistory, Enum, UserService, ReservasService, JogosService, ArenasService, $ionicModal, ionicTimePicker, ionicDatePicker, LocationService, $ionicLoading, $cordovaSocialSharing, $window) {
    var vm = this;
    vm.jogadores = [];
    vm.times = [];
    vm.amigos = UserService.amigos;
    vm.arenas = ArenasService.arenas;
    vm.meusTimes = UserService.times;
    vm.arenasBasicas = ArenasService.arenasBasicas;
    vm.visualizacaoJogo = Enum.VisualizacaoJogo;
    vm.novaPartida = JogosService.novaPartida;
    vm.openTimePicker = openTimePicker;
    vm.openDatePicker = openDatePicker;
    vm.openLocalPicker = openLocalPicker;
    vm.openCriaLocalModal = openCriaLocalModal;
    vm.selecionaArenaBasica = selecionaArenaBasica;
    vm.salvarJogo = salvarJogo;
    vm.editarJogo = editarJogo;
    vm.goBack = goBack;
    vm.toggleJogador = toggleJogador;
    vm.checkJogadorPartida = checkJogadorPartida;
    vm.toggleTime = toggleTime;
    vm.checkTime = checkTime;
    vm.abrirArena = abrirArena;
    vm.compartilharFacebook = compartilharFacebook;
    vm.compartilharWhatsapp = compartilharWhatsapp;
    vm.compartilharEmail = compartilharEmail;

    $scope.$on('$ionicView.enter', function () {
      // AndroidFullScreen.showUnderStatusBar(function (){
      //   $rootScope.underStatusBar = true;
      //   console.info("showUnderStatusBar");
      // }, function(){
      //   console.error(error);
      // });
      if (window.cordova) {
        AndroidFullScreen.immersiveMode();
      }
    });

    $scope.$on('$ionicView.leave', function () {
      if (window.cordova) {
        AndroidFullScreen.showSystemUI();
      }
    });


    activate();

    function activate() {
      ArenasService.getArenasBasicas();
      if (!vm.novaPartida.editing) {
        vm.novaPartida.data.minJogadores = 10;
        vm.novaPartida.data.maxJogadores = 20;
        vm.novaPartida.data.visibilidade = 4;
        vm.novaPartida.data.compartilharFacebook = true;
        vm.novaPartida.data.aprovacaoManual = false;
        vm.novaPartida.data.responsavel = firebase.auth().currentUser.uid;
        vm.novaPartida.data.status = 'agendado';
      }

      vm.numJogadoresRangeOptions = {
        floor: 5,
        ceil: 30,
        step: 1,
        hideLimitLabels: true,
      };
    }

    function salvarJogo() {
      vm.novaPartida.data.endereco = vm.novaPartida.localSelecionado.endereco;
      var novaPartidaData = {
        partida: vm.novaPartida.data,
        coords: [vm.novaPartida.localSelecionado.latitude, vm.novaPartida.localSelecionado.longitude],
        arenaId: vm.novaPartida.arenaReserva,
        jogadores: vm.jogadores,
        times: vm.times
      }
      $ionicLoading.show({ template: 'Carregando...' });
      JogosService.criarJogo(novaPartidaData)
        .then(function (jogoId) {
          //goBack();
          JogosService.getJogo(jogoId).then(function (val) {
            $ionicLoading.hide();
            JogosService.jogoSelecionado = val;
            JogosService.jogoSelecionado.novoJogo = true;
            if (vm.novaPartida.arenaReserva) {
              $state.go('main.meus-jogos-detail-reserva', { id: jogoId });
            }
            else {
              $state.go('main.meus-jogos-detail', { id: jogoId });
            }
          });
        }, function (err) {
          console.log(err);
          $ionicLoading.hide();
          $window.alert('Ops! Ocorreu um erro ao criar a partida. Tente novamente mais tarde.');
        });
    }

    function editarJogo() {
      vm.novaPartida.data.endereco = vm.novaPartida.localSelecionado.endereco;
      var partida = {
        idPartida: vm.novaPartida.idPartida,
        partida: vm.novaPartida.data,
        coords: [vm.novaPartida.localSelecionado.latitude, vm.novaPartida.localSelecionado.longitude],
        arenaId: vm.novaPartida.arenaReserva,
      }
      $ionicLoading.show({ template: 'Carregando...' });
      JogosService.editarJogo(partida)
        .then(function (jogoId) {
          JogosService.getJogo(jogoId).then(function (val) {
            $ionicLoading.hide();
            JogosService.jogoSelecionado = val;
            goBack();
          });
        }, function (err) {
          console.log(err);
          $ionicLoading.hide();
          $window.alert('Ops! Ocorreu um erro ao editar a partida. Tente novamente mais tarde.');
        });
    }

    function goBack() {
      if (vm.modalData) {
        $ionicHistory.goBack(-5);
      }
      else {
        $ionicHistory.goBack();
      }
    }

    function toggleJogador(amigo) {
      if (_.some(vm.jogadores, { '$id': amigo.$id })) {
        var index = vm.jogadores.indexOf(amigo);
        if (index > -1) {
          vm.jogadores.splice(index, 1);
        }
      }
      else {
        vm.jogadores.push(amigo);
      }
    }

    function abrirArena(arena) {
      ArenasService.arenaSelecionada = arena;
      ArenasService.arenaSelecionada.criacaoPartidaAndamento = true;
    }

    function checkJogadorPartida(amigo) {
      return _.some(vm.jogadores, { '$id': amigo.$id });
    }

    function toggleTime(time) {
      if (_.some(vm.times, { '$id': time.$id })) {
        var index = vm.times.indexOf(time);
        if (index > -1) {
          vm.times.splice(index, 1);
        }
      }
      else {
        vm.times.push(time);
      }
    }

    function checkTime(time) {
      return _.some(vm.times, { '$id': time.$id });
    }

    function openTimePicker() {
      if (!vm.novaPartida.arenaReservaCallback) {
        if (window.cordova) {
          var options = {
            date: new Date(),
            mode: 'time',
            locale: 'pt_br',
            minuteInterval: 15,
            doneButtonLabel: 'Ok',
            cancelButtonLabel: 'Cancelar',
            androidTheme: 4,
            is24Hour: true,
            okText: 'Ok',
            cancelText: 'Cancelar',

          };
          datePicker.show(options, function (date) {
            $scope.$apply(function () {
              var activeElement = document.activeElement;
              if (activeElement) {
                activeElement.blur();
              }
              vm.novaPartida.data.inicio = moment(vm.novaPartida.data.inicio + moment(date).format('HH:mm'), 'DD/MM/YYYYHH:mm')._d.getTime();
              vm.novaPartida.dataFormatada = moment(vm.novaPartida.data.inicio).format('DD/MM/YYYY') + ' às ' + moment(vm.novaPartida.data.inicio).format('HH:mm');
            });
          });
        }
        else {
          var tpObj = {
            callback: function (val) {
              if (!(typeof (val) === 'undefined')) {
                var selectedTime = new Date(val * 1000);
                var hora = moment(new Date(val * 1000)).add(moment(new Date(val * 1000))._d.getTimezoneOffset(), 'm').format('HH:mm');

                vm.novaPartida.data.inicio = moment(vm.novaPartida.data.inicio + hora, 'DD/MM/YYYYHH:mm')._d.getTime();
                vm.novaPartida.dataFormatada = moment(vm.novaPartida.data.inicio).format('DD/MM/YYYY') + ' às ' + moment(vm.novaPartida.data.inicio).format('HH:mm');
              }
            }
          };
          ionicTimePicker.openTimePicker(tpObj);
        }
      }
    }

    function openDatePicker() {
      if (!vm.novaPartida.arenaReservaCallback) {
        if (window.cordova) {
          var options = {
            date: new Date(),
            mode: ionic.Platform.isAndroid() ? 'date' : 'datetime',
            locale: 'pt_br',
            minuteInterval: 15,
            doneButtonLabel: 'Ok',
            cancelButtonLabel: 'Cancelar',
            allowOldDates: false,
            androidTheme: 4,
            is24Hour: true,
            okText: 'Ok',
            cancelText: 'Cancelar',
          };
          datePicker.show(options, function (date) {
            $scope.$apply(function () {
              var activeElement = document.activeElement;
              if (activeElement) {
                activeElement.blur();
              }
              if (ionic.Platform.isAndroid()) {
                vm.novaPartida.data.inicio = moment(date).format('DD/MM/YYYY');
                openTimePicker();
              }
              else {
                vm.novaPartida.data.inicio = moment(date)._d.getTime();
                vm.novaPartida.dataFormatada = moment(date).format('DD/MM/YYYY') + ' às ' + moment(date).format('HH:mm');
              }
            });
          });
        }
        else {
          var ipObj1 = {
            callback: function (val) {
              openTimePicker();
              vm.novaPartida.data.inicio = moment(val).format('DD/MM/YYYY');
            },
            inputDate: new Date(),
            mondayFirst: true,
          };
          ionicDatePicker.openDatePicker(ipObj1);
        }
      }
    }

    function openLocalPicker() {
      if (!vm.novaPartida.arenaReservaCallback) {
        $ionicModal.fromTemplateUrl('templates/modal/selecionar-local.html', {
          scope: $scope,
          animation: 'slide-in-up'
        }).then(function (modal) {
          $scope.modalLocal = modal;
          $scope.modalLocal.show();
        });
      }
    }

    function openCriaLocalModal() {
      $scope.search = {};
      $scope.search.suggestions = [];
      $scope.search.query = '';
      $scope.search.justSelected = false;
      $scope.$watch('search.query', function (newValue) {
        if (newValue && !$scope.search.justSelected) {
          LocationService.searchAddress(newValue).then(function (result) {
            $scope.search.error = null;
            $scope.search.suggestions = result;
          }, function (status) {
            $scope.search.error = 'There was an error :( ' + status;
          });
        }
        $scope.choosePlace = function (place) {
          LocationService.getDetails(place.place_id).then(function (location) {
            $scope.search.query = location.formatted_address;
            $scope.location = location;
            $scope.search.justSelected = true;
            $scope.search.suggestions = [];
          });
        };

        $scope.salvarNovoLocal = function () {
          ArenasService.criaArenaBasica(
            $scope.search.nome,
            [$scope.location.geometry.location.lat(), $scope.location.geometry.location.lng()],
            $scope.location.formatted_address
          )
            .then(function () {
              vm.novaPartida.localSelecionado = {
                nome: $scope.search.nome,
                latitude: $scope.location.geometry.location.lat(),
                longitude: $scope.location.geometry.location.lng(),
                endereco: $scope.location.formatted_address
              }
              $scope.modalCriaLocal.hide();
              $scope.modalLocal.hide();
            }, function (error) {
              console.log('Erro ao cadastrar novo local');
            });
        };
      });
      $ionicModal.fromTemplateUrl('templates/modal/criar-local.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalCriaLocal = modal;
        $scope.modalCriaLocal.show();
      });
    }

    function selecionaArenaBasica(arenaBasica) {
      vm.novaPartida.localSelecionado = arenaBasica;
      $scope.modalLocal.hide();
      console.log(arenaBasica);
    }

    function compartilharFacebook() {
      $ionicLoading.show({ template: 'Carregando...' });
      $cordovaSocialSharing
        .shareViaFacebook('Mensagem de teste', 'http://pt.seaicons.com/wp-content/uploads/2016/05/Sport-football-pitch-icon.png', 'http://reidaquadra.com/')
        .then(function (result) {
          $ionicLoading.hide();
        }, function (err) {
          $ionicLoading.hide();
        });
    }

    function compartilharWhatsapp() {
      $ionicLoading.show({ template: 'Carregando...' });
      $cordovaSocialSharing
        .shareViaWhatsApp('Mensagem de teste', 'http://pt.seaicons.com/wp-content/uploads/2016/05/Sport-football-pitch-icon.png', 'http://reidaquadra.com/')
        .then(function (result) {
          $ionicLoading.hide();
        }, function (err) {
          $ionicLoading.hide();
        });
    }

    function compartilharEmail() {
      $ionicLoading.show({ template: 'Carregando...' });
      $cordovaSocialSharing
        .shareViaEmail('Mensagem de teste', 'Mensagem de teste')
        .then(function (result) {
          $ionicLoading.hide();
        }, function (err) {
          $ionicLoading.hide();
        });
    }

  })

  .controller('JogosDetailCtrl', function ($scope, $state, $timeout, $rootScope, $ionicPlatform, $ionicHistory, JogosService, UserService, $ionicModal, GeoService, $ionicLoading, $window, $ionicActionSheet, $cordovaSocialSharing, $ionicPopup) {
    var vm = this;
    vm.jogo = JogosService.jogoSelecionado;
    vm.amigos = UserService.amigos;

    vm.atualizaPresenca = atualizaPresenca;
    vm.getPresencaClass = getPresencaClass;
    vm.checkPresencaAmigo = checkPresencaAmigo;
    vm.checkOrganizador = checkOrganizador;
    vm.convidarAmigo = convidarAmigo;
    vm.desconvidarAmigo = desconvidarAmigo;
    vm.getNumJogadores = getNumJogadores;
    vm.orderByConfirmacao = orderByConfirmacao;
    vm.navigateTo = navigateTo;
    vm.openPerfilJogador = openPerfilJogador;
    vm.openChat = openChat;
    vm.compartilhar = compartilhar;
    vm.compartilharFacebook = compartilharFacebook;
    vm.compartilharWhatsapp = compartilharWhatsapp;
    vm.compartilharEmail = compartilharEmail;
    vm.maisOpcoes = maisOpcoes;

    $scope.$on('$ionicView.enter', function () {
      $timeout(function () {
        vm.jogo = JogosService.jogoSelecionado;
      }, 0);
    });

    activate();

    function activate() {
      vm.minhaPresenca = _.find(vm.jogo.jogadores, { '$id': firebase.auth().currentUser.uid });

      $ionicModal.fromTemplateUrl('templates/modal/convidar-amigos.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
      });
    }

    function atualizaPresenca(bool) {
      if (vm.minhaPresenca) {
        if (vm.minhaPresenca.confirmado !== undefined) {
          vm.minhaPresenca.confirmado = bool == vm.minhaPresenca.confirmado ? null : bool;
        }
        else {
          vm.minhaPresenca.confirmado = bool;
        }

        vm.jogo.jogadores.$save(vm.minhaPresenca);
      }
      else {
        JogosService.solicitarPresenca(vm.jogo).then(function (val) {
          vm.minhaPresenca = val;
        });
      }
    }

    function getPresencaClass(confirmacao) {
      var val = 'icon ion-ios-help-outline';
      if (confirmacao != undefined) {
        if (confirmacao) {
          val = 'icon ion-ios-checkmark positive';
        }
        else {
          val = 'icon ion-ios-close assertive';
        }
      }
      return val;
    }

    function checkPresencaAmigo(amigo) {
      return _.some(vm.jogo.jogadores, { '$id': amigo.$id });
    }

    function checkOrganizador() {
      return vm.jogo.responsavel == firebase.auth().currentUser.uid;
    }

    function convidarAmigo(amigo) {
      JogosService.convidarAmigo(amigo, vm.jogo.$id);
    }

    function desconvidarAmigo(amigo) {
      JogosService.desconvidarAmigo(amigo, vm.jogo.$id);
    }

    function orderByConfirmacao(jogador) {
      if (jogador.confirmado == true) {
        return 1;
      }
      else if (jogador.confirmado == undefined) {
        return 2;
      }
      else if (jogador.confirmado == false) {
        return 3;
      }
    }

    function getNumJogadores(confirmado) {
      if (confirmado == true) {
        return _.filter(vm.jogo.jogadores, function (val) {
          return val.confirmado == true && !val.aguardandoConfirmacao;
        }).length;
      }
      else if (confirmado == false) {
        return _.filter(vm.jogo.jogadores, function (val) {
          return val.confirmado == false && !val.aguardandoConfirmacao;
        }).length;
      }
      else {
        return _.filter(vm.jogo.jogadores, function (val) {
          return val.confirmado == undefined && !val.aguardandoConfirmacao;
        }).length;
      }
    }

    function navigateTo() {
      var options = {
        'buttonLabels': ['Navegar para endereço'],
        'addCancelButtonWithLabel': 'Fechar'
      };
      window.plugins.actionsheet.show(options, function (_btnIndex) {
        GeoService.navigateTo(vm.jogo.endereco);
      });
    }

    function openPerfilJogador(jogador) {
      UserService.getUserProfile(jogador).$loaded().then(function (val) {
        UserService.jogadorSelecionado = val;
        $state.go('main.perfilJogador-' + Object.keys($state.current.views)[0], { id: jogador });
      });
    }

    function openChat() {
      $state.go('main.chat-' + Object.keys($state.current.views)[0], { id: vm.jogo.$id, tipoChat: 'partida' });
    }

    function compartilhar() {
      $ionicLoading.show({ template: 'Carregando...' });
      $cordovaSocialSharing
        .share('Mensagem de teste', 'teste', 'http://pt.seaicons.com/wp-content/uploads/2016/05/Sport-football-pitch-icon.png', 'http://reidaquadra.com/')
        .then(function (result) {
          $ionicLoading.hide();
        }, function (err) {
          $ionicLoading.hide();
        });
    }

    function compartilharFacebook() {
      $ionicLoading.show({ template: 'Carregando...' });
      $cordovaSocialSharing
        .shareViaFacebook('Mensagem de teste', 'http://pt.seaicons.com/wp-content/uploads/2016/05/Sport-football-pitch-icon.png', 'http://reidaquadra.com/')
        .then(function (result) {
          $ionicLoading.hide();
        }, function (err) {
          $ionicLoading.hide();
        });
    }

    function compartilharWhatsapp() {
      $ionicLoading.show({ template: 'Carregando...' });
      $cordovaSocialSharing
        .shareViaWhatsApp('Mensagem de teste', 'http://pt.seaicons.com/wp-content/uploads/2016/05/Sport-football-pitch-icon.png', 'http://reidaquadra.com/')
        .then(function (result) {
          $ionicLoading.hide();
        }, function (err) {
          $ionicLoading.hide();
        });
    }

    function compartilharEmail() {
      $ionicLoading.show({ template: 'Carregando...' });
      $cordovaSocialSharing
        .shareViaEmail('Mensagem de teste', 'Mensagem de teste')
        .then(function (result) {
          $ionicLoading.hide();
        }, function (err) {
          $ionicLoading.hide();
        });
    }

    function maisOpcoes() {
      var options = {
        'buttonLabels': ['Editar Partida'],
        'addDestructiveButtonWithLabel': 'Cancelar Partida',
        'addCancelButtonWithLabel': 'Fechar'
      };
      if (window.cordova) {
        window.plugins.actionsheet.show(options, function (_btnIndex) {
          if (_btnIndex === 1) {
            cancelarPartida();
          } else if (_btnIndex === 2) {
            editarPartida();
          }
        });
      }
      else {
        $ionicActionSheet.show({
          buttons: [{
            text: 'Editar Partida'
          }, {
              text: 'Cancelar Partida'
            }],
          buttonClicked: function (index) {
            switch (index) {
              case 0: // Copy Text
                editarPartida();
                break;
              case 1: // Delete
                cancelarPartida();
                break;
            }

            return true;
          }
        });
      }
    }

    function editarPartida() {
      JogosService.getLocalizacaoJogo(vm.jogo.$id).then(function (snapLocalizacao) {
        JogosService.novaPartida = {
          data: {
            nome: vm.jogo.nome,
            inicio: vm.jogo.inicio,
            minJogadores: vm.jogo.minJogadores,
            maxJogadores: vm.jogo.maxJogadores,
            visibilidade: vm.jogo.visibilidade,
            compartilharFacebook: vm.jogo.compartilharFacebook,
            aprovacaoManual: vm.jogo.aprovacaoManual,
            responsavel: vm.jogo.responsavel
          },
          dataFormatada: moment(vm.jogo.inicio).format('DD/MM/YYYY') + ' às ' + moment(vm.jogo.inicio).format('HH:mm'),
          localSelecionado: {
            endereco: vm.jogo.endereco,
            latitude: snapLocalizacao.val().l[0],
            longitude: snapLocalizacao.val().l[1]
          },
          editing: true,
          idPartida: vm.jogo.$id
        };
        $state.go('main.criar-partida');
      });
    }

    function cancelarPartida() {
      var confirmPopup = $ionicPopup.show({
        title: 'Anular Partida',
        cssClass: 'dark-popup',
        template: '<div><img style="display: block; margin: auto; margin-bottom: 30px;" src="img/ilustracoes/cartao-vermelho.png" alt=""><p style="text-align:center">Você tem certeza que deseja anular esta partida? Está ação não poderá ser desfeita</p></div>',
        buttons: [
          { text: 'NÃO', type: 'button-light', },
          {
            text: '<b>SIM</b>',
            type: 'button-assertive',
            onTap: function (e) {
              $ionicLoading.show({ template: 'Carregando...' });
              JogosService.cancelarJogo(vm.jogo).then(function () {
                $ionicLoading.hide();
                var alertPopup = $ionicPopup.alert({
                  title: 'PARTIDA CANCELADA',
                  template: ''
                });
                alertPopup.then(function (res) {
                  $ionicHistory.goBack();
                });
              }, function (err) {
                console.log(err);
                $ionicLoading.hide();
              });
            }
          }
        ]
      });
    }


    var oldSoftBack = $rootScope.$ionicGoBack;

    var doCustomBack = function () {
      if (vm.jogo.novoJogo) {
        $ionicHistory.goBack(-5);
      }
      else {
        oldSoftBack();
      }
    };

    $rootScope.$ionicGoBack = function () {
      doCustomBack();
    };
    var deregisterSoftBack = function () {
      $rootScope.$ionicGoBack = oldSoftBack;
    };

    var deregisterHardBack = $ionicPlatform.registerBackButtonAction(
      doCustomBack, 101
    );

    $scope.$on('$destroy', function () {
      deregisterHardBack();
      deregisterSoftBack();
    });

  });