// ==UserScript==
// @name         Baidu iQIYI
// @description  Watch videos in external player.
// @version      1.0.0
// @match        *://*.iq.com/play/*
// @icon         https://www.iq.com/favicon.ico
// @run-at       document-end
// @grant        unsafeWindow
// @grant        GM_startIntent
// @homepage     https://github.com/warren-bank/crx-Baidu-iQIYI/tree/webmonkey-userscript/es5
// @supportURL   https://github.com/warren-bank/crx-Baidu-iQIYI/issues
// @downloadURL  https://github.com/warren-bank/crx-Baidu-iQIYI/raw/webmonkey-userscript/es5/webmonkey-userscript/Baidu-iQIYI.user.js
// @updateURL    https://github.com/warren-bank/crx-Baidu-iQIYI/raw/webmonkey-userscript/es5/webmonkey-userscript/Baidu-iQIYI.user.js
// @namespace    warren-bank
// @author       Warren Bank
// @copyright    Warren Bank
// ==/UserScript==

// ----------------------------------------------------------------------------- constants

var user_options = {
  "common": {
    "caption_language": "English"
  },
  "webmonkey": {
    "post_intent_redirect_to_url":  "about:blank"
  },
  "greasemonkey": {
    "redirect_to_webcast_reloaded": true,
    "force_http":                   true,
    "force_https":                  false
  }
}

// ----------------------------------------------------------------------------- helper (cookies):

var cookie_cache = null

var init_cookie_cache = function() {
  if (cookie_cache) return
  cookie_cache = {}

  var cookies = unsafeWindow.document.cookie.split(';')
  var cookie, index, name, value
  for (var i=0; i < cookies.length; i++) {
    cookie = cookies[i].trim()
    index = cookie.indexOf('=')
    if (index <= 0) continue;

    name  = cookie.substring(0, index).trim()
    value = cookie.substring(index + 1, cookie.length).trim()

    cookie_cache[name] = value
  }
}

var get_cookie = function(name) {
  init_cookie_cache()
  return cookie_cache[name]
}

var set_cookie = function(name, value) {
  var expires = (new Date(Date.now() + (400*24*60*60*1000))).toUTCString()
  unsafeWindow.document.cookie = name + '=' + value + '; expires=' + expires + '; path=/'
  cookie_cache[name] = value
}

// ----------------------------------------------------------------------------- URL links to tools on Webcast Reloaded website

var get_webcast_reloaded_url = function(video_url, caption_url, referer_url, drm_scheme, drm_server, force_http, force_https) {
  force_http  = (typeof force_http  === 'boolean') ? force_http  : user_options.greasemonkey.force_http
  force_https = (typeof force_https === 'boolean') ? force_https : user_options.greasemonkey.force_https

  var encoded_video_url, encoded_caption_url, encoded_referer_url, encoded_drm_url, webcast_reloaded_base, webcast_reloaded_url

  encoded_video_url     = encodeURIComponent(encodeURIComponent(btoa(video_url)))
  encoded_caption_url   = caption_url ? encodeURIComponent(encodeURIComponent(btoa(caption_url))) : null
  referer_url           = referer_url ? referer_url : unsafeWindow.location.href
  encoded_referer_url   = encodeURIComponent(encodeURIComponent(btoa(referer_url)))
  encoded_drm_url       = (drm_scheme && drm_server) ? encodeURIComponent(encodeURIComponent(btoa(drm_scheme + '|' + drm_server))) : null

  webcast_reloaded_base = {
    "https": "https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html",
    "http":  "http://webcast-reloaded.frii.site/index.html"
  }

  webcast_reloaded_base = (force_http)
                            ? webcast_reloaded_base.http
                            : (force_https)
                               ? webcast_reloaded_base.https
                               : (video_url.toLowerCase().indexOf('http:') === 0)
                                  ? webcast_reloaded_base.http
                                  : webcast_reloaded_base.https

  webcast_reloaded_url  = webcast_reloaded_base    + '#/watch/'    + encoded_video_url
                            + (encoded_caption_url ? ('/subtitle/' + encoded_caption_url) : '')
                            + (encoded_referer_url ? ('/referer/'  + encoded_referer_url) : '')
                            + (encoded_drm_url     ? ('/drm/'      + encoded_drm_url) : '')

  return webcast_reloaded_url
}

// ----------------------------------------------------------------------------- URL redirect

