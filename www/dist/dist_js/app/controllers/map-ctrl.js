/*jshint loopfunc: true */
(function () {
    'use strict';
    angular.module('main')
        .controller('MapCtrl', MapCtrl);

    MapCtrl.$inject = ['$scope', '$rootScope', '$timeout', 'ArenasService', 'JogosService', '$ionicHistory', '$window', 'GeoService', '$ionicSideMenuDelegate', '$ionicModal'];

    function MapCtrl($scope, $rootScope, $timeout, ArenasService, JogosService, $ionicHistory, $window, GeoService, $ionicSideMenuDelegate, $ionicModal) {
        var vm = this;
        vm.arenaService = ArenasService;
        vm.jogosService = JogosService;
        vm.arenas = ArenasService.arenas;
        vm.jogosRegiao = JogosService.jogosRegiao;
        vm.isDevice = isDevice;
        vm.acharNoMapa = acharNoMapa;
        vm.toggleLeftSideMenu = toggleLeftSideMenu;

        vm.orderByConfirmacao = orderByConfirmacao;
        vm.jogoHoje = jogoHoje;
        vm.jogoAlgumasHoras = jogoAlgumasHoras;
        vm.jogoEmAndamento = jogoEmAndamento;

        vm.openFiltroModal = openFiltroModal;
        vm.toggleFiltroArenas = toggleFiltroArenas;
        vm.toggleFiltroJogos = toggleFiltroJogos;

        activate();

        function activate() {
            vm.filtro = {
                arenas: true,
                jogos: true
            };

            if (isDevice()) {
                initMap();
            }
            else {
                GeoService.getLocation().then(function (location) {
                    ArenasService.getArenas();
                    JogosService.getJogosRegiao();
                });
            }
        }

        function initMap() {
            if (!$rootScope.map) {
                if(GeoService.position.length === 0){
                    GeoService.getLocation().then(function (location) {
                        GeoService.initMap(document.getElementById("map-arenas"));
                    });
                }
                else{
                    GeoService.initMap(document.getElementById("map-arenas"));
                }
            }
        }

        function openFiltroModal() {
            // $ionicModal.fromTemplateUrl('modal/filtro-mapa.html', {
            //     scope: $scope,
            //     animation: 'slide-in-up'
            // }).then(function (modal) {
            //     vm.filtroModal = modal;
            //     modal.show();
            // });

            vm.filtro.arenas = false;
            var markersArena = _.filter($rootScope.markers, {'tipo' : 'arena'});
            if(vm.filtro.arenas) {
                _.forEach(markersArena, function (marker){
                    marker.setVisible(true);
                });
            }
            else {
                 $timeout(function () {
                    _.forEach($rootScope.markers, function(jogoMarker){		
                        if(jogoMarker.tipo == 'arena'){
                            jogoMarker.setVisible(false);
                        }		
                   });
 
                }, 100);

                
            }
        }

        function toggleFiltroArenas() {
            var markersArena = _.filter($rootScope.markers, {'tipo' : 'arena'});
            if(vm.filtro.arenas) {
                _.forEach(markersArena, function (marker){
                    marker.setVisible(true);
                });
            }
            else {
                 _.forEach(markersArena, function (marker){
                    marker.setVisible(false);
                });
            }
        }

        function toggleFiltroJogos() {
            var markersJogos = _.filter($rootScope.markers, {'tipo' : 'jogo'});
            if(vm.filtro.jogos) {
                _.forEach(markersJogos, function (marker){
                    marker.setVisible(true);
                });
            }
            else {
                 _.forEach(markersJogos, function (marker){
                    marker.setVisible(false);
                });
            }
        }

        function acharNoMapa(marker) {
            var mapPosition = new plugin.google.maps.LatLng(marker.data.latitude, marker.data.longitude);
            marker.showInfoWindow();
            $rootScope.map.animateCamera({
                'target': mapPosition,
                'tilt': 0,
                'zoom': 14,
                'bearing': 0,
                'duration': 500
                // = 2 sec.
            });
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

        function isDevice() {
            return window.cordova;
        }

        function toggleLeftSideMenu() {
            if ($ionicSideMenuDelegate.isOpen()) {
                $rootScope.hideMenu = true;
            }
            else {
                $rootScope.hideMenu = false;
            }
            $ionicSideMenuDelegate.toggleLeft();
        }

    }

} ());
