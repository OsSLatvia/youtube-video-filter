Add on for firefox or chromium, that adds filter button on youtube sidebar, above home button, that allows to filter recomended videos by age, views, length, ect.

link to firefox addon : https://addons.mozilla.org/en-GB/firefox/addon/youtube-video-filter/

link to chrome addon : https://chromewebstore.google.com/detail/youtube-recommendation-fi/gldcpndmolfbdlgmmiljfiknidjgbbfh?authuser=0&hl=en

File functions, main logic in "content" folder:

  storage — saving/loading settings  
  utils — parsing & helpers  
  language — timestamp & view count localization  
  filters — core filtering logic  
  mutations — detecting new videos  
  ui — filter menu and interaction  
  main — glue that connects everything
