
module.exports = {
  mode: 'universal',
  /*
  ** Headers of the page
  */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  /*
  ** Customize the progress-bar color
  */
  loading: { color: '#fff' },
  /*
  ** Global CSS
  */
  css: [
    '@/assets/css/main.scss'
  ],
  /*
  ** Plugins to load before mounting the App
  */
  plugins: [
    { src: '~/plugins/vue-infinite-scroll', mode: 'client' },
    // { src: '~/plugins/vue-masonry', mode: 'client' },
    // { src: '~/plugins/vue-masonry-css', mode: 'client' },
    { src: '~/plugins/vue-masonry-css' },
    { src: '~/plugins/vue-virtual-scroll-list' },
    { src: '~/plugins/v-lazy-image', mode: 'client' },
  ],
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    ['@nuxtjs/dotenv', { filename: `.env.${process.env.NODE_ENV}` }]
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/toast',
    'cookie-universal-nuxt',
  ],
  toast: {
    duration: 2000,
    position: 'top-center',
    containerClass: 'g-toast'
  },
  serverMiddleware: [
    { path: '/api/load', handler: '~/api/load.js' },
    { path: '/api/save', handler: '~/api/save.js' },
    { path: '/api/remove', handler: '~/api/remove.js' },
  ],
  /*
  ** Build configuration
  */
  build: {
    /*
    ** You can extend webpack config here
    */
    extend(config, ctx) {
    }
  },
  render: {
    static: {
      cacheControl: true,
      maxAge: 60 * 60 * 24 * 7,
      lastModified: true,
      etag: true,
      // setHeaders(res) {
      //   res.setHeader('X-Frame-Options', 'ALLOWALL')
    }
  }
}
