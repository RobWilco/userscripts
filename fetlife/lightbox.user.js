// ==UserScript==
// @name        FetLife Lightbox
// @description Image preview and love toggle on mouse hover
// @author      RobWilco
// @namespace   robwilco.fetlife.lightbox
// @license     GNU GPLv3
// @include     https://fetlife.com/*
// @version     1.0.5
// ==/UserScript==

// Based on FetLife Lightbox by wjw_
// http://userscripts-mirror.org/scripts/show/175687

var FLCB = function() {
  this.update = function() {
    // Popup border
    var border = 10;

    var picture_hover_on = function() {
      var this_ = this;

      // Skip links that ...
      // refer to comment fragments,
      // don't have any img elements,
      // are the actual full-size images,
      // ... and are for an avatar.
      if ($(this_).attr('href').indexOf('#comment_') > -1 ||
          $(this_).children('img').length < 1 ||
          $(this_).children('.fl-picture__img').length == 1 ||
          $(this_).children('.avatar').length == 1)
	    return false;

      // If the popup markup has already been added, show it.
      if ($(this_).children('.flcb_popup').length == 1) {
        $(this_).children('.flcb_popup').show();
        $(this_).parents('.kpbox').addClass('flcb_overflowfix');
        return false;
      }

      // Add the popup markup.
      $(this_).prepend('<div class="flcb_popup"></div>');

      // Make the popup be the size of the image with a border-width margin
      $(this_).find('.flcb_popup').css({
        width: $(this).children('img').width() + border,
        height: $(this).children('img').height() + border
      });

      // Add the overflow fix to K&P's box
      $(this_).parents('.kpbox').addClass('flcb_overflowfix');

      // Construct the 'like' URL - returns lots of helpful info!
      var likeUrl = $(this).attr('href').split('/');
      likeUrl = likeUrl[likeUrl.length-1];
      likeUrl = "https://fetlife.com/pictures/" + likeUrl + "/likes";

      // Load the photo page so we can extract the pieces we need for the popup.
      $.ajax({
        url: $(this).attr('href'),
        dataType: "html",
        success: function(html) {
          // Grab the caption text.
          var title = $.trim($(html).find('.fl-picture__caption').text());

          // The figure element is now being used for the image.
          $(html).find('figure').each(function() {

            // Grab the image link, then form the markup for the popup.
            var url = $(this).find('img').first().attr('src');
            var titleHtml = (title.length > 0) ? '<span>' + title + '</span>' : '';
            var imageHtml = '<img src="' + url + '" />';
            var likeHtml = '<em data-href="' + likeUrl + '/toggle" class="picto quiet" title="love">k</em>';

            // Load the full size image first, then ...
            var image = new Image();
            image.src = url;
            image.onload = function() {
              // Add the markup to the popup. The image will now appear immediately.
              $(this_).find('.flcb_popup').html(titleHtml + imageHtml + likeHtml);

              // Set the popup dimensions to match the image plus a border.
              $(this_).find('.flcb_popup').css({
                width: $(this_).find('.flcb_popup img').width() + border,
                height: $(this_).find('.flcb_popup img').height() + border
              });

              // If the image would be cut off on the right, adjust the offset.
              var left_offset = $(this_).find('.flcb_popup').offset().left;
              var window_width = $(window).width();
              var popup_width = $(this_).find('.flcb_popup').width();
              if (left_offset + popup_width > window_width) {
                var thumbnail_width = $(this_).find('.flcb_popup+img').width();
                var popup_offset = popup_width - (thumbnail_width + border);
                $(this_).find('.flcb_popup').css({
                  left: -popup_offset
                });
              }

              $.ajax({
                url: likeUrl,
                dataType: "json",
                success: function(data) {
                  if (data.user_can_like) {
                    $(this_).find('.flcb_popup em').addClass('visible');

                    if (data.is_liked_by_user) {
                      $(this_).find('.flcb_popup em').addClass('liked');
                    }
                  }
                }
              });

              // Toggle the love
              $(this_).find('.flcb_popup em').click(function() {
                var this_ = this;
                $.ajax({
                  url: $(this_).data('href'),
                  type: 'post',
                  dataType: "text",
                  success: function(data) {
                    if (data == "Successful.") {
                      $(this_).toggleClass('liked');
                    }
                  }
                });

                return false;
              });
            };
          });
        }
      });

      return false;
    };

    var picture_hover_off = function() {
      $(this).children('.flcb_popup').hide();
      $(this).parents('.kpbox').removeClass('flcb_overflowfix');
    };

    $('a[href^="https://fetlife.com/users/"][href*="/pictures/"], a[href^="/users/"][href*="/pictures/"]').hover(
      picture_hover_on, picture_hover_off
    );

    // avatar preview
    var avatar_hover_on = function() {
      var this_ = this;

      $(this).addClass('flcb_user');

      // Skip if there aren't any img elements,
      // or if it's an avatar next to a "new comment" text box,
      // or if it's the "avatar missing" image.
      if ($(this_).children('img').length < 1 ||
          $(this_).hasClass('new_comment') ||
	      $(this_).children('img').attr('src').indexOf('avatar_missing') > -1)
	    return false;

      // If the popup markup has already been added, show it.
      if ($(this_).children('.flcb_popup').length >= 1) {
        $(this_).children('.flcb_popup').show();
        return false;
      }

      // Story and K&P entries will cut off avatar pics. This fixes that.
      $(this_).parents('.story').addClass('flcb_overflowfix');
      $(this_).parents('.kpbox').addClass('flcb_overflowfix');
      $(this_).parents('.fl-overflow--hidden').addClass('flcb_overflowfix');

      // Change the filename to use the large version. Strip the query.
      var src = $(this_).children('img').attr('src');
      src = src.replace('_35', '_720');
      src = src.replace('_60', '_720');
      src = src.replace('_110', '_720');
      src = src.substring(0, src.indexOf('?'));

      // TODO: Is this ever used? flcb_popup hasn't been added yet!
      // Make the popup be the size of the image with a 6px margin
      $(this).find('.flcb_popup').css({
        width: $(this_).children('img').width() + 6,
        height: $(this_).children('img').height() + 6
      });

      // Create a title and image for the avatar.
      var titleHtml = ($(this_).children('img').attr('title').length > 0) ? '<span>' + $(this_).children('img').attr('title') + '</span>' : '';
      var imageHtml = '<img src="' + src + '" />';

      // Add the popup.
      $(this_).prepend('<div class="flcb_popup"></div>');

      // Load the full-size image first, then ...
      var image = new Image();
      image.src = src;
      image.onload = function() {
        // Add the markup to the popup. The image will now appear immediately.
        $(this_).find('.flcb_popup').html(titleHtml + imageHtml);

        // Set the popup dimensions to match the image plus a 10px border.
        $(this_).find('.flcb_popup').css({
          width: $(this_).find('.flcb_popup img').width() + border,
          height: $(this_).find('.flcb_popup img').height() + border
        });

        // If the image would be cut off on the right, adjust the offset.
        var left_offset = $(this_).find('.flcb_popup').offset().left;
        var window_width = $(window).width();
        var popup_width = $(this_).find('.flcb_popup').width();
        if (left_offset + popup_width > window_width) {
          var thumbnail_width = $(this_).find('.flcb_popup+img').width();
          var popup_offset = popup_width - (thumbnail_width + border);
          $(this_).find('.flcb_popup').css({
            left: popup_offset
          });
        }
      };
    };

    var avatar_hover_off = function() {
      $(this).children('.flcb_popup').hide();
    };

    $('.fl-likes-section__list').find('a').hover(
      avatar_hover_on, avatar_hover_off
    );
    $('img.avatar, .fl-avatar__img').parent().hover(
      avatar_hover_on, avatar_hover_off
    );
  };
};

