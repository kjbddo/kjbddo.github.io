(function () {
  'use strict';

  var root = document.documentElement;
  var STORAGE_KEY = 'kyobo-portfolio-theme';
  root.classList.add('js');

  function readStored() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function writeStored(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* 저장할 수 없는 환경은 무시한다 */ }
  }
  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }
  function currentTheme() {
    var set = root.getAttribute('data-theme');
    if (set === 'dark' || set === 'light') { return set; }
    return systemPrefersDark() ? 'dark' : 'light';
  }

  // 첫 페인트 전에 저장된 테마를 반영한다(이 스크립트는 head에서 동기 로드된다).
  var stored = readStored();
  if (stored === 'dark' || stored === 'light') { root.setAttribute('data-theme', stored); }

  function init() {
    var themeBtn = document.querySelector('.theme-btn');
    var menuBtn = document.querySelector('.menu-btn');
    var nav = document.getElementById('site-nav');

    // 다크 모드 토글
    function syncThemeButton() {
      if (!themeBtn) { return; }
      var dark = currentTheme() === 'dark';
      var label = themeBtn.querySelector('.sr-only');
      if (label) { label.textContent = dark ? '라이트 모드로 전환' : '다크 모드로 전환'; }
    }
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var next = currentTheme() === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        writeStored(next);
        syncThemeButton();
      });
      syncThemeButton();
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) { mq.addEventListener('change', syncThemeButton); }
        else if (mq.addListener) { mq.addListener(syncThemeButton); }
      }
    }

    // 모바일 메뉴
    function setMenu(open) {
      if (!menuBtn || !nav) { return; }
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var label = menuBtn.querySelector('.sr-only');
      if (label) { label.textContent = open ? '메뉴 닫기' : '메뉴 열기'; }
      // 메뉴는 DOM에서 버튼보다 앞에 있다. 열면 첫 링크로 포커스를 옮겨 Tab 순서를 잇는다.
      if (open) {
        var first = nav.querySelector('a');
        if (first) { first.focus(); }
      }
    }
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', function () {
        setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
      });
      nav.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('a')) { setMenu(false); }
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
          setMenu(false);
          menuBtn.focus();
        }
      });
      document.addEventListener('click', function (e) {
        if (menuBtn.getAttribute('aria-expanded') !== 'true') { return; }
        if (!e.target.closest || !e.target.closest('.site-header')) { setMenu(false); }
      });
      // 포커스가 헤더 밖으로 나가면 닫는다(열린 메뉴가 본문을 가리지 않게).
      var header = document.querySelector('.site-header');
      if (header) {
        header.addEventListener('focusout', function (e) {
          if (menuBtn.getAttribute('aria-expanded') !== 'true') { return; }
          var to = e.relatedTarget;
          if (to && to.closest && !to.closest('.site-header')) { setMenu(false); }
        });
      }
    }

    // 가로 스크롤 영역: 실제로 넘칠 때만 키보드 정지점으로 만든다.
    var scrollers = document.querySelectorAll('.diagram__scroll, .table-scroll');
    function syncScrollers() {
      Array.prototype.forEach.call(scrollers, function (el) {
        if (el.scrollWidth > el.clientWidth + 1) { el.setAttribute('tabindex', '0'); }
        else { el.removeAttribute('tabindex'); }
      });
    }
    if (scrollers.length) {
      window.addEventListener('load', syncScrollers);
      window.addEventListener('resize', syncScrollers);
      syncScrollers();
    }

    // 현재 섹션 표시: 섹션 머리가 화면 위쪽 30% 선을 지난 마지막 섹션을 고른다.
    if (nav) {
      var items = [];
      Array.prototype.forEach.call(nav.querySelectorAll('a[href^="#"]'), function (a) {
        var el = document.getElementById(a.getAttribute('href').slice(1));
        if (el) { items.push({ link: a, el: el }); }
      });
      var activeLink = null;

      var update = function () {
        var doc = document.documentElement;
        var viewH = window.innerHeight || doc.clientHeight;
        var scrollable = doc.scrollHeight - viewH;
        var next = null;
        if (scrollable > 4) {
          var line = viewH * 0.3;
          items.forEach(function (item) {
            if (item.el.getBoundingClientRect().top <= line) { next = item.link; }
          });
          var y = window.pageYOffset || doc.scrollTop || 0;
          if (y >= scrollable - 2 && items.length) { next = items[items.length - 1].link; }
        }
        if (next === activeLink) { return; }
        if (activeLink) { activeLink.removeAttribute('aria-current'); }
        if (next) { next.setAttribute('aria-current', 'true'); }
        activeLink = next;
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      window.addEventListener('load', update);
      update();
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
