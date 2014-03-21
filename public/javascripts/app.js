var $queue        = $('#queue')
  , $song_playing = $('#now-playing')
  , $progress     = $('#progress')
  , $join         = $('#join')
  , $hide_element = $queue
  , progress_timer
  , seconds_played
  , seconds_total
  , session_name
  , websocket_port

var templates = {
  songs   : Handlebars.compile($('#songs-template').html()),
  playing : Handlebars.compile($('#playing-template').html()),
  results : Handlebars.compile($('#results-template').html()),
}

Handlebars.registerHelper('JSON', function(object) {
  return new Handlebars.SafeString(encodeURIComponent(JSON.stringify(object)));
});

function resetSongPlaying() {
  $song_playing.html(templates.playing({ 
    title : 'No Music Playing', 
    icon  : 'pause',
    nothing : 'nothing'
  }));

  start_progress({
    seconds_played : 0,
    seconds_total  : 0
  })
}

resetSongPlaying()

var socket = io.connect('http://' + window.location.host + '/' + session_name, {
  port : websocket_port
});

$('#host').text(window.location.host)
$('#code').attr('src', 'https://chart.googleapis.com/chart?chs=500x500&cht=qr'
  + '&chl=http://' + window.location.host + '/' + session_name)

function update_progress() {
  $progress.css({ 
    width : ((seconds_played / seconds_total) * 100) + '%' 
  })
}

function start_progress(playing_data) {
  clearInterval(progress_timer);
  seconds_played = playing_data.seconds_played
  seconds_total = playing_data.seconds_total

  update_progress(seconds_played, seconds_total)

  progress_timer = setInterval(function() {
    seconds_played += 0.1;
    update_progress(seconds_played, seconds_total)
  }, 100)
}

socket.on('progress', function(played) {
  seconds_played = played
  update_progress()
})

socket.on('playing', function(playing_data) {
  var song = playing_data.song;
  if (song) {
    $song_playing.html(templates.playing({
      title  : song.title,
      artist : song.artist,
      icon   : 'play'
    }))
  }
  else {
    resetSongPlaying()
  }
});

socket.on('songs', function (songs) {
  $queue.html(templates.songs(songs));
  apply_actions();
});

socket.on('error', function(err) {
  if (/array/i.test(Object.prototype.toString.call(err))) err = err.pop();
  alert(err.message || 'Something went wrong. Continue to fix this.');
  $('#loading').remove();
  // if (!err.message)
  //  location.href = location.href;
});

$(window).on('load', function() {
  // Set a timeout...
  setTimeout(function(){
    // Hide the address bar!
    window.scrollTo(0, 1);
  }, 0);
});
