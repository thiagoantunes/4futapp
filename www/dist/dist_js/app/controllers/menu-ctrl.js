(function () {
  'use strict';
  angular.module('main')
    .controller('MenuCtrl', MenuCtrl);

    MenuCtrl.$inject = ['$state', '$window', '$rootScope', 'GeoService', 'ArenasService', 'UserService', 'ReservasService', 'JogosService', 'TimesService', '$ionicHistory', '$cordovaNetwork'];

    function MenuCtrl($state, $window, $rootScope, GeoService, ArenasService, UserService, ReservasService, JogosService, TimesService, $ionicHistory, $cordovaNetwork) {
        var vm = this;
        vm.user = UserService.meuPerfil;

        if (window.cordova) {
            if ($cordovaNetwork.isOffline()) {
                $window.alert('Voce está offline');
            }

            // listen for Online event
            $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
                $window.alert('Sem conexão com a internet.');
            });

            // listen for Offline event
            $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
                //$window.alert('Voce está offline');
            });
        }

        ReservasService.getMinhasReservas();
        JogosService.getMeusJogos();
        UserService.getMeusAmigos();
        UserService.getNotificacoes();
        TimesService.getMeusTimes();

        GeoService.getLocation().then(function (location) {
            console.log(location);
        }, function (err) {
            $window.alert(err.message);
            console.log(err);
        });

        UserService.notificacoesNaoLidas.$loaded().then(function (val) {
            vm.notificacoes = UserService.notificacoesNaoLidas;
        });

        vm.logOut = function () {
            firebase.auth().signOut().then(function () {
                $state.go('login');
            }, function (error) {
                console.log(error);
            });
        };

    }

} ());