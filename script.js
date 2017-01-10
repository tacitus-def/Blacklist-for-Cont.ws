// ==UserScript==
// @name        Blacklist for Cont.ws
// @namespace   cont.ws
// @version     2.7.1
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
    if (typeof unsafeWindow !== "undefined") {
        storage = unsafeWindow.localStorage;
    }
    else {
        storage = window.localStorage;
    }
    var config = {
    	blackList: [ ],
        count: 1,
        settings: false
    };

    function search(target) {
        var min = 0;
        var max = config.blackList.length - 1;
        var found = -1;
      
        while (min <= max) {
          var mid = Math.round((min + max) / 2);
          if (target < config.blackList[mid]) {
            max = mid - 1;
          }
          else if (target > config.blackList[mid]) {
            min = mid + 1;
          }
          else {
            found = mid;
            break;
          }
        }
      
        return found;
    }
    
    function processElement(el) {
      var anchor = $(el)
                    .find('> a[href], div:not([class *= "recm"]) > a[href]')
                    .filter('[href$=".cont.ws"],[href^="/@"]')
                    .filter(':eq(0)');
      
      var href = anchor.attr('href');
      var name = anchor.attr('title') || anchor.text();
      if (! href) {
        return;
      }
      
      var target = href.toLowerCase()
      			.replace(/^https?:\/\/|\/$/ig, '')
      			.replace(/^\/@|\.cont\.ws$/, '');
      if (! target) {
        return;
      }
      
      var found = search(target);

      if (found !== -1) {
          config.count += 1;
          if (el.tagName === 'LI') {
            config.count += 1;
            $(el).html('Комментарии <a href="' + href + '"><b>' + name + '</b></a> скрыты [ <a id="_restore' + config.count + '" href="#" data-blog="' + target + '" data-name="' + name + '">показать все</a> ]');
            $('#_restore' + config.count).click(deleteFromBlackList);
          }
          else {
            $(el).remove();
          }
      }
      else
      if (! anchor.data('hasBlacklistBtn')) {
          var btnBL = document.createElement("a");
          btnBL.innerHTML = ' [ Скрыть ] ';
          btnBL.href='#';
          $(btnBL).data('name', name);
          $(btnBL).data('blog', target);
          $(btnBL).click(addToBlacklist);
          anchor.after(btnBL);
          anchor.data('hasBlacklistBtn', 1);
      }
    }

    function deleteFromBlackList(ev) {
      ev.preventDefault();
      var blog = $(this).data('blog');
      var name = $(this).data('name');
      if (confirm("Вы действительно хотите снова увидеть статьи и комментарии " + name + "?")) {
        var idx = search(blog);
        var existing = (typeof config.blackList[idx] !== 'undefined');
        if (idx !== -1 && existing) {
          config.blackList.splice(idx, 1);
          saveBlacklist();
          if (config.settings) {
            $(this).parents('li:eq(0)').remove();
          }
          else {
            window.location.reload(false); 
          }
        }
      }
    }
    
    function addToBlacklist(ev) {
      ev.preventDefault();
      var blog = $(this).data('blog');
      var name = $(this).data('name');
      if (confirm("Вы действительно хотите скрыть статьи и комментарии " + name + "?")) {
        config.blackList.push(blog);
        saveBlacklist();
        $(this).html(' [ Скрыт ] ');

        triggerExorcism();
      }
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

    function triggerExorcism() {
      removeBadAuthor();
      removeBadComment();
    }

    function setInquisitionEvents() {
      var posts = document.querySelector('.content > .post');
      if (posts) {
        posts.addEventListener("DOMNodeInserted", function (ev) { processElement(ev.target); });
      }
      var comments = document.querySelector('.comments');
      if (comments) {
        comments.addEventListener("DOMNodeInserted", function (ev) { processElement(ev.target); });
      }
    }

    function callInquisition() {
        setInquisitionEvents();
        triggerExorcism();
    }
    
    function saveBlacklist() {
        config.blackList.sort();
        storage.contBlackList = JSON.stringify(config.blackList);
    }
    
    function loadBlacklist() {
        var blackList = storage.contBlackList;
        config.blackList = JSON.parse(blackList ? blackList : '[]');

        if (! config.blackList instanceof Array) {
           config.blackList = [ ];
        }

        for (var i in config.blackList) {
          var item = config.blackList[i].toLowerCase();
          if (item.match(/\.cont\.ws$/)) {
	    config.blackList[i] = item.replace(/\.cont\.ws$/, '');
          }
          else {
            config.blackList[i] = item;
          }
        }

        config.blackList.sort();
    }
    
    function blacklistSettings() {
        $('ul[role="tablist"]').append('<li role="presentation"><a href="#hidden-users" aria-controls="blacklist" role="tab" data-toggle="tab">Скрытые пользователи</a></li>');
        $('.user_setting > div > .tab-content').append('<div role="tabpanel" class="tab-pane fade" id="hidden-users"><section><div class="jumbotron"><ol id="hidden-users-list"></ol></div></section></div>');
        for (var i in config.blackList) {
          var target = config.blackList[i];
          var name = target;
          $('#hidden-users-list').append('<li><a href="/@' + target + '">' + target + '</a> <span class="pull-right">[ <a href="#" id="hiddenUser' + i + '" data-blog="' + target + '" data-name="' + name + '">показать</a> ]</span></li>');
          $('#hiddenUser' + i).click(deleteFromBlackList);
        }
    }
    
    loadBlacklist();
    config.settings = $('.user_setting').length > 0;
    if (config.settings) {
        blacklistSettings();
    }
    else {
        callInquisition();
    }
  });
});
