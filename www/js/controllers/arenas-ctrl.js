/*global */
'use strict';
angular.module('main')
  .controller('ArenasCtrl', function (GeoService, $scope, ArenasService, ionicMaterialMotion, ionicMaterialInk) {
    var vm = this;
    vm.arenaService = ArenasService;
    vm.arenas = ArenasService.arenas;
    vm.arenaMarkers = [];

    activate();

    function activate() {
      setMap();
      ionicMaterialInk.displayEffect();
    }

    function setMap() {
      vm.map = {
        center: {
          latitude: GeoService.position[0],
          longitude: GeoService.position[1]
        },
        zoom: 12,
        options: {
          disableDefaultUI: true,
          // styles: [{ 'stylers': [{ 'hue': '#ff1a00' }, { 'invert_lightness': true }, { 'saturation': -100 }, { 'lightness': 33 }, { 'gamma': 0.5 }] }, { 'featureType': 'water', 'elementType': 'geometry', 'stylers': [{ 'color': '#2D333C' }] }]
          styles: [{ 'featureType': 'administrative.country', 'elementType': 'geometry.stroke', 'stylers': [{ 'visibility': 'on' }, { 'color': '#1c99ed' }] }, { 'featureType': 'administrative.country', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#1f79b5' }] }, { 'featureType': 'administrative.province', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#6d6d6d' }, { 'visibility': 'on' }] }, { 'featureType': 'administrative.locality', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#555555' }] }, { 'featureType': 'administrative.neighborhood', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#999999' }] }, { 'featureType': 'landscape', 'elementType': 'all', 'stylers': [{ 'color': '#f2f2f2' }] }, { 'featureType': 'landscape.natural', 'elementType': 'geometry.fill', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'landscape.natural.landcover', 'elementType': 'geometry.fill', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.attraction', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.business', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.government', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.medical', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.park', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#e1eddd' }] }, { 'featureType': 'poi.place_of_worship', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.school', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'poi.sports_complex', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'road', 'elementType': 'all', 'stylers': [{ 'saturation': '-100' }, { 'lightness': '45' }] }, { 'featureType': 'road.highway', 'elementType': 'all', 'stylers': [{ 'visibility': 'simplified' }] }, { 'featureType': 'road.highway', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#009688' }] }, { 'featureType': 'road.highway', 'elementType': 'labels.icon', 'stylers': [{ 'visibility': 'on' }, { 'hue': '#009aff' }, { 'saturation': '100' }, { 'lightness': '5' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#009688' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'geometry.stroke', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'road.highway.controlled_access', 'elementType': 'labels.icon', 'stylers': [{ 'lightness': '1' }, { 'saturation': '100' }, { 'hue': '#009aff' }] }, { 'featureType': 'road.arterial', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#ffffff' }] }, { 'featureType': 'road.arterial', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#8a8a8a' }] }, { 'featureType': 'road.arterial', 'elementType': 'labels.icon', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'road.local', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#ffffff' }] }, { 'featureType': 'transit', 'elementType': 'all', 'stylers': [{ 'visibility': 'off' }] }, { 'featureType': 'transit.station.airport', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'transit.station.airport', 'elementType': 'geometry.fill', 'stylers': [{ 'lightness': '33' }, { 'saturation': '-100' }, { 'visibility': 'on' }] }, { 'featureType': 'transit.station.bus', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'transit.station.rail', 'elementType': 'all', 'stylers': [{ 'visibility': 'on' }] }, { 'featureType': 'water', 'elementType': 'all', 'stylers': [{ 'color': '#46bcec' }, { 'visibility': 'on' }] }, { 'featureType': 'water', 'elementType': 'geometry.fill', 'stylers': [{ 'color': '#4db4f8' }] }, { 'featureType': 'water', 'elementType': 'labels.text.fill', 'stylers': [{ 'color': '#ffffff' }] }, { 'featureType': 'water', 'elementType': 'labels.text.stroke', 'stylers': [{ 'visibility': 'off' }] }]
        },
        markersEvents: {
          click: function (marker, eventName, model) {
            vm.arenaService.arenaSelecionada = _.find(vm.arenas, { id: model.id });
            vm.map.window.show = true;
          }
        },
        window: {
          marker: {},
          show: false,
          closeClick: function () {
            this.show = false;
          },
          options: {} // define when map is ready
        }
      };
    }

  })

  .controller('ArenaDetailsCtrl', function (ArenasService, JogosService, $scope, $timeout, ReservasService, $stateParams, $ionicModal, ionicMaterialMotion, ionicMaterialInk, $ionicPopup) {
    var vm = this;
    vm.arena = ArenasService.arenaSelecionada;
    vm.album = ArenasService.getAlbum($stateParams.id);
    vm.quadras = ArenasService.getQuadrasArena(vm.arena.id);
    vm.estrutura = ArenasService.getEstrutura(vm.arena.id);
    vm.intervaloSelecionado = {};
    vm.horariosPorQuadra = [];
    vm.reservas = [];
    vm.onSelectCarousel = onSelectCarousel;
    vm.openConfirmacaoModal = openConfirmacaoModal;
    vm.openAlbumModal = openAlbumModal;
    vm.openQuadrasModal = openQuadrasModal;
    vm.openEstruturaModal = openEstruturaModal;

    activate();

    function activate() {
      vm.quadras.$loaded().then(function () {
        getReservas(new Date());
      });
      vm.carouselOptions1 = {
        carouselId: 'carousel-1',
        align: 'left',
        selectFirst: true,
        centerOnSelect: false,
        template: 'templates/misc/carousel-template.html'
      };
      vm.carouselData1 = createArray();
      $ionicModal.fromTemplateUrl('templates/modal/confirma-reserva.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modal = modal;
      });
    }

    function openEstruturaModal() {
      $ionicModal.fromTemplateUrl('templates/modal/estrutura-arena.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalEstrutura = modal;
        $scope.estrutura = vm.estrutura;
        modal.show();
      });
    }

    function openQuadrasModal() {
      $ionicModal.fromTemplateUrl('templates/modal/quadras-arena.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalQuadras = modal;
        $scope.quadras = vm.quadras;
        modal.show();
      });
    }

    function openAlbumModal() {
      $ionicModal.fromTemplateUrl('templates/modal/album-arena.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.modalAlbum = modal;
        $scope.albumArena = _.map(vm.album, function (val) {
          return {
            src: val.img,
            thumb: val.thumb
          }
        });
        modal.show();
      });
    }

    function createArray() {
      var arr = [];

      for (var i = 0; i < 10; i++) {
        var dat = new Date();
        dat.setDate(dat.getDate() + i);

        arr.push({
          id: i,
          display: moment(dat).format('ddd') + ' ' + dat.getDate(),
          val: dat / 1
        });
      }

      return arr;
    }

    function getReservas(date) {
      vm.intervaloSelecionado = getIntervaloDia(date);
      vm.reservas = ReservasService
        .getReservasDia(
        $stateParams.id,
        vm.intervaloSelecionado.start,
        vm.intervaloSelecionado.end)
        .$loaded().then(getHorariosLivres);
    }

    function onSelectCarousel(item) {
      vm.diaSelecionado = moment(item.val)._d;
      getReservas(vm.diaSelecionado);
    }

    function getHorariosLivres(reservas) {
      vm.reservas = reservas;
      vm.horariosPorQuadra = [];
      _.forEach(vm.quadras, function (quadra) {
        var horarios = getHorariosDia(quadra);
        vm.horariosPorQuadra.push({
          quadra: quadra,
          horarios: horarios
        });
      });
      vm.nenhumHorario = _.every(vm.horariosPorQuadra, function (val) {
        return val.horarios.length == 0;
      });
    }

    function getHorariosDia(quadra) {
      var diaSemana = moment(vm.intervaloSelecionado.start)._d.getDay() + '';
      var func = _.orderBy(_.filter(quadra.funcionamento, { dow: diaSemana }), 'start', 'asc');
      var horariosLivres = [];

      _.forEach(func, function (f) {
        var start = moment(moment(vm.intervaloSelecionado.start).format('DD/MM/YYYY') + f.start, 'DD/MM/YYYYhh:mm');
        var end = moment(moment(vm.intervaloSelecionado.start).format('DD/MM/YYYY') + f.start, 'DD/MM/YYYYhh:mm').add(1, 'h');
        var limite = moment(moment(vm.intervaloSelecionado.start).format('DD/MM/YYYY') + f.end, 'DD/MM/YYYYhh:mm');
        if (f.start > f.end) {
          limite.add(1, 'd');
        }

        while (end <= limite) {
          var horario = {
            start: start / 1,
            end: end / 1,
            preco: f.precoAvulso,
          };

          var horarioLivre = _.every(vm.reservas, function (r) {
            return !(
              r.start === horario.start ||
              r.end === horario.end ||
              r.start < horario.start && r.end > horario.start ||
              r.start > horario.start && horario.end > r.start
            );
          });

          if (horarioLivre && start._d >= new Date()) {
            horariosLivres.push(horario);
          }

          start.add(30, 'm');
          end.add(30, 'm');
        }

      });
      return horariosLivres;
    }

    function getIntervaloDia(date) {
      var startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      var endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      return {
        start: startOfDay / 1,
        end: endOfDay / 1
      };
    }

    function openConfirmacaoModal(horario, index) {
      vm.horarioSelecionado = horario.horarios[index];

      $scope.modalData = {
        arena: vm.arena.nome,
        horario: vm.horarioSelecionado,
        quadra: horario.quadra,
        duracao: 1,
        horarioExtraDisponivel: getHorarioExtraDisponivel()
      };
      $scope.SalvarReserva = function () {
        salvarNovaReserva();
      };
      $scope.modal.show();
    }

    function getHorarioExtraDisponivel() {
      var proximasReservas = _.orderBy(_.filter(vm.reservas, function (val) {
        return val.start >= vm.horarioSelecionado.end;
      }), 'start', 'asc');

      if (proximasReservas.length === 0) {
        return 2.5;
      }
      else {
        return moment.duration(moment(proximasReservas[0].start).diff(vm.horarioSelecionado.start)).asHours();
      }
    }

    function salvarNovaReserva() {
      var novaReserva = {
        tipo: 1,
        quadra: $scope.modalData.quadra.$id,
        responsavel: firebase.auth().currentUser.uid,
        start: vm.horarioSelecionado.start,
        end: moment(vm.horarioSelecionado.start).add($scope.modalData.duracao, 'h') / 1,
        saldoDevedor: $scope.modalData.horario.preco * $scope.modalData.duracao,
        saldoQuitado: 0,
        title: firebase.auth().currentUser.displayName
      };
      ReservasService.criarReservaAvulsa(novaReserva, vm.arena.id).then(function () {
        console.log('Reserva criada com sucesso!');
        getReservas(vm.diaSelecionado);
        $scope.modal.hide();
        openModalCriacaoPartida(novaReserva);
      }, function (error) {
        console.log(error, novaReserva, 'Ops!');
      });
    }

    function openModalCriacaoPartida(novaReserva) {
      var confirmPopup = $ionicPopup.confirm({
        title: 'Reserva criada com sucesso!',
        template: 'Crie uma partida para esta reserva e convide os seus amigos!',
        buttons: [{ 
          text: 'Cancelar',
          type: 'button-default',
          onTap: function (e) {
            e.preventDefault();
          }
        }, {
            text: 'Criar',
            type: 'button-positive',
            onTap: function (e) {
              novaReserva.local= {
                nome: vm.arena.nome,
                endereco: vm.arena.endereco,
                latitude: vm.arena.latitude,
                longitude: vm.arena.longitude
              };
              JogosService.novaPartidaModal = {
                  modal: {},
                  data: novaReserva
              };
              $ionicModal.fromTemplateUrl('templates/modal/criar-jogo.html', {
              }).then(function (modal) {
                JogosService.novaPartidaModal.modal = modal;
                modal.show();
              });
            }
          }]
      });
    }

    // Set Motion
    $timeout(function () {
      ionicMaterialMotion.slideUp({
        selector: '.slide-up'
      });
    }, 300);

    // Set Ink
    ionicMaterialInk.displayEffect();

  });
