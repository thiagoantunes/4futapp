(function () {
    'use strict';
    angular.module('main')
        .factory('JogosService', JogosService);

    JogosService.$inject = ['Ref', '$timeout', '$rootScope', '$firebaseObject', 'Enum', '$firebaseArray', '$q', 'UserService', '$location', '$ionicScrollDelegate'];

    function JogosService(Ref, $timeout, $rootScope, $firebaseObject, Enum, $firebaseArray, $q, UserService, $location, $ionicScrollDelegate) {
        var service = {
            jogoSelecionado: null,
            geoQueryLoaded: false,
            novaPartida: {},
            jogosRegiao: [],
            jogosRegiaoMarkers: [],
            jogosRegiaoMap: {},
            ref: Ref.child('jogos'),
            refLocalizacao: Ref.child('jogosLocalizacao'),
            refUserJogos: Ref.child('usersJogos'),
            refJogadoresJogo: Ref.child('jogosJogadores'),
            geoFire: new GeoFire(Ref.child('jogosLocalizacao')),
            geoQuery: {},

            getJogo: getJogo,
            getAndamentoJogo: getAndamentoJogo,
            getJogosRegiao: getJogosRegiao,
            getMeusJogos: getMeusJogos,
            getUserJogos: getUserJogos,
            getLocalizacaoJogo: getLocalizacaoJogo,
            criarJogo: criarJogo,
            editarJogo: editarJogo,
            cancelarJogo: cancelarJogo,
            convidarAmigo: convidarAmigo,
            desconvidarAmigo: desconvidarAmigo,
            solicitarPresenca: solicitarPresenca,
            aprovarSolicitacaoPresenca: aprovarSolicitacaoPresenca
        };

        return service;

        function getJogo(jogoId) {
            return $firebaseObject(service.ref.child(jogoId));
        }

        function getAndamentoJogo(jogoId) {
            return $firebaseObject(service.ref.child(jogoId + '/andamento'));
        }

        function getJogosRegiao() {
            var deferred = $q.defer();

            service.geoQuery.on('key_entered', function (key, location, distance) {
                var existingMarker = _.find($rootScope.markers, { '$id': key });
                if (existingMarker) {
                    existingMarker.distance = distance;
                    existingMarker.latitude = location[0];
                    existingMarker.longitude = location[1];
                }
                else {
                    $rootScope.markers.push({
                        $id: key,
                        distance: distance,
                        latitude: location[0],
                        longitude: location[1],
                        icon: 'www/img/pin-jogos.png',
                        todos: true,
                        jogo: true
                    });
                }
                if (service.geoQueryLoaded) {
                    getJogo(key).$loaded().then(function (obj) {
                        setMatch(obj);
                        addMarkerToMap(key);
                    });
                }
            });

            service.geoQuery.on("key_exited", function (key, location, distance) {
                _.remove($rootScope.markers, { '$id': key });
                var matchMarker = _.find($rootScope.markers, { $id: key });
                if (matchMarker) {
                    matchMarker.marker.remove();
                }
            });

            service.geoQuery.on('ready', function () {
                onFirstLoadReady();
            });

            function onFirstLoadReady() {
                service.geoQueryLoaded = true;

                var promises = [];
                _.forEach($rootScope.markers, function (j) {
                    var promise = getJogo(j.$id).$loaded();
                    promises.push(promise);
                });
                $q.all(promises).then(function (requests) {
                    _.forEach(requests, function (jogo) {
                        setMatch(jogo);
                    });
                    addMarkersToMap();
                    deferred.resolve();
                });

            }

            function setMatch(jogo) {
                if (jogo.inicio > moment(new Date()).subtract(1, 'H')._d.getTime()) {
                    var marker = _.find($rootScope.markers, { $id: jogo.$id });
                    marker.data = jogo;

                    if (!_.some(marker.data.jogadores, { 'id': firebase.auth().currentUser.uid })) {
                        verificaPermissao(marker.data).then(function (visivel) {
                            if (!visivel) {
                                marker.readOnly = true;
                                marker.icon = 'www/img/pin-jogos-readonly.png';
                            }
                        });
                    }
                }
                else {
                    service.geoFire.remove(jogo.$id);
                }
            }

            function addMarkersToMap() {
                $rootScope.markers.map(function (markMatch) {
                    if (markMatch.marker) {
                        markMatch.marker.remove();
                    }
                    var latLng = new plugin.google.maps.LatLng(markMatch.latitude, markMatch.longitude);
                    $timeout(function () {
                        $rootScope.map.addMarker({
                            'position': latLng,
                            'title': markMatch.data.nome,
                            'icon': {
                                'url': markMatch.icon,
                                'size': {
                                    width: 79,
                                    height: 48
                                }
                            }
                        }, function (marker) {
                            markMatch.marker = marker;
                            $rootScope.map.on('category_change', function (category) {
                                $timeout(function () {
                                    markMatch.marker.setVisible(marker[category] ? true : false);
                                }, 100);
                            });
                        });
                    });
                });
            }

            function addMarkerToMap(key) {
                var markMatch = _.find($rootScope.markers, { '$id': key });
                if (markMatch.marker) {
                    markMatch.marker.remove();
                }
                var latLng = new plugin.google.maps.LatLng(markMatch.latitude, markMatch.longitude);
                $timeout(function () {
                    $rootScope.map.addMarker({
                        'position': latLng,
                        'title': markMatch.data.nome,
                        'icon': {
                            'url': markMatch.icon,
                            'size': {
                                width: 79,
                                height: 48
                            }
                        }
                    }, function (marker) {
                        markMatch.marker = marker;
                        $rootScope.map.on('category_change', function (category) {
                            $timeout(function () {
                                markMatch.marker.setVisible(marker[category] ? true : false);
                            }, 100);
                        });
                    });
                });
            }


            return deferred.promise;

        }

        function onMarkerClicked(marker) {
            $location.hash('anchor' + marker.$id);
            $ionicScrollDelegate.anchorScroll(true);
        }

        function getUserJogos(user) {
            var ref = Ref.child('usersJogos/' + user);
            return $firebaseArray(ref);
        }

        function getLocalizacaoJogo(jogoId) {
            return service.refLocalizacao.child(jogoId).once('value');
        }

        function criarJogo(data) {
            var deferred = $q.defer();

            data.partida.andamento = {
                timeForTimer: 300,
                started: false,
                paused: false,
                done: false
            };

            var jogoId = service.ref.push().key;
            var jogoData = {};
            jogoData['jogos/' + jogoId] = data.partida;
            jogoData['jogos/' + jogoId].jogadores = {};

            //Adiciona os amigos selecionados ao jogo
            _.forEach(data.jogadores, function (jogador) {
                jogoData['jogos/' + jogoId].jogadores[jogador.$id] = {
                    fotoPerfil: jogador.fotoPerfil,
                    id: jogador.$id
                };
                jogoData['usersJogos/' + jogador.$id + '/' + jogoId] = true;
            });

            //Adiciona os membros dos grupos ao jogo
            _.forEach(data.times, function (time) {
                _.forEach(time.jogadores, function (jogador) {
                    if (jogador.id !== firebase.auth().currentUser.uid) {
                        jogoData['jogos/' + jogoId].jogadores[jogador.id] = {
                            fotoPerfil: jogador.fotoPerfil,
                            id: jogador.id
                        };
                        jogoData['usersJogos/' + jogador.$id + '/' + jogoId] = true;
                    }
                });
            });

            //Me adiciona ao jogo
            jogoData['jogos/' + jogoId].jogadores[firebase.auth().currentUser.uid] = {
                fotoPerfil: firebase.auth().currentUser.photoURL,
                id: firebase.auth().currentUser.uid,
                confirmado: true
            };
            jogoData['usersJogos/' + firebase.auth().currentUser.uid + '/' + jogoId] = true;


            //Vincula partida a reserva
            if (data.partida.reserva && data.arenaId) {
                jogoData['reservas/' + data.arenaId + '/' + data.partida.reserva + '/partida'] = jogoId;
            }

            Ref.update(jogoData, function (error) {
                if (error) {
                    deferred.reject('Erro ao cadastrar nova turma');
                }
                else {
                    var scheduleNotificationData = {
                        id: firebase.auth().currentUser.uid,
                        msg: 'Comece a aquecer! ' + data.partida.nome + ' vai começar!',
                        date: moment(data.partida.inicio).subtract(30, 'minutes').toISOString()
                    };
                    UserService.schedulePushNotification(scheduleNotificationData);

                    _.forEach(data.jogadores, function (jogador) {
                        UserService.enviaNotificacao({
                            msg: firebase.auth().currentUser.displayName + ' te convidou para uma partida',
                            img: firebase.auth().currentUser.photoURL,
                            tipo: Enum.TipoNotificacao.convitePartida,
                            lida: false,
                            dateTime: new Date().getTime()
                        }, jogador.$id);
                        var scheduleNotificationData = {
                            id: jogador.$id,
                            msg: 'Comece a aquecer! ' + data.partida.nome + ' vai começar!',
                            date: moment(data.partida.inicio).subtract(30, 'minutes').toISOString()
                        };
                        UserService.schedulePushNotification(scheduleNotificationData);
                    });
                    _.forEach(data.times, function (time) {
                        _.forEach(time.jogadores, function (jogador) {
                            if (jogador.id !== firebase.auth().currentUser.uid) {
                                var scheduleNotificationData = {
                                    id: jogador.$id,
                                    msg: 'Comece a aquecer! ' + data.partida.nome + ' vai começar!',
                                    date: moment(data.partida.inicio).subtract(30, 'minutes').toISOString()
                                };
                                UserService.schedulePushNotification(scheduleNotificationData);
                                UserService.enviaNotificacao({
                                    msg: firebase.auth().currentUser.displayName + ' te convidou para uma partida',
                                    img: firebase.auth().currentUser.photoURL,
                                    tipo: Enum.TipoNotificacao.convitePartida,
                                    lida: false,
                                    dateTime: new Date().getTime()
                                }, jogador.id);
                            }
                        });
                    });
                    var geo = new GeoFire(Ref.child('jogosLocalizacao'));
                    geo.set(jogoId, data.coords);
                    deferred.resolve(jogoId);
                }
            });

            return deferred.promise;
        }

        function cancelarJogo(jogo) {
            var deferred = $q.defer();
            var jogoData = {};
            var jogoId = jogo.$id;
            jogoData['jogos/' + jogoId] = null;
            jogoData['jogosLocalizacao/' + jogoId] = null;
            _.forEach(jogo.jogadores, function (jogador) {
                jogoData['usersJogos/' + jogador.id + '/' + jogoId] = null;
            });
            Ref.update(jogoData, function (error) {
                if (error) {
                    deferred.reject('Erro ao cancelar a partida');
                }
                else {
                    _.forEach(jogo.jogadores, function (jogador) {
                        UserService.enviaNotificacao({
                            msg: firebase.auth().currentUser.displayName + ' cancelou uma partida ' + jogo.nome,
                            img: firebase.auth().currentUser.photoURL,
                            tipo: Enum.TipoNotificacao.cancelamentoPartida,
                            lida: false,
                            dateTime: new Date().getTime()
                        }, jogador.id);
                    });
                    deferred.resolve(jogoId);
                }
            });
            return deferred.promise;
        }

        function editarJogo(data) {
            var deferred = $q.defer();
            var jogoData = {};
            jogoData['jogos/' + data.idPartida] = data.partida;

            if (data.partida.reserva && data.arenaId) {
                jogoData['reservas/' + data.arenaId + '/' + data.partida.reserva + '/partida'] = data.idPartida;
            }

            Ref.update(jogoData, function (error) {
                if (error) {
                    deferred.reject('Erro ao cadastrar nova turma');
                }
                else {
                    //enviar notificaçao jogadores'
                    var geo = new GeoFire(Ref.child('jogosLocalizacao'));
                    geo.set(data.idPartida, data.coords);
                    deferred.resolve(data.idPartida);
                }
            });

            return deferred.promise;
        }

        function solicitarPresenca(jogo) {
            var deferred = $q.defer();
            var conviteData = {};
            var solicitacao = {
                nome: firebase.auth().currentUser.displayName,
                fotoPerfil: firebase.auth().currentUser.photoURL,
                confirmado: true
            };
            if (jogo.aprovacaoManual) {
                solicitacao.aguardandoConfirmacao = true;
            }
            conviteData['jogos/' + jogo.$id + '/jogadores/' + firebase.auth().currentUser.uid] = solicitacao;
            conviteData['usersJogos/' + firebase.auth().currentUser.uid + '/' + jogo.$id] = true;

            Ref.update(conviteData, function () {
                deferred.resolve(solicitacao);
                if (jogo.aprovacaoManual) {
                    UserService.enviaNotificacao({
                        msg: firebase.auth().currentUser.displayName + ' solicitou presença na partida ' + jogo.nome,
                        img: firebase.auth().currentUser.photoURL,
                        userId: firebase.auth().currentUser.uid,
                        jogoId: jogo.$id,
                        tipo: Enum.TipoNotificacao.solicitacaoPresenca,
                        lida: false,
                        dateTime: new Date().getTime()
                    }, jogo.responsavel);
                }
            });
            return deferred.promise;
        }

        function getMeusJogos() {
            service.refUserJogos.child(firebase.auth().currentUser.uid).on('child_added', function (snap) {
                getJogo(snap.key).$loaded().then(function (val) {
                    $timeout(function () {
                        _.remove(UserService.jogos, { '$id': val.$id });
                        UserService.jogos.push(val);
                    });
                });
            });

            service.refUserJogos.child(firebase.auth().currentUser.uid).on('child_removed', function (oldChild) {
                $timeout(function () {
                    _.remove(UserService.jogos, { '$id': oldChild.key });
                });
            });
        }

        function aprovarSolicitacaoPresenca(userId, jogoId) {
            var data = {};
            data['jogos/' + jogoId + '/jogadores/' + userId + '/aguardandoConfirmacao'] = null;

            Ref.update(data, function () {
                UserService.enviaNotificacao({
                    msg: firebase.auth().currentUser.displayName + ' aprovou sua participação em uma partida',
                    userId: firebase.auth().currentUser.uid,
                    jogoId: jogoId,
                    img: firebase.auth().currentUser.photoURL,
                    tipo: Enum.TipoNotificacao.aprovacaoSolicitacaoPresenca,
                    lida: false,
                    dateTime: new Date().getTime()
                }, userId);
            });
        }

        function convidarAmigo(amigo, jogoId) {
            var conviteData = {};
            conviteData['jogos/' + jogoId + '/jogadores/' + amigo.$id] = {
                nome: amigo.nome,
                fotoPerfil: amigo.fotoPerfil,
                id: amigo.$id
            };
            conviteData['usersJogos/' + amigo.$id + '/' + jogoId] = true;

            Ref.update(conviteData, function () {
                UserService.enviaNotificacao({
                    msg: firebase.auth().currentUser.displayName + ' te convidou para uma partida',
                    userId: firebase.auth().currentUser.uid,
                    jogoId: jogoId,
                    img: firebase.auth().currentUser.photoURL,
                    tipo: Enum.TipoNotificacao.convitePartida,
                    lida: false,
                    dateTime: new Date().getTime()
                }, amigo.$id);
            });
        }

        function desconvidarAmigo(amigo, jogoId) {
            var conviteData = {};
            conviteData['jogos/' + jogoId + '/jogadores/' + amigo.$id] = null;
            conviteData['usersJogos/' + amigo.$id + '/' + jogoId] = null;

            Ref.update(conviteData);
        }

        function verificaPermissao(jogo) {
            var deferred = $q.defer();

            if (jogo.visibilidade == Enum.VisualizacaoJogo.publico) {
                deferred.resolve(true);
            }
            else if (jogo.visibilidade == Enum.VisualizacaoJogo.amigosDeAmigos) {
                UserService.verificaAmizadeDeAmizades(jogo.responsavel).then(function (val) {
                    deferred.resolve(val);
                });
            }
            else if (jogo.visibilidade == Enum.VisualizacaoJogo.amigos) {
                UserService.verificaAmizade(jogo.responsavel).then(function (val) {
                    deferred.resolve(val);
                });
            }
            else if (jogo.visibilidade == Enum.VisualizacaoJogo.convidados) {
                var convidado = _.some(jogo.jogadores, { '$id': firebase.auth().currentUser.uid });
                deferred.resolve(convidado);
            }

            return deferred.promise;
        }

    }

} ());
