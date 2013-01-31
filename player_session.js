var _ = require('lodash')

Array.prototype.move = function (old_index, new_index) {
  while (old_index < 0) {
    old_index += this.length;
  }
  while (new_index < 0) {
    new_index += this.length;
  }
  if (new_index >= this.length) {
    var k = new_index - this.length;
    while ((k--) + 1) {
      this.push(undefined);
    }
  }
  this.splice(new_index, 0, this.splice(old_index, 1)[0]);
  return this; // for testing purposes
};

var bad_words = _.map(['cover', 'live', 'parody', 'remix', 'rmx'], function(w) {
  return new RegExp(w, 'i')
});
  
module.exports = exports = function(io, app, client, name) {

  function process_youtube(q, callback) {
    client.request('getSongSearchResults', {
      country : client.gsCountry,
      query   : q,
      limit   : 15
    }, function(err, status, results) {

      if (!results || !results.songs || !results.songs.length) {
        return callback(err)
      }


      var songs = _.sortBy(results.songs, function(song) {
        var song_full_name = [song.SongName, song.ArtistName].join(' ')
          , words = _.compact(song_full_name.split(/[^\w]/))
          , weight = 0;

        _.each(words, function(word) {
          weight += new RegExp(word, 'i').test(q) ? 1 : -1
        })

        _.each(bad_words, function(word) {
          if (!word.test(q) && word.test(song_full_name)) {
            console.log('Bad word encountered: ' + word)
            weight -= 5;
          }
        })

        song.weight = weight;
        return weight;
      })

      console.log(JSON.stringify(songs, false, '  '));

      var s = songs.pop()
      callback(null, {
        title  : s.SongName,
        artist : s.ArtistName,
        id     : s.SongID
      })    
    })
  }

  var songs  = [ ]
    , playing
    , played = [ ]
    , clients = { }
    , seconds_played = 0
    , seconds_total  = 0
    , duration_update

  function play_next() {
    if (!songs.length) return;
    playing = songs.shift()

    client.request('getStreamKeyStreamServer', {
      songID : playing.id,
      country : client.gsCountry
    }, function(err, status, result) {
      if (err) return s.emit('error', err);

      seconds_total = result.uSecs / 1E6;
      seconds_played = 0;

      clearInterval(duration_update);
      duration_update = setInterval(function() {
        seconds_played++;

        if (seconds_played % 5 == 0) {
          s.emit('progress', seconds_played)
        }

        if (seconds_played >= seconds_total) {
          clearInterval(duration_update);
          play_next()
        }
      }, 1000)

      update_playing(s, true)
      update_songs(s, true)
    })
    
  }

  function update_songs(socket) {
    if (socket) socket.emit('songs', songs)
    else s.emit('songs', songs)
  }

  function update_playing(socket) {
    var playing_data = {
      song           : playing,
      seconds_played : seconds_played,
      seconds_total  : seconds_total
    }
    if (socket) socket.emit('playing', playing_data)
    else s.emit('playing', playing_data)
  }

  var s = io.of('/' + name).on('connection', function (socket) {
    if (songs.length) update_songs(socket)
    if (playing) update_playing(socket)

    socket.votes = { }

    function get_song_position(songs, id) {
      for (i = 0; i < songs.length; i++) {
        if (songs[i].id == id) return i
      }
    }

    socket.on('up', function(id) { 
      if (socket.votes[id]) return;
      socket.votes[id] = true;
      socket.emit('voted', {
        up: true,
        id: id
      })

      var song_position = get_song_position(songs, id)
      songs.move(song_position, Math.round(song_position / 3));

      console.log(songs)
      update_songs()
    })

    socket.on('down', function(id) { 
      if (socket.votes[id]) return;
      socket.votes[id] = true;

      var song_position = get_song_position(songs, id)
      songs.move(song_position, Math.round((songs.length - song_position) / 3));

      console.log(songs)
      update_songs()    
    })

    socket.on('add', function(song) { 
      function finish(song) {
        songs.push(song);
        
        if (!playing) return play_next()
        else update_songs();
      }

      if (/youtube/i.test(song.artist)) {
        console.log('Getting youtube result ' + song.title)
        return process_youtube(song.title, function(err, song) {
          if (err) return socket.emit('error', err);
          finish(song);
        })
      } else {
        finish(song)
      }
    })

    socket.on('player_init', function() {
      console.log('*** Player Initialized')
      play_next()
    })
  });
}