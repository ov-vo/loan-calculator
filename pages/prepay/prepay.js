const calc = require('../../utils/calculator.js')

Page({
  data: {
    loanAmount: 140,
    loanRate: 3.95,
    loanYear: 30,
    repayType: 'equal-payment',
    paidMonths: 36,
    prepayAmount: 30,
    prepayType: 'reduce-month',
    result: null,
    // 焦点
    loanAmountFocus: false,
    loanRateFocus: false,
    paidMonthsFocus: false,
    prepayAmountFocus: false
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  },

  onFocus(e) {
    const field = e.currentTarget.dataset.field + 'Focus'
    this.setData({ [field]: true })
  },

  onBlur(e) {
    const field = e.currentTarget.dataset.field + 'Focus'
    this.setData({ [field]: false })
  },

  setLoanYear(e) {
    this.setData({ loanYear: e.currentTarget.dataset.year })
  },

  setRepayType(e) {
    this.setData({ repayType: e.currentTarget.dataset.type })
  },

  setPrepayType(e) {
    this.setData({ prepayType: e.currentTarget.dataset.type })
  },

  calculate() {
    const { loanAmount, loanRate, loanYear, repayType, paidMonths, prepayAmount, prepayType } = this.data
    const principal = parseFloat(loanAmount) * 10000
    const rate = parseFloat(loanRate)
    const years = parseInt(loanYear)
    const paid = parseInt(paidMonths)
    const prepay = parseFloat(prepayAmount) * 10000
    const totalMonths = years * 12

    if (isNaN(principal) || principal <= 0) {
      wx.showToast({ title: '请输入有效贷款金额', icon: 'none' })
      return
    }
    if (paid >= totalMonths) {
      wx.showToast({ title: '已还期数超过总期数', icon: 'none' })
      return
    }
    if (prepay <= 0) {
      wx.showToast({ title: '请输入有效提前还款金额', icon: 'none' })
      return
    }

    const result = calc.calcPrepayment(principal, rate, years, paid, prepay, repayType, prepayType)

    this.setData({
      result: {
        ...result,
        paidInterestDisplay: (result.paidInterest / 10000).toFixed(2),
        remainingBeforeDisplay: (result.remainingBefore / 10000).toFixed(2),
        remainingAfterDisplay: (result.remainingAfter / 10000).toFixed(2),
        interestSavedDisplay: (result.interestSaved / 10000).toFixed(2),
        originalMonthlyDisplay: calc.formatMoney(result.originalMonthlyPayment),
        newMonthlyDisplay: calc.formatMoney(result.newMonthlyPayment),
        newYears: result.newResult.newMonths ? (result.newResult.newMonths / 12).toFixed(1) : years - paid / 12,
        prepayAmountDisplay: prepayAmount
      }
    })
  }
})
