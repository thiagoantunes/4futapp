/*global firebase*/
'use strict';
angular.module('main')
  .controller('PerfilCtrl', function ($state) {

    var vm = this;

    vm.logOut = function () {
      firebase.auth().signOut().then(function () {
        $state.go('login');
      }, function (error) {
        console.log(error);
      });
    };
  });