var determine_video_type = function(video_url) {
  if (!video_url) return null

  var video_url_regex_pattern = /^.*\.(mp4|mp4v|mpv|m1v|m4v|mpg|mpg2|mpeg|xvid|webm|3gp|avi|mov|mkv|ogv|ogm|m3u8|mpd|ism(?:[vc]|\/manifest)?)(?:[\?#].*)?$/i
  var matches, file_ext, video_type

  matches = video_url_regex_pattern.exec(video_url)

  if (matches && matches.length)
    file_ext = matches[1]

  if (file_ext) {
    switch (file_ext) {
      case "mp4":
      case "mp4v":
      case "m4v":
        video_type = "video/mp4"
        break
      case "mpv":
        video_type = "video/MPV"
        break
      case "m1v":
      case "mpg":
      case "mpg2":
      case "mpeg":
        video_type = "video/mpeg"
        break
      case "xvid":
        video_type = "video/x-xvid"
        break
      case "webm":
        video_type = "video/webm"
        break
      case "3gp":
        video_type = "video/3gpp"
        break
      case "avi":
        video_type = "video/x-msvideo"
        break
      case "mov":
        video_type = "video/quicktime"
        break
      case "mkv":
        video_type = "video/x-mkv"
        break
      case "ogg":
      case "ogv":
      case "ogm":
        video_type = "video/ogg"
        break
      case "m3u8":
        video_type = "application/x-mpegURL"
        break
      case "mpd":
        video_type = "application/dash+xml"
        break
      case "ism":
      case "ism/manifest":
      case "ismv":
      case "ismc":
        video_type = "application/vnd.ms-sstr+xml"
        break
    }
  }

  return video_type ? video_type.toLowerCase() : ""
}

var redirect_to_url = function(url) {
  if (!url) return

  try {
    unsafeWindow.top.location = url
  }
  catch(e) {
    unsafeWindow.window.location = url
  }
}

var process_webmonkey_post_intent_redirect_to_url = function() {
  var url = null

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'string')
    url = user_options.webmonkey.post_intent_redirect_to_url

  if (typeof user_options.webmonkey.post_intent_redirect_to_url === 'function')
    url = user_options.webmonkey.post_intent_redirect_to_url()

  if (typeof url === 'string')
    redirect_to_url(url)
}

var process_video_data = function(data) {
  if (!data.video_url) return

  if (!data.referer_url)
    data.referer_url = unsafeWindow.location.href

  if (typeof GM_startIntent === 'function') {
    // running in Android-WebMonkey: open Intent chooser

    if (!data.video_type)
      data.video_type = determine_video_type(data.video_url)

    var args = [
      /* action = */ 'android.intent.action.VIEW',
      /* data   = */ data.video_url,
      /* type   = */ data.video_type
    ]

    // extras:
    if (data.caption_url) {
      args.push('textUrl')
      args.push(data.caption_url)
    }
    if (data.referer_url) {
      args.push('referUrl')
      args.push(data.referer_url)
    }
    if (data.drm.scheme) {
      args.push('drmScheme')
      args.push(data.drm.scheme)
    }
    if (data.drm.server) {
      args.push('drmUrl')
      args.push(data.drm.server)
    }
    if (data.drm.headers && (typeof data.drm.headers === 'object')) {
      var drm_header_keys, drm_header_key, drm_header_val

      drm_header_keys = Object.keys(data.drm.headers)
      for (var i=0; i < drm_header_keys.length; i++) {
        drm_header_key = drm_header_keys[i]
        drm_header_val = data.drm.headers[drm_header_key]

        args.push('drmHeader')
        args.push(drm_header_key + ': ' + drm_header_val)
      }
    }

    GM_startIntent.apply(this, args)
    process_webmonkey_post_intent_redirect_to_url()
    return true
  }
  else if (user_options.greasemonkey.redirect_to_webcast_reloaded) {
    // running in standard web browser: redirect URL to top-level tool on Webcast Reloaded website

    redirect_to_url(get_webcast_reloaded_url(data.video_url, data.caption_url, data.referer_url, data.drm.scheme, data.drm.server))
    return true
  }
  else {
    return false
  }
}

// -------------------------------------

var process_hls_data = function(data) {
  data.video_type = 'application/x-mpegurl'
  process_video_data(data)
}

var process_dash_data = function(data) {
  data.video_type = 'application/dash+xml'
  process_video_data(data)
}

// -------------------------------------

var process_video_url = function(video_url, video_type, caption_url, referer_url, drm_scheme, drm_server) {
  var data = {
    drm: {
      scheme:    drm_scheme || null,
      server:    drm_server || null,
      headers:   null
    },
    video_url:   video_url   || null,
    video_type:  video_type  || null,
    caption_url: caption_url || null,
    referer_url: referer_url || null
  }

  process_video_data(data)
}

var process_hls_url = function(video_url, caption_url, referer_url, drm_scheme, drm_server) {
  process_video_url(video_url, /* video_type= */ 'application/x-mpegurl', caption_url, referer_url, drm_scheme, drm_server)
}

var process_dash_url = function(video_url, caption_url, referer_url, drm_scheme, drm_server) {
  process_video_url(video_url, /* video_type= */ 'application/dash+xml', caption_url, referer_url, drm_scheme, drm_server)
}

// ----------------------------------------------------------------------------- process video page

var inspect_video_dom_scripts = function() {
  var script, regex, match, video_url, video_type, caption_obj, caption_url, video

  script = unsafeWindow.document.querySelector('script#__NEXT_DATA__[type="application/json"]')
  if (!script) return null

  script = script.textContent

  regex = {
    dash_url:     /"mpdUrl":"([^"]+)"/i,
    hls_url:      /"m3u8Url":"([^"]+)"/i,
    hls_manifest: /"m3u8":"(#EXTM3U\\n[^"]+)"/i,
    caption_obj:  new RegExp('(\\{"_name":"' + user_options.common.caption_language + '",[^\\}]+\\})', 'i')
  }

  if (!video_url) {
    match = regex.dash_url.exec(script)
    if (match) {
      video_url  = JSON.parse('"' + match[1] + '"') + '#video.mpd'
      video_type = 'application/dash+xml'
    }
  }
  if (!video_url) {
    match = regex.hls_url.exec(script)
    if (match) {
      video_url  = JSON.parse('"' + match[1] + '"') + '#video.m3u8'
      video_type = 'application/x-mpegurl'
    }
  }
  if (!video_url) {
    match = regex.hls_manifest.exec(script)
    if (match) {
      video_url  = 'https://httpbun.com/mix/s=200/h=' + encodeURIComponent('content-type:application/x-mpegurl') + '/b64=' + encodeURIComponent(btoa(JSON.parse('"' + match[1] + '"'))) + '#video.m3u8'
      video_type = 'application/x-mpegurl'
    }
  }
  if (!video_url)
    return null
  if (video_url[0] === '/')
    video_url = 'https://data.video.iqiyi.com' + video_url

  try {
    match = regex.caption_obj.exec(script)
    if (match) {
      caption_obj = JSON.parse(match[1])
      caption_url = null

      if (!caption_url && caption_obj.webvtt)
        caption_url = caption_obj.webvtt + '#caption.' + user_options.common.caption_language + '.vtt'
      if (!caption_url && caption_obj.srt)
        caption_url = caption_obj.srt + '#caption.' + user_options.common.caption_language + '.srt'
      if (!caption_url)
        throw 'attribute not found'
      if (caption_url[0] === '/')
        caption_url = 'https://meta.video.iqiyi.com' + caption_url
    }
  }
  catch(e) {}

  video = {
    drm: {
      scheme:    null,
      server:    null,
      headers:   null
    },
    video_url:   video_url   || null,
    video_type:  video_type  || null,
    caption_url: caption_url || null,
    referer_url: null
  }

  return video
}

// -------------------------------------

var init = function() {
  var cookie = get_cookie('DidInitQiyiPlayerBID')
  if (cookie !== '1') {
    // initialize default video resolution
    set_cookie('DidInitQiyiPlayerBID', '1')
    set_cookie('QiyiPlayerBID', '500')
    unsafeWindow.location.reload()
    return
  }

  var video = inspect_video_dom_scripts()

  if (video) {
    process_video_data(video)
    set_cookie('DidInitQiyiPlayerBID', '0')
  }
  else {
    // decrease default video resolution
    cookie = get_cookie('QiyiPlayerBID')
    switch(cookie) {
      case '500':
        video = '300'
        break
      case '300':
        video = '200'
        break
    }

    if (video) {
      set_cookie('QiyiPlayerBID', video)
      unsafeWindow.location.reload()
    }
    else {
      // quit
      set_cookie('DidInitQiyiPlayerBID', '0')
    }
  }
}

init()
