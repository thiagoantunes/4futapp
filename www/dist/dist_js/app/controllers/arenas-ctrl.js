/*jshint loopfunc: true */
(function () {
    'use strict';
    angular.module('main')
        .controller('ArenasCtrl', ArenasCtrl)
        .controller('ArenaDetailsCtrl', ArenaDetailsCtrl);

    ArenasCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'ArenasService', 'JogosService', '$ionicHistory', '$window', 'GeoService'];
    ArenaDetailsCtrl.$inject = ['ArenasService', 'UserService', 'GeoService', 'JogosService', 'SmsVerify', '$scope', '$timeout', 'ReservasService', '$stateParams', '$ionicModal', 'ionicMaterialMotion', 'ionicMaterialInk', '$ionicPopup', '$ionicHistory', '$ionicLoading', '$window'];

    function ArenasCtrl($scope, $rootScope, $timeout, ArenasService, JogosService, $ionicHistory, $window, GeoService) {
        var vm = this;
        vm.arenaService = ArenasService;
        vm.arenas = ArenasService.arenas;

        vm.jogosService = JogosService;
        vm.goBack = goBack;
        vm.isDevice = isDevice;

        activate();

        $scope.$on('$ionicView.enter', function () {
            if (window.cordova) {
                StatusBar.backgroundColorByName('black');
            }
        });

        function activate() {
            initMap();
        }

        function initMap() {
            console.log('Getting map');
            var mapPosition = new plugin.google.maps.LatLng(GeoService.position[0], GeoService.position[1]);
            var mapParams = {
                'backgroundColor': '#ffffff',
                'mapType': plugin.google.maps.MapTypeId.ROADMAP,
                'controls': {
                    'compass': false,
                    'myLocationButton': false,
                    'indoorPicker': true,
                    'zoom': false
                    // Only for Android
                },
                'gestures': {
                    'scroll': true,
                    'tilt': false,
                    'rotate': true,
                    'zoom': true,
                },
                'camera': {
                    'latLng': mapPosition,
                    'tilt': 0,
                    'zoom': 5,
                    'bearing': 0
                }

            };
            $timeout(function () {
                var map = plugin.google.maps.Map.getMap(document.getElementById("map-arenas"), mapParams);
                map.on(plugin.google.maps.event.MAP_READY, function (map) {
                    console.log('Map loaded');
                    $rootScope.map = map;
                    map.animateCamera({
                        'target': mapPosition,
                        'tilt': 0,
                        'zoom': 14,
                        'bearing': 0,
                        'duration': 2000
                        // = 2 sec.
                    });
                    ArenasService.getArenas();
                    JogosService.getJogosRegiao();
                    $rootScope.map.addEventListener(plugin.google.maps.event.CAMERA_CHANGE, GeoService.onMapCameraChanged);
                });
            }, 500);
        }

        function isDevice() {
            return window.cordova;
        }

        function goBack() {
            if (window.cordova) {
                StatusBar.backgroundColorByHexString('#87c202');
            }
            $ionicHistory.goBack();
        }

    }

    function ArenaDetailsCtrl(ArenasService, UserService, GeoService, JogosService, SmsVerify, $scope, $timeout, ReservasService, $stateParams, $ionicModal, ionicMaterialMotion, ionicMaterialInk, $ionicPopup, $ionicHistory, $ionicLoading, $window) {
        var vm = this;
        vm.arena = ArenasService.arenaSelecionada;
        vm.album = ArenasService.getAlbum($stateParams.id);
        vm.quadras = ArenasService.getQuadrasArena(vm.arena.$id);
        vm.estrutura = ArenasService.getEstrutura(vm.arena.$id);
        vm.intervaloSelecionado = {};
        vm.horariosPorQuadra = [];
        vm.reservas = [];
        vm.onSelectCarousel = onSelectCarousel;
        vm.openConfirmacaoModal = openConfirmacaoModal;
        vm.openAlbumModal = openAlbumModal;
        vm.openQuadrasModal = openQuadrasModal;
        vm.openEstruturaModal = openEstruturaModal;
        vm.isAndroid = isAndroid;
        vm.navigateTo = navigateTo;
        vm.verificarCodigo = verificarCodigo;
        vm.goBack = goBack;

        activate();

        function activate() {

            UserService.getUserProfile(firebase.auth().currentUser.uid).$bindTo($scope, 'currentUser');

            vm.quadras.$loaded().then(function () {
                getReservas(new Date());
            });
            vm.carouselOptions1 = {
                carouselId: 'carousel-1',
                align: 'left',
                selectFirst: true,
                centerOnSelect: false,
                template: 'misc/carousel-template.html'
            };
            vm.carouselData1 = createArray();
        }

        function goBack() {
            $ionicHistory.goBack();
        }

        function openEstruturaModal() {
            $ionicModal.fromTemplateUrl('modal/estrutura-arena.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modalEstrutura = modal;
                $scope.estrutura = vm.estrutura;
                modal.show();
            });
        }

        function openQuadrasModal() {
            $ionicModal.fromTemplateUrl('modal/quadras-arena.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modalQuadras = modal;
                $scope.quadras = vm.quadras;
                modal.show();
            });
        }

        function openAlbumModal() {
            $ionicModal.fromTemplateUrl('modal/album-arena.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modalAlbum = modal;
                $scope.albumArena = _.map(vm.album, function (val) {
                    return {
                        src: val.img,
                        thumb: val.thumb
                    };
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
                return val.horarios.length === 0;
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
                confirmarReserva();
            };

            $ionicModal.fromTemplateUrl('modal/confirma-reserva.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
                $scope.modal.show();
            });
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

        function isAndroid() {
            return ionic.Platform.isAndroid();
        }

        function navigateTo() {
            GeoService.navigateTo(vm.arena.endereco);
        }

        function confirmarReserva() {
            var myPopup = $ionicPopup.show({
                template: '<input style="text-align: center; font-weight: bold; font-size: 1.4em;" type="text" ng-model="currentUser.telefone" ui-br-phone-number>',
                title: 'Telefone para confirmação',
                subTitle: 'Enviaremos um código para confirmar sua reserva',
                scope: $scope,
                buttons: [
                    { text: 'Cancelar' },
                    {
                        text: '<b>Enviar</b>',
                        type: 'button-positive',
                        onTap: function (e) {
                            if (!$scope.currentUser.telefone) {
                                e.preventDefault();
                            } else {
                                salvarNovaReserva();
                                //enviarCodigoVerificacao();
                            }
                        }
                    },
                ]
            });
        }

        function enviarCodigoVerificacao() {
            vm.verificacaoReserva = {};
            $ionicModal.fromTemplateUrl('modal/codigo-verificacao.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modalVerificacao = modal;
                $scope.addPin = function (value) {
                    if (vm.verificacaoReserva.code.length < 4) {
                        vm.verificacaoReserva.code = vm.verificacaoReserva.code + value;
                    }
                };
                $scope.deletePin = function () {
                    if (vm.verificacaoReserva.code.length > 0) {
                        vm.verificacaoReserva.code = vm.verificacaoReserva.code.substring(0, vm.verificacaoReserva.code.length - 1);
                    }
                };
                $scope.modalVerificacao.show();
            });
            $ionicLoading.show({ template: 'Carregando...' });
            SmsVerify.numberVerify({ Number: '55' + $scope.currentUser.telefone, brand: 'Rei da Quadra' }, function (data) {
                $ionicLoading.hide();
                console.log(data);
                vm.verificacaoReserva = {
                    requestId: data.request_id,
                    code: ''
                };
            }, function (err) {
                console.log(err);
                $ionicLoading.hide();
                $window.alert('Erro ao enviar mensagem de verificação. Tente novamente mais tarde.');
            });
        }

        function verificarCodigo() {
            $ionicLoading.show({ template: 'Carregando...' });
            SmsVerify.numberVerifyCheck(vm.verificacaoReserva, function (verification) {
                $ionicLoading.hide();
                console.log(verification);
                if (verification.status === 0) {
                    salvarNovaReserva();
                    $scope.modalVerificacao.hide();
                }
            }, function (err) {
                console.log(err);
                $ionicLoading.hide();
                $window.alert('Erro ao verificar código. Tente novamente mais tarde.');
            });
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
                title: firebase.auth().currentUser.displayName,
                status: 'agendado'
            };
            $ionicLoading.show({ template: 'Carregando...' });
            ReservasService.criarReservaAvulsa(novaReserva, vm.arena.$id).then(function (reserva) {
                $ionicLoading.hide();
                if (vm.arena.criacaoPartidaAndamento) {
                    JogosService.novaPartida.data.reserva = reserva.$id;
                    JogosService.novaPartida.data.dia = moment(reserva.start).format('DD/MM/YYYY');
                    JogosService.novaPartida.data.hora = moment(reserva.start).format('HH:mm');
                    JogosService.novaPartida.arenaReserva = vm.arena.$id;
                    JogosService.novaPartida.arenaReservaCallback = true;
                    JogosService.novaPartida.localSelecionado = {
                        nome: vm.arena.nome,
                        endereco: vm.arena.endereco,
                        latitude: vm.arena.latitude,
                        longitude: vm.arena.longitude
                    };

                    $scope.modal.hide();
                    $ionicHistory.goBack();
                }
                else {
                    console.log('Reserva criada com sucesso!');
                    getReservas(vm.diaSelecionado);
                    $scope.modal.hide();
                    reserva.novaReserva = true;
                    ReservasService.openReservaModal(reserva, vm.arena);
                }
            }, function (error) {
                $ionicLoading.hide();
                $window.alert('Ops! ' + error);
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

    }

} ());