var css = ".flcb_popup { position: absolute; z-index: 9999; width: 100%; height: 100%; background: rgba(0,0,0,0.75) url(https://flassets.a.ssl.fastly.net/std/spinners/circle_big.gif) center center no-repeat; }";
css += ".flcb_popup img { border: 5px solid black; max-width: 500px; display: block; width: auto !important; height: auto !important; padding: 0 !important; margin: 0 !important; }";
css += ".flcb_popup span { position: absolute; left: 5px; right: 5px; top: 5px; padding: 5px; background: rgba(0,0,0,0.5); text-align: center; color: white; line-height: 1em; font-size: 12px; text-shadow: 1px 1px 0 rgba(0,0,0,0.5); }";
css += ".flcb_popup em { position: absolute; left: 8px; top: 15px; opacity: 0; font-style: normal; -moz-transition: all 0.2s; -webkit-transition: all 0.2s; transition: all 0.2s; -webkit-transform: scale(0); -moz-transform: scale(0); transform: scale(0); text-shadow: 0 0 1px rgba(255,255,255,0.6); }";
css += ".flcb_popup em.visible { opacity: 1; -moz-transform: scale(1); -webkit-transform: scale(1); transform: scale(1); }";
css += ".flcb_popup em:hover { color: #999999; }";
css += ".flcb_popup em:active { -moz-transform: scale(0.8); -webkit-transform: scale(0.8); transform: scale(0.8); }";
css += ".flcb_popup em.liked { color: #DD0000; }";
css += ".kpbox.flcb_overflowfix { overflow: visible; }";
css += ".story.flcb_overflowfix, .fl-overflow--hidden.flcb_overflowfix { overflow: visible !important; }";
css += ".flcb_user { position: relative; }";
css += ".flcb_user img { max-width: 400px; }";

$(document).ready(function(){
  var flcb = new FLCB();
  setInterval(flcb.update, 1000);

  $('head').append('<style type="text/css">' + css + '</style>');
});