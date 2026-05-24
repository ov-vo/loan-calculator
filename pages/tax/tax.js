const calc = require('../../utils/calculator.js')

Page({
  data: {
    housePrice: 300,
    area: 90,
    buyerType: 'first',
    houseType: 'normal',
    houseAge: 0,
    isUnique: false,
    originalPrice: 200,
    result: null,
    housePriceFocus: false,
    areaFocus: false,
    originalPriceFocus: false
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

  setBuyerType(e) {
    this.setData({ buyerType: e.currentTarget.dataset.type })
  },

  setHouseType(e) {
    this.setData({ houseType: e.currentTarget.dataset.type })
  },

  setHouseAge(e) {
    this.setData({ houseAge: parseInt(e.currentTarget.dataset.age) })
  },

  setUnique(e) {
    this.setData({ isUnique: e.currentTarget.dataset.unique === 'true' || e.currentTarget.dataset.unique === true })
  },

  calculate() {
    const { housePrice, area, buyerType, houseType, houseAge, isUnique, originalPrice } = this.data
    const hp = parseFloat(housePrice)
    const ar = parseFloat(area)
    const op = parseFloat(originalPrice) || 0

    if (!hp || !ar || hp <= 0 || ar <= 0) {
      wx.showToast({ title: '请输入有效的房屋总价和面积', icon: 'none' })
      return
    }

    const result = calc.calcTax({
      housePrice: hp * 10000,
      area: ar,
      buyerType,
      houseType,
      houseAge,
      isUnique,
      originalPrice: op * 10000
    })

    this.setData({
      result: {
        ...result,
        totalTaxDisplay: (result.totalTax / 10000).toFixed(2),
        buyerTotalDisplay: (result.buyerTotal / 10000).toFixed(2),
        sellerTotalDisplay: (result.sellerTotal / 10000).toFixed(2),
        breakdown: result.breakdown.map(item => ({
          ...item,
          displayAmount: (item.amount / 10000).toFixed(2)
        }))
      }
    })
  }
})
