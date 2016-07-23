'use strict';
angular.module('main')
  .factory('UserService', function (Ref, $firebaseObject, $q, $timeout) {
    var service = {
      jogos: [],
      amigos: [],
      reservas: [],
      ref: Ref.child('users'),
      refAmigos: Ref.child('usersAmigos'),

      getUserProfile: getUserProfile,
      getCurrentUser: getCurrentUser,
      getAmigos:getAmigos,

      adicionarAmigo: adicionarAmigo
    };

    return service;

    function getCurrentUser() {
      var deferred = $q.defer();
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          deferred.resolve(user);
        }
        else {
          deferred.reject();
        }
      });

      return deferred.promise;
    }

    function getUserProfile(id) {
      return $firebaseObject(service.ref.child(id));
    }

    function adicionarAmigo(id) {
      var amigoData = {};
      amigoData['usersAmigos/' + firebase.auth().currentUser.uid + '/' + id] = true;
      amigoData['usersAmigos/' + id + '/' + firebase.auth().currentUser.uid] = false;

      Ref.update(amigoData);
    }

    function getAmigos() {
      service.refAmigos.child(firebase.auth().currentUser.uid).on('child_added', function (snap) {
        service.ref.child(snap.key).on('value', function (snapUser) {
          var data = snapUser.val();
          data.id = snap.key;
          $timeout(function () {
            _.remove(service.amigos, { 'id': snap.key });
            service.amigos.push(data);
          });
        });
      });
    }

  });


