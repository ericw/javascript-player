/*
 * Copyright 2009 Eric Wahlforss for SoundCloud Ltd.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 *
 * For more information and documentation refer to
 * http://soundcloud.com/api
 * 
 */

(function($) {
  $.fn.scPlayer = function(callerSettings) {
    return this.each(function(){
      var settings = $.extend({width:500, collapse : true, autoplay: false},callerSettings || {}); // default settings
      var track = {}; // the soundcloud track data
      var sound; // the soundmanager 2 sound object
      var link = $(this); // the player a-tag
      var dom; // the root player dom node, created on first play
      var loading; // the loading progress
      var progress; // the playback progress
      var inited = false; // player is not inited

      // init the player on first click of the link
      link
        .click(function() {
          if(!inited) { // if not initied, then load track data, and init the sound
            init(true); // passing true here means init and autoplay
          } else { // if inited, the toggle between play/pause
            togglePlay();
          }
          return false;
        });

      //init the player, get the track data from soundcloud, init sound
      var init = function(autoplay) {
        link.wrap("<div class='sc-player'></div>");
        dom = link.parent("div.sc-player");
        link.addClass("controls");
        dom.attr("id",link.attr("id"));
        link.attr("id","");
        
        $.getJSON("http://api.soundcloud.com/tracks/" + link.attr("href").substring(link.attr("href").lastIndexOf("/")+1) + ".js?callback=?", function(data) {
          track = data;

          $("<div class='loading'></div><div class='progress'></div><div class='progress-bar'></div><p class='time'></p>").appendTo(dom);

          $("<span><span class='position'></span> <span class='delimiter'>/</span> <span class='duration'></span></span>")
            .appendTo($(".time",dom))
            .hide()
            .find(".duration").html(formatMs(track.duration)).end()
            .fadeIn(1500);

          $("<p class='metadata'>" + track.user.username + " - " + track.title + "</p>")
            .appendTo(dom)
            .hide()
            .fadeIn(1500);

          // This is wrapped in a timeout because for some reason the browser doesn't update the width of the .metadata element instantly. a bit ugly offset code here as well.
          setTimeout(function() {
            $("<a class='permalink' href='" + track.permalink_url + "'>»</a>")
              .appendTo(dom)
              .css({left:($(".metadata",dom).offset().left - $(dom).offset().left + $(".metadata",dom).width() + 5) })
              .hide()
              .fadeIn(1500);
          },200);
          
          var progressBar = $(dom).find(".progress-bar");
          loading = $(".loading",dom);
          progress = $(".progress",dom);

          // expand out the player to the width in the settings                
          if($.easing) {
            dom.animate({width:settings.width},500,"easeinout");
          }
          
          // set up progress
          progressBar.click(function(ev) {
            var percent = (ev.clientX-progressBar.offset().left)/(progressBar.width());
            if(sound.durationEstimate*percent < sound.duration) {
              play();
              sound.setPosition(sound.durationEstimate*percent);
            }
          });
          
          var timer = setInterval(function() {  // this is kind of ugly but don't know a better way of waiting for SoundManager 2 when multiple players are on the page
            if(soundManager.swfLoaded) {
              sound = soundManager.createSound({
                id: track.id,
                url: track.stream_url,
                whileloading : throttle(200,function() {
                  loading.css('width',(sound.bytesLoaded/sound.bytesTotal)*100+"%");
                }),
                whileplaying : throttle(200,function() {
                  progress.css('width',(sound.position/sound.durationEstimate)*100+"%");
                  $('.position',dom).html(formatMs(sound.position));
                  $('.duration',dom).html(formatMs(sound.durationEstimate));
                }),
                onfinish : function() {
                  dom.removeClass("playing");
                  sound.setPosition(0);
                },
                onload : function () {
                  loading.css('width',"100%");
                },
                onpause : function() {
                  stop();
                }
              });
              
              if(autoplay) {
                play();
              }
              clearInterval(timer);
            }
          },200);

          inited = true;
        });
      };

      var togglePlay = function() {
        dom.hasClass("playing") ? stop() : play();
      };

      var stop = function() {
        if(sound) {
          sound.pause();
          dom.removeClass("playing");
        }
      };

      var play = function() {
        if(sound) {
          soundManager.pauseAll();
          sound.paused ? sound.resume() : sound.play();
          $(".delimiter",dom).show();
          dom.addClass("playing");
        }
      };

      // format millis into MM.SS
      var formatMs = function(ms) {
        var s = Math.floor((ms/1000) % 60);
        if (s < 10) { s = "0"+s; }
        return Math.floor(ms/60000) + "." + s;
      };
      
      // throttling function to minimize redraws caused by soundmanager
      var throttle = function(delay, fn) {
        var last = null,
            partial = fn;

        if (delay > 0) {
          partial = function() {
            var now = new Date(),
                scope = this,
                args = arguments;

            // We are the last call made, so cancel the previous last call
            clearTimeout(partial.futureTimeout);

            if (last === null || now - last > delay) { 
              fn.apply(scope, args);
              last = now;
            } else {
              // guarentee that the method will be called after the right delay
              partial.futureTimeout = setTimeout(function() { fn.apply(scope, args); }, delay);
            }
          };
        }
        return partial;
      };

      // expand the player on init if collapse=false
      if(!settings.collapse) {
        settings.autoplay ? init(true) : init();
        dom.width(settings.width);
      }

    });
  };
})(jQuery);

 /*
  * jQuery Easing v1.1.1 - http://gsgd.co.uk/sandbox/jquery.easing.php
  *
  * Uses the built in easing capabilities added in jQuery 1.1
  * to offer multiple easing options
  *
  * Copyright (c) 2007 George Smith
  * Licensed under the MIT License:
  *   http://www.opensource.org/licenses/mit-license.php
  */

/* Extending jQuery easing functions here with the one required for the player */

jQuery.easing = jQuery.extend({
	easeinout: function(x, t, b, c, d) {
		if (t < d/2) return 2*c*t*t/(d*d) + b;
		var ts = t - d/2;
		return -2*c*ts*ts/(d*d) + 2*c*ts/d + c/2 + b;		
  }
},jQuery.easing);
