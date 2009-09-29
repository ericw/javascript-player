soundManager.flashVersion = 9;
soundManager.debugMode = false; // disable debug mode
soundManager.defaultOptions.multiShot = false;
soundManager.url = 'http://a1.soundcloud.com/swf/soundmanager2_flash9.swf'; // change to '.' to use local non-crossdomain soundmanager

$(function() {
  $("a.soundcloud-player#basic").scPlayer();
  $("a.soundcloud-player#custom-width").scPlayer({width:600,collapse:false});
  $("a.soundcloud-player#custom-css").scPlayer();
  $("a.soundcloud-player#custom-size").scPlayer({width:"100%",collapse:false});
});
