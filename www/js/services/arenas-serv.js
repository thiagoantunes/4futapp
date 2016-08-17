/*global GeoFire*/
'use strict';
angular.module('main')
    .factory('ArenasService', function(Ref, $timeout, $firebaseArray, $firebaseObject, $q) {
        var service = {
            ref: Ref.child('arenas'),
            refArenaBasica: Ref.child('arenasBasicas'),
            arenas: [],
            arenasBasicas: [],
            geoFire: new GeoFire(Ref.child('arenasLocalizacao')),
            geoArenaBasica: new GeoFire(Ref.child('arenasBasicasLocalizacao')),
            geoQuery: {},
            geoArenasBasicasQuery: {},

            getArenas: getArenas,
            getArena: getArena,
            getQuadrasArena: getQuadrasArena,
            getAlbum: getAlbum,
            getEstrutura: getEstrutura,
            getArenasBasicas: getArenasBasicas,
            criaArenaBasica: criaArenaBasica,
            getQuadraArena: getQuadraArena,
            getArenaLocation: getArenaLocation,
            arenaSelecionada: null
        };

        return service;

        function getArenas() {
            service.geoQuery.on('key_entered', function(key, location, distance) {
                service.ref.child(key).once('value').then(function(snapshot) {
                    var arena = snapshot.val();
                    arena.distance = distance;
                    arena.$id = key;
                    arena.latitude = location[0];
                    arena.longitude = location[1];
                    arena.icon = 'img/pin.png';
                    $timeout(function() {
                        service.arenas.push(arena);
                    });
                });
            });
        }

        function getArena(id) {
            return $firebaseObject(service.ref.child(id));
        }

        function getQuadrasArena(arena) {
            return $firebaseArray(Ref.child('arenasQuadras/' + arena));
        }

        function getQuadraArena(arenaId, quadraId) {
            return $firebaseObject(Ref.child('arenasQuadras/' + arenaId + '/' + quadraId));
        }

        function getArenaLocation(arenaId) {
            return $firebaseObject(Ref.child('arenasLocalizacao/' + arenaId));
        }

        function getAlbum(arena) {
            return $firebaseArray(Ref.child('arenasAlbuns/' + arena));
        }

        function getEstrutura(arena) {
            return $firebaseArray(Ref.child('arenasEstrutura/' + arena).orderByChild('ativo').startAt(true).endAt(true));
        }

        function criaArenaBasica(nomeLocal, coords, endereco) {
            var deferred = $q.defer();
            var key = service.refArenaBasica.push().key;
            service.refArenaBasica.child(key).set({
                endereco: endereco,
                nome: nomeLocal
            }).then(function() {
                service.geoArenaBasica.set(key, coords).then(function() {
                    deferred.resolve(key);
                }, function(error) {
                    deferred.reject('Erro ao cadastrar novo local');
                });
            });

            return deferred.promise;
        }

        function getArenasBasicas() {
            service.geoArenasBasicasQuery.on('key_entered', function(key, location, distance) {
                service.refArenaBasica.child(key).once('value').then(function(snapshot) {
                    if (snapshot.val()) {
                        var arena = snapshot.val();
                        arena.$id = key;
                        arena.latitude = location[0];
                        arena.longitude = location[1];
                        $timeout(function() {
                            service.arenasBasicas.push(arena);
                        });
                    }
                });
            });
        }

    })

    .factory('GeoService', function($q, $ionicPlatform, ArenasService, JogosService, TimesService) {
        var service = {
            position: [],

            getPosition: getPosition,
            navigateTo: navigateTo
        };

        return service;

        function getPosition() {
            var deferred = $q.defer();
            var posOptions = { timeout: 30000 };
            var watchOptions = { timeout: 3000 };
            //$ionicPlatform.ready(function () {
                navigator.geolocation.getCurrentPosition(function(position) {
                    service.position = [position.coords.latitude, position.coords.longitude];

                    ArenasService.geoQuery = ArenasService.geoFire.query({
                        center: service.position,
                        radius: 100
                    });

                    ArenasService.geoArenasBasicasQuery = ArenasService.geoArenaBasica.query({
                        center: service.position,
                        radius: 100
                    });

                    JogosService.geoQuery = JogosService.geoFire.query({
                        center: service.position,
                        radius: 100
                    });

                    TimesService.geoQuery = TimesService.geoFire.query({
                        center: service.position,
                        radius: 100
                    });

                    deferred.resolve(service.position);
                }, function (err) {
                    $window.alert('Ative a localizaçao');
                }, posOptions);

                navigator.geolocation.watchPosition(function(position) {
                    service.position = [position.coords.latitude, position.coords.longitude];

                    if(_.isEmpty(ArenasService.geoQuery)){
                        ArenasService.geoQuery = ArenasService.geoFire.query({
                            center: service.position,
                            radius: 100
                        });
                    }
                    else{
                        ArenasService.geoQuery.updateCriteria({
                            center: service.position,
                            radius: 100
                        });
                    }

                    if(_.isEmpty(TimesService.geoQuery) ){
                        TimesService.geoQuery = TimesService.geoFire.query({
                            center: service.position,
                            radius: 100
                        });
                    }
                    else{
                        TimesService.geoQuery.updateCriteria({
                            center: service.position,
                            radius: 100
                        });
                    }

                    if(_.isEmpty(JogosService.geoQuery)){
                        JogosService.geoQuery = JogosService.geoFire.query({
                            center: service.position,
                            radius: 100
                        });
                    }
                    else{
                        JogosService.geoQuery.updateCriteria({
                            center: service.position,
                            radius: 100
                        });
                    }

                }, function (err) {
                    $window.alert('Ative a localizaçao');
                }, watchOptions);

            //});

            return deferred.promise;
        }

        function navigateTo(endereco) {
            launchnavigator.isAppAvailable(launchnavigator.APP.WAZE, function(isAvailable) {
                var app;
                if (isAvailable) {
                    app = launchnavigator.APP.WAZE;
                } else {
                    console.warn("Google Maps not available - falling back to user selection");
                    app = launchnavigator.APP.USER_SELECT;
                }
                launchnavigator.navigate(endereco, {
                    app: app
                });
            });
        }

    })

    .factory('SmsVerify', function($resource) {

        var serviceBase = 'http://rdqapi.azurewebsites.net/api/';

        return $resource(serviceBase + 'twofactorverification/', {}, {
            query: { method: 'POST' },
            numberVerify: {
                url: serviceBase + 'twofactorverification/NumberVerify', 
                method: 'POST',
            },
            numberVerifyCheck: {
                url: serviceBase + 'twofactorverification/NumberVerifyCheck', 
                method: 'POST',
            }
        });
    });