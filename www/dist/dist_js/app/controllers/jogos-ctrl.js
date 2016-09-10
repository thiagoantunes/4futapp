/*jshint loopfunc: true */
(function () {
    'use strict';
    angular.module('main')
        .controller('JogosCtrl', JogosCtrl)
        .controller('MeusJogosCtrl', MeusJogosCtrl)
        .controller('MinhasReservasCtrl', MinhasReservasCtrl)
        .controller('ReservaCtrl', ReservaCtrl)
        .controller('NovaPartidaCtrl', NovaPartidaCtrl)
        .controller('JogosDetailCtrl', JogosDetailCtrl);

    JogosCtrl.$inject = ['$scope', '$rootScope', 'JogosService', '$ionicModal', '$window', 'ArenasService', '$ionicScrollDelegate', '$location', '$ionicHistory', 'GeoService', '$timeout'];
    MeusJogosCtrl.$inject = ['JogosService', 'UserService', 'ArenasService'];
    MinhasReservasCtrl.$inject = ['UserService', 'ReservasService', 'ArenasService'];
    ReservaCtrl.$inject = ['$scope', '$state', 'JogosService', 'UserService', 'ReservasService', 'ArenasService', 'GeoService', 'Enum', '$ionicModal', '$ionicPopup'];
    NovaPartidaCtrl.$inject = ['$scope', '$state', '$ionicHistory', 'Enum', 'UserService', 'ReservasService', 'JogosService', 'ArenasService', '$ionicModal', 'ionicTimePicker', 'ionicDatePicker', 'LocationService', '$ionicLoading', '$cordovaSocialSharing', '$window'];
    JogosDetailCtrl.$inject = ['$scope', '$state', '$stateParams', '$timeout', '$rootScope', '$ionicPlatform', '$ionicHistory', 'JogosService', 'UserService', '$ionicModal', 'GeoService', '$ionicLoading', '$window', '$ionicActionSheet', '$cordovaSocialSharing', '$ionicPopup', '$cordovaVibration'];

    function JogosCtrl($scope, $rootScope, JogosService, $ionicModal, $window, ArenasService, $ionicScrollDelegate, $location, $ionicHistory, GeoService, $timeout) {
        var vm = this;
        vm.jogosRegiao = JogosService.jogosRegiao;
        vm.jogosService = JogosService;
        vm.orderByConfirmacao = orderByConfirmacao;
        vm.goBack = goBack;
        activate();

        $scope.$on('$ionicView.enter', function () {
            if (window.cordova) {
                StatusBar.backgroundColorByName('black');
            }
        });

        function activate() {
            if ($rootScope.map) {
                var mapPosition = new plugin.google.maps.LatLng(GeoService.position[0], GeoService.position[1]);

                $timeout(function () {
                    $rootScope.map.setDiv(document.getElementById("map-jogos"));

                    _.forEach(ArenasService.arenasMarkers, function (arenaMarker) {
                        arenaMarker.setVisible(false);
                    });

                    _.forEach(JogosService.jogosRegiaoMarkers, function (jogoMarker) {
                        jogoMarker.setVisible(true);
                    });

                    $rootScope.map.animateCamera({
                        'target': mapPosition,
                        'tilt': 0,
                        'zoom': 14,
                        'bearing': 0,
                        'duration': 2000
                        // = 2 sec.
                    });
                }, 100);
            }
        }

        function orderByConfirmacao(jogador) {
            if (jogador.confirmado === true) {
                return 1;
            }
            else if (jogador.confirmado === undefined) {
                return 2;
            }
            else if (jogador.confirmado === false) {
                return 3;
            }
        }

        function goToAnchor(x) {
            $location.hash('anchor' + x);
            $ionicScrollDelegate.anchorScroll(true);
        }

        function goBack() {
            if (window.cordova) {
                StatusBar.backgroundColorByHexString('#87c202');
            }
            $ionicHistory.goBack();
        }

    }

    function MeusJogosCtrl(JogosService, UserService, ArenasService) {
        var vm = this;
        vm.jogosService = JogosService;
        vm.jogos = UserService.jogos;
        vm.orderByConfirmacao = orderByConfirmacao;
        vm.isAndroid = isAndroid;

        vm.jogoHoje = jogoHoje;
        vm.jogoAlgumasHoras = jogoAlgumasHoras;
        vm.proximosJogos = proximosJogos;
        vm.jogosAnteriores = jogosAnteriores;
        vm.numeroPartidasPassadas = numeroPartidasPassadas;
        vm.jogoEmAndamento = jogoEmAndamento;
        vm.getLength = getLength;

        activate();

        function activate() {
        }

        function orderByConfirmacao(jogador) {
            if (jogador.confirmado === true) {
                return 1;
            }
            else if (jogador.confirmado === undefined) {
                return 2;
            }
            else if (jogador.confirmado === false) {
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
            return duration.asHours() < 0 && duration.asHours() >= -1.5;
        }

        function proximosJogos(jogo) {
            var date = moment(jogo.inicio);
            var duration = moment.duration(date.diff(moment()));
            return duration.asHours() >= -1.5;
        }

        function jogosAnteriores(jogo) {
            var date = moment(jogo.inicio);
            var duration = moment.duration(date.diff(moment()));
            return duration.asHours() < -1.5;
        }

        function numeroPartidasPassadas() {
            return _.filter(vm.jogos, jogosAnteriores).length;
        }

        function getLength(obj) {
            if (obj) {
                return Object.keys(obj).length;
            }
        }

    }

    function MinhasReservasCtrl( UserService, ReservasService, ArenasService) {
        var vm = this;
        vm.minhasReservas = UserService.reservas;
        vm.openReservamodal = openReservamodal;

        activate();

        function activate() {
        }

        function openReservamodal(reserva) {
            var arena = _.find(ArenasService.arenas, { '$id': reserva.arenaId });
            ReservasService.openReservaModal(reserva, arena);
        }

    }

    function NovaPartidaCtrl($scope, $state, $ionicHistory, Enum, UserService, ReservasService, JogosService, ArenasService, $ionicModal, ionicTimePicker, ionicDatePicker, LocationService, $ionicLoading, $cordovaSocialSharing, $window) {
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
            vm.novaPartida.data.local = {
                id: vm.novaPartida.localSelecionado.$id,
                nome: vm.novaPartida.localSelecionado.nome,
                endereco: vm.novaPartida.localSelecionado.endereco,
                arenaComercial: vm.novaPartida.localSelecionado.arenaComercial ? true : false
            };
            var novaPartidaData = {
                partida: vm.novaPartida.data,
                coords: [vm.novaPartida.localSelecionado.latitude, vm.novaPartida.localSelecionado.longitude],
                arenaId: vm.novaPartida.arenaReserva,
                jogadores: vm.jogadores,
                times: vm.times
            };
            $ionicLoading.show({ template: 'Carregando...' });
            JogosService.criarJogo(novaPartidaData)
                .then(function (jogoId) {
                    //goBack();
                    JogosService.getJogo(jogoId).$loaded().then(function (val) {
                        $ionicLoading.hide();
                        JogosService.jogoSelecionado = val;
                        JogosService.jogoSelecionado.novoJogo = true;
                        $state.go('app.detalhes-jogo', { id: jogoId });
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
            };
            $ionicLoading.show({ template: 'Carregando...' });
            JogosService.editarJogo(partida)
                .then(function (jogoId) {
                    JogosService.getJogo(jogoId).$loaded().then(function (val) {
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
                            if ((typeof (val) !== 'undefined')) {
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
                $ionicModal.fromTemplateUrl('modal/selecionar-local.html', {
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
                            };
                            $scope.modalCriaLocal.hide();
                            $scope.modalLocal.hide();
                        }, function (error) {
                            console.log('Erro ao cadastrar novo local');
                        });
                };
            });
            $ionicModal.fromTemplateUrl('modal/criar-local.html', {
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

    }

    function ReservaCtrl($scope, $state, JogosService, UserService, ReservasService, ArenasService, GeoService, Enum, $ionicModal, $ionicPopup) {
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
                            closeModal();
                        }
                    }]
            });
        }

        function criaPartida() {
            JogosService.novaPartida = {
                data: {
                    reserva: vm.reservaSelecionada.$id,
                    inicio: vm.reservaSelecionada.start,
                },
                arenaReserva: vm.reservaSelecionada.arenaId,
                localSelecionado: {
                    nome: vm.reservaSelecionada.arena.nome,
                    endereco: vm.reservaSelecionada.arena.endereco,
                    latitude: vm.reservaSelecionada.arena.latitude,
                    longitude: vm.reservaSelecionada.arena.longitude
                }
            };

            $state.go('app.criar-partida');
            closeModal();
        }

        function idParaPartida() {
            closeModal();
            var partida = _.find(UserService.jogos, { '$id': vm.reservaSelecionada.partida });
            JogosService.jogoSelecionado = partida;
            $state.go('app.detalhes-jogo', { '$id': partida.$id });
        }

        function isAndroid() {
            return ionic.Platform.isAndroid();
        }

        function closeModal() {
            ReservasService.reservaSelecionada.modal.hide();
        }

        function setMap() {
            vm.showDetails = false;
            JogosService.jogosRegiaoMap = {
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
            if (status === 'cancelado') {
                return 'Reserva cancelada';
            }
            else if (status === 'agendado') {
                return 'Agendamento confirmado';
            }
            else if (status === 'aguardando-confirmacao') {
                return 'Aguardando confirmação';
            }

        }

    }

    function JogosDetailCtrl($scope, $state, $stateParams, $timeout, $rootScope, $ionicPlatform, $ionicHistory, JogosService, UserService, $ionicModal, GeoService, $ionicLoading, $window, $ionicActionSheet, $cordovaSocialSharing, $ionicPopup, $cordovaVibration) {
        var vm = this;
        vm.jogo = JogosService.jogoSelecionado;
        vm.amigos = UserService.amigos;
        vm.meuId = firebase.auth().currentUser.uid;
        vm.atualizaPresenca = atualizaPresenca;
        vm.getPresencaClass = getPresencaClass;
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
        vm.jogoEmAndamento = jogoEmAndamento;
        vm.jogoAgendado = jogoAgendado;
        vm.jogoEncerrado = jogoEncerrado;
        vm.cancelarPartida = cancelarPartida;
        vm.editarPartida = editarPartida;
        vm.emitirChamado = emitirChamado;
        vm.finalizarPartida = finalizarPartida;

        vm.onTimeout = onTimeout;
        vm.startTimer = startTimer;
        vm.stopTimer = stopTimer;
        vm.pauseTimer = pauseTimer;
        vm.humanizeDurationTimer = humanizeDurationTimer;
        vm.addTime = addTime;

        activate();

        function activate() {
            $ionicModal.fromTemplateUrl('modal/convidar-amigos.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal = modal;
            });

            JogosService.getAndamentoJogo(vm.jogo.$id).$bindTo($scope, 'andamentoJogo').then(function () {
                if ($scope.andamentoJogo.started) {
                    mytimeout = $timeout(onTimeout, 1000);
                }
                else if ($scope.andamentoJogo.paused) {
                    $scope.timer = $scope.andamentoJogo.pausedTimer;
                }
                else {
                    $scope.timer = $scope.andamentoJogo.timeForTimer;
                }
            });

            $scope.$watch('andamentoJogo', function () {
                if ($scope.andamentoJogo.started) {
                    mytimeout = $timeout(onTimeout, 1000);
                }
                else {
                    $timeout.cancel(mytimeout);
                }
            });
        }

        function jogoEmAndamento() {
            var date = moment(vm.jogo.inicio);
            var duration = moment.duration(date.diff(moment()));
            return duration.asHours() < 0 && duration.asHours() >= -1.5 && $scope.andamentoJogo && vm.jogo.status !== 'encerrado';
        }

        function jogoAgendado() {
            return !jogoEmAndamento() && !jogoEncerrado();
        }

        function jogoEncerrado() {
            var date = moment(vm.jogo.inicio);
            var duration = moment.duration(date.diff(moment()));
            return duration.asHours() < -1.5 || vm.jogo.status === 'encerrado';
        }

        function finalizarPartida() {
            vm.jogo.status = 'encerrado';
        }

        function atualizaPresenca(bool) {
            if (vm.jogo.jogadores[vm.meuId]) {
                if (vm.jogo.jogadores[vm.meuId].confirmado !== undefined) {
                    vm.jogo.jogadores[vm.meuId].confirmado = bool === vm.jogo.jogadores[vm.meuId].confirmado ? null : bool;
                }
                else {
                    vm.jogo.jogadores[vm.meuId].confirmado = bool;
                }
                vm.jogo.jogadores[firebase.auth().currentUser.uid].confirmado = vm.jogo.jogadores[vm.meuId].confirmado;
                vm.jogo.$save();
            }
            else {
                JogosService.solicitarPresenca(vm.jogo).then(function (val) {
                    vm.jogo.jogadores[vm.meuId] = val;
                });
            }
        }

        function getPresencaClass(confirmacao) {
            var val = 'icon ion-ios-help-outline';
            if (confirmacao !== undefined) {
                if (confirmacao) {
                    val = 'icon ion-ios-checkmark positive';
                }
                else {
                    val = 'icon ion-ios-close assertive';
                }
            }
            return val;
        }

        function checkOrganizador() {
            return vm.jogo.responsavel === firebase.auth().currentUser.uid;
        }

        function convidarAmigo(amigo) {
            JogosService.convidarAmigo(amigo, vm.jogo.$id);
        }

        function desconvidarAmigo(amigo) {
            JogosService.desconvidarAmigo(amigo, vm.jogo.$id);
        }

        function orderByConfirmacao(jogador) {
            if (jogador.confirmado === true) {
                return 1;
            }
            else if (jogador.confirmado === undefined) {
                return 2;
            }
            else if (jogador.confirmado === false) {
                return 3;
            }
        }

        function getNumJogadores(confirmado) {
            if (confirmado === true) {
                return _.filter(vm.jogo.jogadores, function (val) {
                    return val.confirmado === true && !val.aguardandoConfirmacao;
                }).length;
            }
            else if (confirmado === false) {
                return _.filter(vm.jogo.jogadores, function (val) {
                    return val.confirmado === false && !val.aguardandoConfirmacao;
                }).length;
            }
            else {
                return _.filter(vm.jogo.jogadores, function (val) {
                    return val.confirmado === undefined && !val.aguardandoConfirmacao;
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
                $state.go('app.detalhes-jogador', { id: jogador });
            });
        }

        function openChat() {
            $state.go('app.chat', { id: vm.jogo.$id, tipoChat: 'partida' });
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
                $state.go('app.criar-partida');
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

        function emitirChamado() {
            var confirmPopup = $ionicPopup.show({
                title: 'Emitir Chamado',
                cssClass: 'dark-popup',
                template: '<div><img style="display: block; margin: auto; padding-top:20px; margin-bottom: 30px;" src="img/ilustracoes/apito.png" alt=""><p style="text-align:center">Faltam poucas pessoas para completar a pelada? Emita um chamado para os jogadores que estão na redondeza.</p></div>',
                buttons: [
                    { text: 'Cancelar', type: 'button-light', },
                    {
                        text: '<b>Emitir</b>',
                        type: 'button-positive',
                        onTap: function (e) {
                            $ionicLoading.show({ template: 'Carregando...' });
                            JogosService.cancelarJogo(vm.jogo).then(function () {
                                $ionicLoading.hide();
                                var alertPopup = $ionicPopup.alert({
                                    title: 'Chamado emitido!',
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

        //Partida iniciada
        var mytimeout = null;
        function onTimeout() {
            if ($scope.timer === 0) {
                $scope.$broadcast('timer-stopped', 0);
                $timeout.cancel(mytimeout);
                return;
            }
            $scope.timer = Math.round(moment.duration(moment($scope.andamentoJogo.refTime).diff(moment())).asSeconds());
            mytimeout = $timeout(onTimeout, 1000);
        }

        function startTimer() {
            $scope.andamentoJogo.started = true;
            if (!$scope.andamentoJogo.paused) {
                $scope.andamentoJogo.startedTime = moment()._d.getTime();
                $scope.andamentoJogo.refTime = moment().add($scope.andamentoJogo.timeForTimer, 'seconds')._d.getTime();
            }
            else {
                $scope.andamentoJogo.paused = false;
                $scope.andamentoJogo.refTime = moment().add($scope.timer, 'seconds')._d.getTime();
            }
        }

        function stopTimer(closingModal) {
            $scope.timer = $scope.andamentoJogo.timeForTimer;
            $scope.andamentoJogo.started = false;
            $scope.andamentoJogo.paused = false;
            $timeout.cancel(mytimeout);
        }

        function pauseTimer() {
            $scope.$broadcast('timer-stopped', $scope.timer);
            $scope.andamentoJogo.pausedTimer = $scope.timer;
            $scope.andamentoJogo.started = false;
            $scope.andamentoJogo.paused = true;
        }

        function addTime() {
            $scope.andamentoJogo.timeForTimer = $scope.andamentoJogo.timeForTimer + 60;
            $scope.andamentoJogo.refTime = moment($scope.andamentoJogo.refTime).add(60, 'seconds')._d.getTime();
        }

        function humanizeDurationTimer(input, units) {
            // units is a string with possible values of y, M, w, d, h, m, s, ms
            if (input === 0) {
                return 0;
            } else {
                var duration = moment().startOf('day').add(input, units);
                var format = "";
                if (duration.hour() > 0) {
                    format += "H[h] ";
                }
                if (duration.minute() > 0) {
                    format += "m[m] ";
                }
                if (duration.second() > 0) {
                    format += "s[s] ";
                }
                return duration.format(format);
            }
        }

        $scope.$on('timer-stopped', function (event, remaining) {
            if (remaining === 0) {
                $scope.timer = $scope.andamentoJogo.timeForTimer;
                $scope.andamentoJogo.done = true;
                $scope.andamentoJogo.started = false;
                $scope.andamentoJogo.paused = false;
                if (!$scope.andamentoJogo.tempos) {
                    $scope.andamentoJogo.tempos = [];
                }
                $scope.andamentoJogo.tempos.push({
                    inicio: $scope.andamentoJogo.startedTime,
                    fim: new Date().getTime()
                });
                if (window.cordova) {
                    $cordovaVibration.vibrate(200);
                }
                var timerStoppedPopup = $ionicPopup.show({
                    title: 'Acabou!!!',
                    cssClass: 'dark-popup',
                    template: '<div><img style="display: block; margin: auto; margin-bottom: 30px;" src="img/ilustracoes/cronometro.png" alt=""><p style="text-align:center"></p></div>',
                    buttons: [
                        {
                            text: 'COMEÇAR OUTRA',
                            type: 'button-positive',
                            onTap: function (e) {

                            }
                        }
                    ]
                });
            }

        });


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

    }

} ());