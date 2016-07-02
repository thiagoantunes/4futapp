

/*global firebase*/
/*eslint no-undef: "error"*/

'use strict';

// Initialize Firebase
var config = {
  apiKey: 'AIzaSyAhiZwY-x3As6G7ItyKwmSBUzS4Mcg3SnY',
  authDomain: 'pelapp.firebaseapp.com',
  databaseURL: 'https://pelapp.firebaseio.com',
  storageBucket: 'project-1558131433489077274.appspot.com',
};

// Initialize the FirebaseUI Widget using Firebase.
firebase.initializeApp(config);

angular.module('main')
  .factory('Ref', [function () {
    return firebase.database().ref();
  }]);
