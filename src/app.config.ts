export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/queue/index',
    'pages/quota/index',
    'pages/mine/index',
    'pages/room-detail/index',
    'pages/booking-confirm/index',
    'pages/records/index',
    'pages/family-members/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '共享琴房',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#9CA3AF',
    selectedColor: '#2D5BFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '琴房'
      },
      {
        pagePath: 'pages/queue/index',
        text: '候补'
      },
      {
        pagePath: 'pages/quota/index',
        text: '额度'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
