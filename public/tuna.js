
window.addEventListener('load', function() {
  FastClick.attach(document.body);
  $('#search').focus();   
}, false);

var tuna = angular.module('tuna', [
  'firebase', 
  'ngAnimate',
  'chieffancypants.loadingBar'
]);

tuna.controller('TunaCtrl', ['$scope', '$http', '$firebase',
  function TunaCtrl($scope, $http, $firebase) {
    $scope.admin = true;
    $scope.searching = false;

    var sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = btoa(Math.random() * 1e16);
      localStorage.setItem('sessionId', sessionId);
    }

    var userId = localStorage.getItem('userId');
    if (!userId) {
      userId = btoa(Math.random() * 1e16);
      localStorage.setItem('userId', userId);
    }

    var sessionRef = new Firebase('https://tuna.firebaseio.com/sessions/' + sessionId);
    $scope.session    = $firebase(sessionRef);
    $scope.songs      = $scope.session.$child('songs');
    $scope.user       = $scope.session.$child('users').$child(userId);
    $scope.nowPlaying = $scope.session.$child('nowPlaying');

    $scope.session.$on('loaded', function() {
      var keys = $scope.songs.$getIndex()
        , firstSong = $scope.songs[keys[0]];

      // $scope.songs.playing = 
      // firstSong.playing = true;
      // $scope.songPlaying = firstSong;
    });

    function adjustPriority (id, pri) {
      var song = $scope.songs[id];
      $scope.songs[id].$priority  = $scope.songs[id].$priority || 0;
      $scope.songs[id].$priority -= 1;
      $scope.songs.$save(id)
    }

    $scope.upvoteSong = function (id) {
      $scope.songs[id].$priority  = $scope.songs[id].$priority || 0;
      $scope.songs[id].$priority -= 1;
      $scope.songs.$save(id);
    }

    $scope.downvoteSong = function (id) {
      $scope.songs[id].$priority  = $scope.songs[id].$priority || 0;
      $scope.songs[id].$priority += 1;
      $scope.songs.$save(id);
    }

    $scope.removeSong = function (id) {
      $scope.songs.$remove(id)
    }

    $scope.addSong = function (song) {
      $scope.searching = false;
      $scope.results   = [];
      $scope.query     = '';

      song.$priority = 8000;

      setTimeout(function() {
        $scope.songs.$add(song);
        setTimeout(function() {
          $('body').animate({
            scrollTop: $(document).height()
          }, 100);
        }, 10);
      }, 10);
    }

    $scope.clearSearch = function () {
      $scope.results      = [];
      $scope.autocomplete = [];
      $scope.query        = '';
      $scope.searching    = false;
      $scope.emptyResults = false;
      $('#search').focus();
    }

    $scope.filter = function (result) {
      $scope.loading = true;
      $scope.autocomplete = [];
      $http.get('/api/ts?q=' + result).success(function(data, status) {
        $scope.loading = false;

        if (data.length === 0) {
          $scope.results      = [];
          $scope.emptyResults = true;
          return;
        }

        $scope.results = _(data).map(function(song) {
          return {
            artist : song.ArtistName,
            title  : song.SongName
          }
        }).value();
      });
    }

    $scope.search = function() {

      if (!$scope.query.length) {
        $scope.autocomplete = [];
        $scope.searching = false;
        return;
      }

      $scope.results = [];
      $scope.searching = true;

      var searchURL = 'https://clients1.google.com/complete/search'
        + '?client=youtube'
        + '&hl=en'
        + '&gl=us'
        + '&gs_rn=11'
        + '&gs_ri=youtube'
        + '&ds=yt'
        + '&cp=3'
        + '&gs_id=1v'
        + '&q=aut'
        + '&callback=JSON_CALLBACK'
        + '&q=' + $scope.query 
    
      $http.jsonp(searchURL, {
        ignoreLoadingBar: true
      }).success(function(data, status) {
        $scope.autocomplete = _(data[1]).filter(function(el) {
          return !/mp3|cover|lyrics|chords|meaning|video/.test(el[0]);
        }).map(function(el) {
          return el[0];
        }).uniq().value();
      });
    };

  }
]);
