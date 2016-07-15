'use strict';
angular.module('main')
  .factory('UserService', function (Ref, $firebaseObject, $q) {
    var service = {
      jogos: [],
      reservas: [],

      getRef: getRef,
      getUserProfile: getUserProfile,
      getCurrentUser: getCurrentUser
    };

    return service;

    function getRef() {
      return Ref.child('users');
    }

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
      return $firebaseObject(getRef().child(id));
    }
  });


