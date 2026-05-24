const calc = require('../../utils/calculator.js')

Page({
  data: {
    loanType: 'commercial',
    repayType: 'equal-payment',
    housePrice: 200,
    downPaymentRatio: 30,
    loanYear: 30,
    loanRate: 3.95,
    fundAmount: 60,
    fundRate: 2.85,
    result: null,
    compareResult: null,
    showCompare: false,
    // 焦点状态
    housePriceFocus: false,
    loanRateFocus: false,
    fundAmountFocus: false
  },

  // 计算衍生值
  get computed() {
    const housePrice = parseFloat(this.data.housePrice) || 0
    const ratio = this.data.downPaymentRatio / 100
    const loanAmount = housePrice * (1 - ratio)
    return {
      loanAmount: Math.round(loanAmount * 100) / 100,
      downPayment: Math.round(housePrice * ratio * 100) / 100,
      downPaymentDisplay: (Math.round(housePrice * ratio * 100) / 100).toFixed(2),
      loanAmountDisplay: (Math.round(loanAmount * 100) / 100).toFixed(2)
    }
  },

  onLoad() {
    this.updateComputed()
  },

  // 更新计算字段
  updateComputed() {
    const c = this.computed
    this.setData({
      loanAmount: c.loanAmount.toFixed(2),
      downPaymentDisplay: c.downPaymentDisplay
    })
  },

  // 贷款类型切换
  switchLoanType(e) {
    const type = e.currentTarget.dataset.type
    let update = { loanType: type }
    if (type === 'fund') {
      update.loanRate = 2.85
    } else if (type === 'commercial') {
      update.loanRate = 3.95
    }
    this.setData(update, () => {
      if (this.data.result) this.calculate()
    })
  },

  // 还款方式切换
  switchRepayType(e) {
    this.setData({ repayType: e.currentTarget.dataset.type }, () => {
      if (this.data.result) this.calculate()
    })
  },

  // 设置首付比例
  setDownPayment(e) {
    this.setData({ downPaymentRatio: e.currentTarget.dataset.ratio }, () => {
      this.updateComputed()
      if (this.data.result) this.calculate()
    })
  },

  // 设置贷款年限
  setLoanYear(e) {
    this.setData({ loanYear: e.currentTarget.dataset.year }, () => {
      if (this.data.result) this.calculate()
    })
  },

  // 输入事件
  onHousePriceInput(e) {
    this.setData({ housePrice: e.detail.value }, () => {
      this.updateComputed()
      if (this.data.result) this.calculate()
    })
  },

  onLoanRateInput(e) {
    this.setData({ loanRate: e.detail.value })
  },

  onFundAmountInput(e) {
    this.setData({ fundAmount: e.detail.value })
  },

  onFundRateInput(e) {
    this.setData({ fundRate: e.detail.value })
  },

  onFocus(e) {
    const field = e.currentTarget.dataset.field + 'Focus'
    this.setData({ [field]: true })
  },

  onBlur(e) {
    const field = e.currentTarget.dataset.field + 'Focus'
    this.setData({ [field]: false })
  },

  // 开始计算
  calculate() {
    const { loanType, repayType, loanRate, loanYear, fundAmount, fundRate } = this.data
    const loanAmount = parseFloat(this.data.loanAmount) || 0
    const rate = parseFloat(loanRate) || 0
    const years = parseInt(loanYear)
    const fundAmt = parseFloat(fundAmount) || 0
    const fundRt = parseFloat(fundRate) || 0

    if (loanAmount <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' })
      return
    }

    let result = null

    if (loanType === 'combined') {
      const commercialAmt = Math.max(0, loanAmount - fundAmt)
      const combined = calc.calcCombined(commercialAmt, rate, fundAmt, fundRt, years)
      result = {
        monthlyPayment: combined.monthlyPayment,
        monthlyDisplay: calc.formatMoney(combined.monthlyPayment),
        totalPayment: combined.totalPayment,
        totalPaymentDisplay: (combined.totalPayment / 10000).toFixed(2),
        totalInterest: combined.totalInterest,
        totalInterestDisplay: (combined.totalInterest / 10000).toFixed(2),
        months: combined.months,
        loanAmountDisplay: loanAmount.toFixed(2),
        commercial: {
          monthlyPayment: combined.commercial.monthlyPayment,
          monthlyDisplay: calc.formatMoney(combined.commercial.monthlyPayment)
        },
        fund: {
          monthlyPayment: combined.fund.monthlyPayment,
          monthlyDisplay: calc.formatMoney(combined.fund.monthlyPayment)
        }
      }
    } else if (repayType === 'equal-payment') {
      const r = calc.calcEqualPayment(loanAmount * 10000, rate, years)
      result = {
        monthlyPayment: r.monthlyPayment,
        monthlyDisplay: calc.formatMoney(r.monthlyPayment),
        totalPayment: r.totalPayment,
        totalPaymentDisplay: (r.totalPayment / 10000).toFixed(2),
        totalInterest: r.totalInterest,
        totalInterestDisplay: (r.totalInterest / 10000).toFixed(2),
        months: r.months,
        loanAmountDisplay: loanAmount.toFixed(2)
      }
    } else {
      const r = calc.calcEqualPrincipal(loanAmount * 10000, rate, years)
      result = {
        monthlyPayment: r.firstPayment,
        monthlyDisplay: calc.formatMoney(r.firstPayment),
        firstPayment: r.firstPayment,
        firstPaymentDisplay: calc.formatMoney(r.firstPayment),
        lastPayment: r.lastPayment,
        monthlyDecrease: r.monthlyDecrease,
        monthlyDecreaseDisplay: calc.formatMoney(r.monthlyDecrease),
        totalPayment: r.totalPayment,
        totalPaymentDisplay: (r.totalPayment / 10000).toFixed(2),
        totalInterest: r.totalInterest,
        totalInterestDisplay: (r.totalInterest / 10000).toFixed(2),
        months: r.months,
        loanAmountDisplay: loanAmount.toFixed(2)
      }
    }

    // 生成对比数据
    if (loanType !== 'combined') {
      const ep = calc.calcEqualPayment(loanAmount * 10000, rate, years)
      const epr = calc.calcEqualPrincipal(loanAmount * 10000, rate, years)
      this.setData({
        result,
        showCompare: true,
        compareResult: {
          equalPaymentDisplay: calc.formatMoney(ep.monthlyPayment),
          equalPrincipalDisplay: calc.formatMoney(epr.firstPayment),
          equalPaymentTotalInterestDisplay: (ep.totalInterest / 10000).toFixed(2),
          equalPrincipalTotalInterestDisplay: (epr.totalInterest / 10000).toFixed(2),
          savedInterestDisplay: ((ep.totalInterest - epr.totalInterest) / 10000).toFixed(2)
        }
      })
    } else {
      this.setData({ result, showCompare: false })
    }

    // 存储结果供还款计划页面使用
    const app = getApp()
    app.globalData.calcResult = {
      loanType, repayType, loanAmount, loanRate: rate, loanYear: years,
      fundAmount: fundAmt, fundRate: fundRt,
      result
    }
  },

  // 查看还款计划
  viewSchedule() {
    wx.switchTab({ url: '/pages/schedule/schedule' })
  }
})
