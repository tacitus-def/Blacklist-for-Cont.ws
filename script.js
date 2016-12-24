// ==UserScript==
// @name        Blacklist for Cont.ws
// @namespace   cont.ws
// @version     2.2
// @author      Demiurg <spetr@bk.ru>
// @license     GNU General Public License v3
// @description Чистит ленту Cont.ws от упоротых авторов.
// @include     https://cont.ws
// @include     https://cont.ws/*
// @grant       none
// ==/UserScript==

jQuery(function(){
  $(document).ready(function() {
    var storage; 
    if (typeof unsafeWindow != "undefined") {
        storage = unsafeWindow.localStorage;
    }
    else {
        storage = window.localStorage;
    }
    var config = {
    	blackList: [ ]
    };

    function processElement(el) {
      var anchor = $(el).find('a[href$=".cont.ws"]:eq(0)');
      var href = anchor.attr('href');
      if (! href) {
        return;
      }
      var target = href.toLowerCase().replace(/^https?:\/\/|\/$/ig, '');
      var found = false;

      if (! /^[0-9][a-zA-Z0-9]{4,}\./.test(target)) {
        var min = 0;
        var max = config.blackList.length - 1;

        while (min <= max) {
          var mid = Math.round((min + max) / 2);
          if (target < config.blackList[mid]) {
            max = mid - 1;
          }
          else if (target > config.blackList[mid]) {
            min = mid + 1;
          }
          else {
            found = true;
            break;
          }
        }
      }
      else {
        found = true;
      }

      if (found) {
          if (el.tagName == 'LI') {
            $(el).html('Комментарий удалён');
          }
          else {
            $(el).remove();
          }
      }
      if (! found && ! anchor.data('hasBlacklistBtn')) {
          var btnBL = document.createElement("a");
          btnBL.innerHTML = ' [ В черный список ] ';
          btnBL.href='#';
          $(btnBL).data('blog', target);
          $(btnBL).click(addToBlacklist);
          anchor.after(btnBL);
          anchor.data('hasBlacklistBtn', 1);
      }
    }

    function addToBlacklist(ev) {
      ev.preventDefault();
      var blog = $(this).data('blog');
      config.blackList.push(blog);
      config.blackList.sort();
      storage.contBlackList = JSON.stringify(config.blackList);
      $(this).html(' [ Добавлен ] ');

      triggerRemove();
    }

    function eachElement(idx, el) {
      processElement(el);
    }

    function removeBadAuthor() {
      $('.post_prv:has(".author-bar")').each(eachElement);
      $('.post_prv:has(".author-bar .post_card .media-body")').each(eachElement);
    }

    function removeBadComment() {
      $('.comments li:has("> a")').each(eachElement);
    }

    function triggerRemove() {
      removeBadAuthor();
      removeBadComment();
    }

    function setEvents() {
      var posts = document.querySelector('.content > .post');
      if (posts) {
        posts.addEventListener("DOMNodeInserted", function (ev) { processElement(ev.target); });
      }
      var comments = document.querySelector('.comments');
      if (comments) {
        comments.addEventListener("DOMNodeInserted", function (ev) { processElement(ev.target); });
      }
    }

    var blackList = storage.contBlackList;
    config.blackList = JSON.parse(blackList ? blackList : '[]');

    if (! config.blackList instanceof Array) {
       config.blackList = [ ];
    }

    for (var i in config.blackList) {
      config.blackList[i] = config.blackList[i].toLowerCase();
    }

    config.blackList.sort();

    setEvents();
    triggerRemove();

  });
});
