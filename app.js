App({
  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = systemInfo
    this.globalData.statusBarHeight = systemInfo.statusBarHeight
    this.globalData.navBarHeight = systemInfo.platform === 'ios' ? 44 : 48
  },

  globalData: {
    systemInfo: null,
    statusBarHeight: 0,
    navBarHeight: 0,
    // 默认贷款参数
    defaultParams: {
      loanType: 'commercial', // commercial | fund | combined
      housePrice: 2000000,    // 房屋总价（元）
      downPaymentRatio: 30,   // 首付比例（%）
      loanAmount: 1400000,    // 贷款金额（元）
      loanYear: 30,           // 贷款年限
      loanRate: 3.95,         // 年利率（%）
      fundAmount: 0,          // 公积金贷款金额
      fundRate: 2.85,         // 公积金利率
      repayType: 'equal-payment', // equal-payment | equal-principal
      startDate: ''           // 首次还款日期
    }
  }
})
